import { QuestDifficulty } from '@/types'

export interface GeminiDialogueLine {
  speaker: string
  line: string
}

export interface GeminiPanelPlan {
  panel_id: string
  layout: 'full' | 'split'
  headline: string
  narration: string
  realtime_anchor: string
  dialogue: GeminiDialogueLine[]
  sustainable_actions: string[]
  sdg_alignment: string
  nep2020_link: string
  image_prompt: string
}

export interface GeminiQuizQuestion {
  id: string
  question: string
  options: string[]
  correct_option: number
  explanation: string
}

export interface GeminiQuestDraft {
  quest_title: string
  quest_summary: string
  quest_description: string
  positive_outcome: string
  panels: GeminiPanelPlan[]
  quiz: {
    passing_score: number
    time_limit_seconds: number
    questions: GeminiQuizQuestion[]
  }
  rewards: {
    points: number
    coins: number
  }
}

interface GeminiQuestRequestArgs {
  pdfBuffer: Buffer
  questTitle?: string
  difficulty: QuestDifficulty
  gradeLevel?: string
  teacherNotes?: string
}

interface GeminiAPIResponsePart {
  text?: string
}

interface GeminiAPIResponseContent {
  parts?: GeminiAPIResponsePart[]
}

interface GeminiAPIResponseCandidate {
  content?: GeminiAPIResponseContent
}

interface GeminiAPIResponse {
  candidates?: GeminiAPIResponseCandidate[]
}

const DEFAULT_MODEL = 'gemini-1.5-flash'
const HARDCODED_GEMINI_API_KEY = 'AIzaSyDXZ8a4RFpIxB8R_4wLXVtbI6rAeF4_l-E'

const shouldUseStub = () => process.env.NEXT_PUBLIC_USE_GEMINI_STUB === 'true'

function buildFallbackPanelPlans(title: string): GeminiPanelPlan[] {
  return [
    {
      panel_id: 'p1',
      layout: 'full',
      headline: `${title}: The Wake-Up`,
      narration: 'A monsoon morning reveals flooded streets around the school. Students gather with their teacher to plan climate action.',
      realtime_anchor: 'Morning assembly with live updates on rainfall and flood alerts for the district.',
      dialogue: [
        { speaker: 'Teacher Asha', line: "Team, this is our chance to apply NEP2020 experiential learning!" },
        { speaker: 'Riya', line: "Let's map the water flow and protect our neighborhood!" }
      ],
      sustainable_actions: ['Conduct local climate observations', 'Use data from IMD apps'],
      sdg_alignment: 'SDG13 Target 13.3: Improve education and awareness on climate change mitigation and adaptation.',
      nep2020_link: 'Experiential, joyful learning through real community challenges.',
      image_prompt: 'Vibrant school courtyard under grey clouds, students in raincoats examining flood map projections on a tablet, teacher encouraging them. Comic style, dynamic lighting.'
    },
    {
      panel_id: 'p2',
      layout: 'split',
      headline: 'Community Climate Audit',
      narration: 'Students split into teams capturing photos, interviews, and soil readings.',
      realtime_anchor: 'Students gather geo-tagged evidence near waterlogged lanes and rooftops.',
      dialogue: [
        { speaker: 'Arjun', line: 'Soil is compacted; no rain can soak in!' },
        { speaker: 'Mia', line: "We'll propose rain gardens to the ward officer." }
      ],
      sustainable_actions: ['Citizen-science data collection', 'Interviewing elders about traditional rain practices'],
      sdg_alignment: 'SDG13 Target 13.2: Integrate climate measures into local planning.',
      nep2020_link: 'Multidisciplinary project integrating science, geography, and civic studies.',
      image_prompt: 'Comic collage showing students using smartphones for surveys, another team testing soil with jars, grandparents sharing stories under umbrellas.'
    },
    {
      panel_id: 'p3',
      layout: 'split',
      headline: 'Design Lab Sprint',
      narration: 'Back in the makerspace, teams convert findings into prototypes.',
      realtime_anchor: 'Students apply design thinking toolkit referencing their field data.',
      dialogue: [
        { speaker: 'Neha', line: 'Permeable tiles will reduce surface runoff near the library.' },
        { speaker: 'Kabir', line: "Let's 3D-print mini flood gates for the drains!" }
      ],
      sustainable_actions: ['Creating models of permeable pavements', 'Planning rainwater harvesting barrels'],
      sdg_alignment: 'SDG13 Target 13.b: Promote climate resilience in marginalized communities.',
      nep2020_link: 'STEAM integration with hands-on, collaborative problem solving.',
      image_prompt: 'Indoor maker lab, students assembling scale models, laptops open with rainfall simulations, comic energy, joyful teamwork.'
    },
    {
      panel_id: 'p4',
      layout: 'split',
      headline: 'Community Pitch Day',
      narration: 'Students present to parents, local officials, and eco-club members.',
      realtime_anchor: 'Town hall with live dashboards, rainfall mitigation metrics, and budget notes.',
      dialogue: [
        { speaker: 'Parent', line: 'Your rain garden plan can protect our playground!' },
        { speaker: 'Ward Officer', line: 'We will provide saplings and compost for your design.' }
      ],
      sustainable_actions: ['Public storytelling with data visualisations', 'Securing civic partnership for implementation'],
      sdg_alignment: 'SDG13 Target 13.1: Strengthen resilience to climate-related hazards.',
      nep2020_link: 'Community engagement and social responsibility emphasised by NEP2020.',
      image_prompt: 'Comic split scene of students presenting posters and digital dashboards, audience applauding, local leaders nodding.'
    },
    {
      panel_id: 'p5',
      layout: 'split',
      headline: 'Impact and Reflection',
      narration: 'Weeks later, the neighborhood enjoys safer pathways and lush micro rain forests.',
      realtime_anchor: 'Students monitor impact via rainfall gauges and reflection journals.',
      dialogue: [
        { speaker: 'Riya', line: 'Flood alerts dropped by half after the rain garden!' },
        { speaker: 'Teacher Asha', line: 'Climate literacy in action - bravo, team!' }
      ],
      sustainable_actions: ['Citizen-led monitoring', 'Maintaining rain gardens and saplings'],
      sdg_alignment: 'SDG13: Visible reduction in local flood risk and increased awareness.',
      nep2020_link: 'Continuous reflective learning and local language storytelling.',
      image_prompt: 'Comic-style celebration scene, kids tending rain garden, clean street, data dashboard displaying lower flood markers.'
    }
  ]
}

