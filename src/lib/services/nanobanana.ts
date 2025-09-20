import https from 'https'
import { GeminiPanelPlan } from './gemini'

interface NanobananaPanelPayload {
  id: string
  layout: 'full' | 'split'
  aspect_ratio: string
  prompt: string
  dialogues: string[]
  sustainable_actions: string[]
  sdg_alignment: string
  nep2020_link: string
}

export interface NanobananaPanelArt {
  panel_id: string
  image_url: string
}

interface GeneratePanelArtArgs {
  questSlug: string
  questTitle: string
  panels: GeminiPanelPlan[]
}

interface FetchFailure {
  endpoint: string
  reason: unknown
}

type FetchInit = RequestInit & {
  agent?: https.Agent | ((parsedUrl: URL) => https.Agent)
}

const DEFAULT_MODEL = 'nanobanana-comic-panels-v1'

const DEFAULT_ENDPOINTS = [
  'https://api.nanobanana.ai/v1/panels:generate',
  'https://nanobanana-api.up.railway.app/v1/panels:generate',
  'https://nanobanana.up.railway.app/v1/panels:generate'
]

const environmentEndpoints = [
  process.env.NANOBANANA_API_ENDPOINT,
  process.env.NEXT_PUBLIC_NANOBANANA_API_ENDPOINT,
  process.env.NANOBANANA_API_URL,
  process.env.NEXT_PUBLIC_NANOBANANA_API_URL
]
  .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

const agentCache = new Map<boolean, https.Agent>()

function getAgent(allowInsecureTLS: boolean): https.Agent | undefined {
  if (!allowInsecureTLS) return undefined
  if (!agentCache.has(true)) {
    agentCache.set(true, new https.Agent({ rejectUnauthorized: false }))
  }
  return agentCache.get(true)
}

function getCandidateEndpoints(): string[] {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const endpoint of [...environmentEndpoints, ...DEFAULT_ENDPOINTS]) {
    const trimmed = endpoint.replace(/\s+/g, '')
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    unique.push(trimmed)
  }
  return unique
}

const shouldUseStub = () => process.env.NEXT_PUBLIC_USE_NANOBANANA_STUB === 'true'

const allowInsecureEnv = process.env.NANOBANANA_ALLOW_INSECURE_TLS === 'true'

function buildPanelPrompt(panel: GeminiPanelPlan, isHeroPanel: boolean): string {
  const dialogueText = panel.dialogue
    .map(line => `${line.speaker}: ${line.line}`)
    .join('\n')

  const sustainableNotes = panel.sustainable_actions.length
    ? `Sustainable actions highlighted: ${panel.sustainable_actions.join(', ')}.`
    : ''

  const layoutInstruction = isHeroPanel
    ? 'Hero splash art with a single immersive frame.'
    : 'Split layout panel combining up to three mini-scenes that stay focused on the same moment.'

  return [
    `${panel.headline}.`,
    panel.narration,
    `Anchor it around: ${panel.realtime_anchor}.`,
    sustainableNotes,
    `SDG focus: ${panel.sdg_alignment}.` ,
    `NEP2020 link: ${panel.nep2020_link}.`,
    `Dialogue cues:\n${dialogueText}`,
    `Artist notes: ${panel.image_prompt}.`,
    `Layout rule: ${layoutInstruction}`
  ]
    .filter(Boolean)
    .join('\n\n')
}

function mapToFallbackArt(panels: GeminiPanelPlan[]): NanobananaPanelArt[] {
  const fallbackPaths = [
    '/story-panels/happy-river/p1.png',
    '/story-panels/happy-river/p2.png',
    '/story-panels/happy-river/p3.png',
    '/story-panels/happy-river/p4.png',
    '/story-panels/happy-river/p5.png'
  ]

  return panels.map((panel, index) => ({
    panel_id: panel.panel_id,
    image_url: fallbackPaths[index % fallbackPaths.length]
  }))
}

function isTlsRelatedError(reason: unknown): boolean {
  if (!reason || typeof reason !== 'object') {
    return false
  }

  const possibleError = reason as { code?: unknown; message?: unknown; cause?: unknown }

  const code = typeof possibleError.code === 'string' ? possibleError.code : undefined
  if (code && code.startsWith('ERR_TLS_')) {
    return true
  }

  const message = typeof possibleError.message === 'string' ? possibleError.message : undefined
  if (message && (
    message.includes('self signed certificate') ||
    message.includes('Hostname/IP does not match certificate') ||
    message.includes('certificate')
  )) {
    return true
  }

  if (possibleError.cause) {
    return isTlsRelatedError(possibleError.cause)
  }

  return false
}

async function requestPanelArt(endpoint: string, payload: string, apiKey: string, allowInsecureTLS: boolean) {
  const init: FetchInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: payload
  }

  const agent = getAgent(allowInsecureTLS)
  if (agent && endpoint.startsWith('https')) {
    init.agent = agent
  }

  const response = await fetch(endpoint, init)

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Nanobanana request failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const body = await response.json() as {
    panels?: Array<{ panel_id?: string; id?: string; image_url?: string; image_b64?: string }>
  }

  const art = (body.panels || [])
    .map(panelResult => {
      const id = panelResult.panel_id || panelResult.id
      const image = panelResult.image_url || (panelResult.image_b64 ? `data:image/png;base64,${panelResult.image_b64}` : undefined)
      if (!id || !image) {
        return null
      }
      return { panel_id: id, image_url: image }
    })
    .filter((entry): entry is NanobananaPanelArt => Boolean(entry))

  return art
}

