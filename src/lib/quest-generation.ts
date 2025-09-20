import crypto from 'crypto'
import { Quest, QuestDifficulty, QuizQuestion, QuizQuest, StoryPanel } from '@/types'
import { requestQuestDraftFromGemini } from './services/gemini'
import { renderPanelsWithNanoBanana } from './services/nanobanana'

interface GenerateQuestOptions {
  pdfBuffer: Buffer
  difficulty: QuestDifficulty
  questTitle?: string
  gradeLevel?: string
  teacherNotes?: string
  assignedBy?: string
}

interface GeneratedQuestResult {
  quest: Quest
  assets: {
    panelPaths: Record<string, string>
  }
}

export async function generateQuestFromPdf(options: GenerateQuestOptions): Promise<GeneratedQuestResult> {
  const {
    pdfBuffer,
    difficulty,
    questTitle,
    gradeLevel,
    teacherNotes,
    assignedBy
  } = options

  const draft = await requestQuestDraftFromGemini({
    pdfBuffer,
    questTitle,
    difficulty,
    gradeLevel,
    teacherNotes
  })

  const questId = `quest-${crypto.randomUUID()}`
  const panelAssets = await renderPanelsWithNanoBanana({
    questId,
    questTitle: draft.quest_title ?? questTitle ?? 'Climate Action Quest',
    panelPlans: draft.panels
  })

  const storyPanels: StoryPanel[] = draft.panels.map((panel, index) => {
    const panelId = panel.panel_id || `p${index + 1}`
    const asset = panelAssets.find(asset => asset.panel_id === panelId)
    const dialogueLines = Array.isArray(panel.dialogue)
      ? panel.dialogue.map(line => `${line.speaker}: ${line.line}`)
      : []

    const actionSummary = Array.isArray(panel.sustainable_actions) && panel.sustainable_actions.length > 0
      ? `Key sustainable actions: ${panel.sustainable_actions.join(', ')}`
      : ''
    const realtimeAnchor = panel.realtime_anchor ? `Real-time context: ${panel.realtime_anchor}` : ''
    const descriptiveLines = [panel.narration, realtimeAnchor, actionSummary].filter(Boolean).join('\n')

    return {
      id: panelId,
      title: panel.headline,
      caption: descriptiveLines,
      dialogue: dialogueLines.join('\n'),
      image_prompt: panel.image_prompt,
      image_path: asset?.image_path
    }
  })

  const quizQuestions: QuizQuestion[] = draft.quiz.questions.map((question, index) => ({
    id: question.id || `q${index + 1}`,
    question: question.question,
    options: question.options,
    correct_answer: question.correct_option,
    explanation: question.explanation
  }))

  const quizContent: QuizQuest = {
    story: storyPanels,
    questions: quizQuestions,
    passing_score: draft.quiz.passing_score ?? 70,
    time_limit: draft.quiz.time_limit_seconds ?? 240
  }

  const quest: Quest = {
    id: questId,
    title: draft.quest_title ?? questTitle ?? 'Climate Action Quest',
    description: draft.quest_summary ?? draft.quest_description ?? 'A sustainability quest generated from your PDF.',
    type: 'quiz',
    difficulty,
    content: quizContent,
    reward_points: draft.rewards?.points ?? 80,
    reward_coins: draft.rewards?.coins ?? 40,
    assigned_by: assignedBy,
    is_active: true,
    created_at: new Date().toISOString()
  }

  const panelPaths: Record<string, string> = {}
  panelAssets.forEach(asset => {
    panelPaths[asset.panel_id] = asset.image_path
  })

  return {
    quest,
    assets: {
      panelPaths
    }
  }
}