function buildFallbackQuiz(questTitle: string): GeminiQuestDraft['quiz'] {
  return {
    passing_score: 70,
    time_limit_seconds: 240,
    questions: [
      {
        id: 'q1',
        question: `Why did the team choose to study real flood data for "${questTitle}"?`,
        options: [
          'To memorise textbook definitions',
          'To design solutions based on local realities',
          'To avoid working with the community',
          'To collect trophies for the school'
        ],
        correct_option: 1,
        explanation: 'Field data helped them create NEP2020-aligned, real-world climate solutions.'
      },
      {
        id: 'q2',
        question: 'Which NEP2020 principle guided their makerspace sprint?',
        options: [
          'Rote repetition',
          'Experiential, multidisciplinary design thinking',
          'Solo worksheets at home',
          'Copying another school project'
        ],
        correct_option: 1,
        explanation: 'They collaborated across subjects, building joyful prototypes to solve community issues.'
      },
      {
        id: 'q3',
        question: 'What SDG13 impact did the community observe after implementation?',
        options: [
          'Increased plastic usage',
          'Reduced flood alerts and greener spaces',
          'More traffic jams',
          'Less student involvement'
        ],
        correct_option: 1,
        explanation: 'Their rain garden and awareness drives lowered flood risk and improved sustainability.'
      }
    ]
  }
}

function buildFallbackDraft(args: GeminiQuestRequestArgs): GeminiQuestDraft {
  const { questTitle, difficulty, teacherNotes, gradeLevel } = args
  const title = questTitle ?? 'Climate Action Field Quest'
  const panels = buildFallbackPanelPlans(title)
  const notesLine = teacherNotes ? ` Teacher note: ${teacherNotes}.` : ''
  const gradeLine = gradeLevel ? ` Designed for learners in ${gradeLevel}.` : ''

  return {
    quest_title: title,
    quest_summary: `Students lead a climate resilience mission analysing real flood data and co-creating solutions.${gradeLine}`,
    quest_description: `A hands-on SDG13 quest where learners document climate risks, experiment with NEP2020-aligned prototypes, and mobilise their neighbourhood.${notesLine}`,
    positive_outcome: 'Flood alerts reduce, rain gardens thrive, and students evolve into climate champions.',
    panels,
    quiz: buildFallbackQuiz(title),
    rewards: {
      points: difficulty === 'hard' ? 120 : difficulty === 'easy' ? 60 : 90,
      coins: difficulty === 'hard' ? 60 : difficulty === 'easy' ? 30 : 45
    }
  }
}