async function attemptEndpoints(args: {
  endpoints: string[]
  payload: string
  apiKey: string
  expectedPanels: number
  allowInsecureTLS: boolean
  panels: GeminiPanelPlan[]
}): Promise<{ art?: NanobananaPanelArt[]; failures: FetchFailure[] }> {
  const { endpoints, payload, apiKey, expectedPanels, allowInsecureTLS, panels } = args
  const failures: FetchFailure[] = []

  for (const endpoint of endpoints) {
    try {
      const art = await requestPanelArt(endpoint, payload, apiKey, allowInsecureTLS)

      if (art.length === expectedPanels) {
        return { art, failures }
      }

      console.warn('[Nanobanana] Incomplete art response, using fallback to fill missing panels.', { endpoint, returned: art.length, expected: expectedPanels })
      const fallback = mapToFallbackArt(panels)
      const fallbackMap = new Map(fallback.map(item => [item.panel_id, item.image_url]))
      const merged = panels.map(panel => ({
        panel_id: panel.panel_id,
        image_url: art.find(item => item.panel_id === panel.panel_id)?.image_url || fallbackMap.get(panel.panel_id) || fallback[0].image_url
      }))

      return { art: merged, failures }
    } catch (error) {
      failures.push({ endpoint, reason: error })
    }
  }

  return { failures }
}

export async function generatePanelArt(args: GeneratePanelArtArgs): Promise<NanobananaPanelArt[]> {
  const { questSlug, questTitle, panels } = args

  if (panels.length === 0) {
    return []
  }

  if (shouldUseStub()) {
    return mapToFallbackArt(panels)
  }

  const envApiKey = process.env.NANOBANANA_API_KEY || process.env.NEXT_PUBLIC_NANOBANANA_API_KEY
  const apiKey = envApiKey || 'AIzaSyDXZ8a4RFpIxB8R_4wLXVtbI6rAeF4_l-E'

  if (!apiKey) {
    console.warn('[Nanobanana] Missing API key, using fallback art set.')
    return mapToFallbackArt(panels)
  }

  const payload = JSON.stringify({
    model: DEFAULT_MODEL,
    quest: {
      slug: questSlug,
      title: questTitle,
      sdg_focus: 'SDG13 · Climate Action',
      nep2020_alignment: 'Experiential, joyful, multidisciplinary learning per NEP2020 guidance',
      layout_rules: 'Panel 1 is full-bleed hero art. Panels 2-5 use split collage with 2-3 moments each, matching the described scene.'
    },
    panels: panels.map((panel, index): NanobananaPanelPayload => ({
      id: panel.panel_id,
      layout: panel.layout,
      aspect_ratio: panel.layout === 'full' ? '3:4' : '5:4',
      prompt: buildPanelPrompt(panel, index === 0),
      dialogues: panel.dialogue.map(line => `${line.speaker}: ${line.line}`),
      sustainable_actions: panel.sustainable_actions,
      sdg_alignment: panel.sdg_alignment,
      nep2020_link: panel.nep2020_link
    }))
  })

  const endpoints = getCandidateEndpoints()
  const aggregateFailures: FetchFailure[] = []

  // First attempt honours the environment flag. If insecure TLS is explicitly enabled, we try that first.
  const firstAttempt = await attemptEndpoints({
    endpoints,
    payload,
    apiKey,
    expectedPanels: panels.length,
    allowInsecureTLS: allowInsecureEnv,
    panels
  })

  if (firstAttempt.art) {
    return firstAttempt.art
  }

  aggregateFailures.push(...firstAttempt.failures)

  const tlsDetected = firstAttempt.failures.some(failure => isTlsRelatedError(failure.reason))

  if (!allowInsecureEnv && tlsDetected) {
    console.warn('[Nanobanana] TLS mismatch detected. Retrying with insecure TLS (development fallback). Set NANOBANANA_ALLOW_INSECURE_TLS="true" to skip this extra retry.')

    const insecureAttempt = await attemptEndpoints({
      endpoints,
      payload,
      apiKey,
      expectedPanels: panels.length,
      allowInsecureTLS: true,
      panels
    })

    aggregateFailures.push(...insecureAttempt.failures)

    if (insecureAttempt.art) {
      return insecureAttempt.art
    }
  }

  if (aggregateFailures.length > 0) {
    console.error('[Nanobanana] Falling back to seed art set. Tried endpoints:', aggregateFailures)
  }

  if (!tlsDetected) {
    console.error('[Nanobanana] No reachable Nanobanana endpoint responded with art. Provide a working NANOBANANA_API_ENDPOINT to enable live rendering.')
  }

  return mapToFallbackArt(panels)
}
