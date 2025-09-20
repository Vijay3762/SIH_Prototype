import { NextRequest, NextResponse } from 'next/server'
import { Quest, QuestDifficulty } from '@/types'
import { appendQuest, loadAllQuests } from '@/lib/quests-store'
import { generateQuestFromPdf } from '@/lib/quest-generation'

export const runtime = 'nodejs'

function parseDifficulty(value: string | null): QuestDifficulty {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value
  }
  return 'medium'
}

export async function GET() {
  try {
    const quests = await loadAllQuests()
    return NextResponse.json({ quests })
  } catch (error) {
    console.error('[quests.GET] failed to load quests', error)
    return NextResponse.json({ error: 'Failed to load quests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('questPdf')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing questPdf file upload' }, { status: 400 })
    }

    const title = formData.get('questTitle')?.toString().trim() || undefined
    const difficulty = parseDifficulty(formData.get('difficulty')?.toString() ?? null)
    const gradeLevel = formData.get('gradeLevel')?.toString().trim() || undefined
    const teacherNotes = formData.get('teacherNotes')?.toString().trim() || undefined
    const assignedBy = formData.get('assignedBy')?.toString().trim() || undefined

    const arrayBuffer = await file.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    const { quest } = await generateQuestFromPdf({
      pdfBuffer,
      difficulty,
      questTitle: title,
      gradeLevel,
      teacherNotes,
      assignedBy
    })

    await appendQuest(quest as Quest)

    return NextResponse.json({ quest }, { status: 201 })
  } catch (error) {
    console.error('[quests.POST] failed to create quest', error)
    return NextResponse.json({ error: (error as Error).message || 'Failed to create quest' }, { status: 500 })
  }
}
