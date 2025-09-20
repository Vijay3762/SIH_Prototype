import fs from 'fs/promises'
import path from 'path'
import questsSeed from '@/data/quests.json'
import { Quest, QuizQuest } from '@/types'
import { GeminiPanelPlan } from './gemini'

export interface PanelAsset {
  panel_id: string
  image_path: string
}

interface NanoBananaArgs {
  questId: string
  questTitle: string
  panelPlans: GeminiPanelPlan[]
}

const DEFAULT_ENDPOINT = process.env.NANOBANANA_API_URL ?? 'https://api.nanobanana.com/v1/comics:render'

function resolveAssetDir(questId: string) {
  return path.join(process.cwd(), 'public', 'generated-quests', questId)
}

interface NanoBananaPanelResponse {
  panel_id?: string
  image_base64?: string
  base64?: string
  imageData?: string
  image_base_64?: string
  image_url?: string
  url?: string
  imageUrl?: string
}

interface NanoBananaResponse {
  panels?: NanoBananaPanelResponse[]
}

const resolveApiKey = () =>
  process.env.NANOBANANA_API_KEY ??
  process.env.NEXT_PUBLIC_NANOBANANA_API_KEY ??
  ''

const shouldUseStub = () => {
  if (process.env.NEXT_PUBLIC_USE_NANOBANANA_STUB === 'true') {
    return true
  }
  const apiKey = resolveApiKey()
  return !apiKey || apiKey.trim().length === 0
}

function questHasStory(quest: Quest): quest is Quest & { content: QuizQuest } {
  return quest.type === 'quiz' && Array.isArray((quest.content as QuizQuest).story) && (quest.content as QuizQuest).story.length > 0
}

function getFallbackStoryPaths(): string[] {
  const quests = (questsSeed as { quests?: Quest[] }).quests ?? []
  const firstQuestWithStory = quests.find(questHasStory)
  if (!firstQuestWithStory) {
    return []
  }
  return firstQuestWithStory.content.story
    .map((panel) => panel.image_path)
    .filter((path): path is string => Boolean(path))
}

function buildFallbackAssets(args: NanoBananaArgs): PanelAsset[] {
  const { panelPlans } = args
  const fallbackPaths = getFallbackStoryPaths()
  const safeFallbackLength = fallbackPaths.length
  return panelPlans.map((plan, index) => {
    const panelId = plan.panel_id || `p${index + 1}`
    const imagePath = safeFallbackLength > 0
      ? fallbackPaths[index % safeFallbackLength]
      : '/story-panels/smog-city/p1.png'
    return { panel_id: panelId, image_path: imagePath }
  })
}

export async function renderPanelsWithNanoBanana({ questId, questTitle, panelPlans }: NanoBananaArgs): Promise<PanelAsset[]> {
  if (shouldUseStub()) {
    return buildFallbackAssets({ questId, questTitle, panelPlans })
  }

  const apiKey = resolveApiKey()

  const endpoint = DEFAULT_ENDPOINT
  const payload = {
    story_title: questTitle,
    max_panels: panelPlans.length,
    layout_rules: {
      first_panel_layout: 'full',
      default_panel_layout: 'split',
      max_images_per_panel: 3
    },
    visual_style: 'kid-friendly vibrant climate action comic, clean lines, dynamic lighting, expressive characters',
    panels: panelPlans.map((panel, index) => ({
      panel_id: panel.panel_id || `p${index + 1}`,
      layout: panel.layout,
      headline: panel.headline,
      narration: panel.narration,
      realtime_anchor: panel.realtime_anchor,
      sustainable_actions: panel.sustainable_actions,
      dialogue: panel.dialogue,
      sdg_alignment: panel.sdg_alignment,
      nep2020_link: panel.nep2020_link,
      image_prompt: panel.image_prompt
    }))
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Nanobanana request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const body = await response.json() as NanoBananaResponse
    const panels = Array.isArray(body?.panels) ? body.panels : []

    const assets: PanelAsset[] = []
    const assetDir = resolveAssetDir(questId)
    await fs.mkdir(assetDir, { recursive: true })

    for (let index = 0; index < panelPlans.length; index += 1) {
      const plan = panelPlans[index]
      const panelId = plan.panel_id || `p${index + 1}`
      const match = panels.find(panel => panel.panel_id === panelId) ?? panels[index]

      if (!match) {
        throw new Error(`Nanobanana response missing panel asset for ${panelId}`)
      }

      const filename = `panel-${index + 1}.png`
      const base64 = match.image_base64 ?? match.base64 ?? match.imageData ?? match.image_base_64
      const imageUrl = match.image_url ?? match.url ?? match.imageUrl

      if (typeof base64 === 'string' && base64.length > 0) {
        const buffer = Buffer.from(base64, 'base64')
        await fs.writeFile(path.join(assetDir, filename), buffer)
        assets.push({ panel_id: panelId, image_path: `/generated-quests/${questId}/${filename}` })
        continue
      }

      if (typeof imageUrl === 'string' && imageUrl.length > 0) {
        assets.push({ panel_id: panelId, image_path: imageUrl })
        continue
      }

      throw new Error(`Nanobanana panel ${panelId} did not include image data`)
    }

    return assets
  } catch (error) {
    console.error('[Nanobanana] Falling back to offline assets:', error)
    return buildFallbackAssets({ questId, questTitle, panelPlans })
  }
}
