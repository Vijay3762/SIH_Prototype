import { NextResponse } from 'next/server'
import { Quest, QuestDifficulty } from '@/types'
import { requestQuestDraftFromGemini } from '@/lib/services/gemini'
import { generatePanelArt } from '@/lib/services/nanobanana'
import { buildQuestFromGeminiDraft } from '@/lib/services/quest-builder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function parseDifficulty(value: FormDataEntryValue | null): QuestDifficulty {
  const normalized = typeof value === 'string' ? value.toLowerCase() : ''
  if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') {
    return normalized
  }
  return 'medium'
}

function readTextField(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const pdfFile = formData.get('pdf')
    if (!(pdfFile instanceof File)) {
      return NextResponse.json({
        success: false,
        error: 'Missing PDF upload. Please attach a reference PDF.'
      }, { status: 400 })
    }

    const pdfArrayBuffer = await pdfFile.arrayBuffer()
    const pdfBuffer = Buffer.from(pdfArrayBuffer)

    const difficulty = parseDifficulty(formData.get('difficulty'))
    const questTitle = readTextField(formData.get('questTitle'))
    const gradeLevel = readTextField(formData.get('gradeLevel'))
    const teacherNotes = readTextField(formData.get('teacherNotes'))
    const createdBy = readTextField(formData.get('createdBy'))

    const draft = await requestQuestDraftFromGemini({
      pdfBuffer,
      questTitle,
      difficulty,
      gradeLevel,
      teacherNotes
    })

    const questSlug = slugify(draft.quest_title || questTitle || 'sdg13-quest')

    const panelArt = await generatePanelArt({
      questSlug,
      questTitle: draft.quest_title,
      panels: draft.panels
    })

    const quest: Quest = buildQuestFromGeminiDraft({
      draft,
      difficulty,
      createdBy,
      panelArt
    })

    return NextResponse.json({
      success: true,
      quest,
      draft_summary: {
        quest_title: draft.quest_title,
        quest_summary: draft.quest_summary,
        quest_description: draft.quest_description,
        positive_outcome: draft.positive_outcome
      },
      panels: draft.panels,
      panel_art: panelArt
    })
  } catch (error) {
    console.error('[API] Quest creation failed', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error during quest generation.'
    }, { status: 500 })
  }
}