export async function requestQuestDraftFromGemini(args: GeminiQuestRequestArgs): Promise<GeminiQuestDraft> {
  if (shouldUseStub()) {
    return buildFallbackDraft(args)
  }

  const apiKey = HARDCODED_GEMINI_API_KEY
  const { pdfBuffer, questTitle, difficulty, gradeLevel, teacherNotes } = args
  const pdfBase64 = pdfBuffer.toString('base64')

  const promptSections = [
    'You are an education-focused storyteller and assessment designer helping teachers build quests for children aged 8-13.',
    'The teacher uploaded a PDF with reference material. Read it carefully and extract the key themes, facts, and emotional beats.',
    'Create a comic style quest narrative that strictly stays relevant to the PDF information.',
    'Requirements:',
    '- Theme must highlight Sustainable Development Goal 13 (Climate Action) and explicitly weave in National Education Policy 2020 classroom principles (experiential, joyful, multidisciplinary, real-world problem solving).',
    '- Focus on real-time, relatable situations learners might encounter in their school or community.',
    '- The main characters are children who collaborate and make intentional sustainable choices.',
    '- Story must conclude with a hopeful, positive impact showing measurable change.',
    'Comic layout constraints:',
    '1. Produce a maximum of 5 panels.',
    '2. Panel 1 layout is always "full" (single immersive image).',
    '3. Panels 2-5 should be "split" layouts where each panel can collage up to 3 key moments.',
    '4. Provide rich visual directions for each panel so an artist can compose them accurately.',
    '5. Include concrete references to observed actions, props, settings, emotions, lighting, and time of day.',
    '6. Highlight how SDG13 and NEP2020 ideas appear inside the scene.',
    'Quiz requirements:',
    '- Build exactly 3 multiple choice questions.',
    '- Each question has 4 options.',
    '- The correct_option must be a zero-based index.',
    '- Provide a concise explanation that references the story.',
    '- Set passing_score to 70 and time_limit_seconds to 240 unless you have a better reason to adjust.',
    'Response format: Return only valid JSON following this schema:\n{\n  "quest_title": string,\n  "quest_summary": string,\n  "quest_description": string,\n  "positive_outcome": string,\n  "panels": [\n    {\n      "panel_id": string,\n      "layout": "full" | "split",\n      "headline": string,\n      "narration": string,\n      "realtime_anchor": string,\n      "dialogue": [{"speaker": string, "line": string}],\n      "sustainable_actions": string[],\n      "sdg_alignment": string,\n      "nep2020_link": string,\n      "image_prompt": string\n    }\n  ],\n  "quiz": {\n    "passing_score": number,\n    "time_limit_seconds": number,\n    "questions": [\n      {\n        "id": string,\n        "question": string,\n        "options": string[],\n        "correct_option": number,\n        "explanation": string\n      }\n    ]\n  },\n  "rewards": {\n    "points": number,\n    "coins": number\n  }\n}'
  ]

  const contextHints: string[] = []
  if (questTitle) {
    contextHints.push(`Working title: ${questTitle}`)
  }
  if (gradeLevel) {
    contextHints.push(`Target grade level or age band: ${gradeLevel}`)
  }
  if (teacherNotes) {
    contextHints.push(`Teacher notes: ${teacherNotes}`)
  }
  contextHints.push(`Desired difficulty: ${difficulty}`)

  const userPrompt = `${promptSections.join('\n')}${contextHints.length ? '\nAdditional context:\n- ' + contextHints.join('\n- ') : ''}`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: userPrompt },
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          topK: 40,
          responseMimeType: 'application/json'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const body = await response.json() as GeminiAPIResponse
    const candidate = body.candidates?.[0]?.content?.parts?.[0]?.text
    if (!candidate) {
      throw new Error('Gemini response missing content')
    }

    return JSON.parse(candidate) as GeminiQuestDraft
  } catch (error) {
    console.error('[Gemini] Falling back to offline draft:', error)
    return buildFallbackDraft(args)
  }
}
