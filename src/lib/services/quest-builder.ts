import { Quest, QuestDifficulty, QuizQuestion, QuizQuest, StoryPanel } from '@/types'
import { GeminiQuestDraft } from './gemini'
import { NanobananaPanelArt } from './nanobanana'

interface BuildQuestArgs {
  draft: GeminiQuestDraft
  difficulty: QuestDifficulty
  createdBy?: string
  panelArt: NanobananaPanelArt[]
}

const FALLBACK_REWARD_POINTS = 80
const FALLBACK_REWARD_COINS = 40

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function buildQuestFromGeminiDraft({ draft, difficulty, createdBy, panelArt }: BuildQuestArgs): Quest {
  const slugBase = slugify(draft.quest_title || 'sdg13-quest')
  const questId = `${slugBase}-${Date.now()}`
  const artMap = new Map(panelArt.map(art => [art.panel_id, art.image_url]))

  const storyPanels: StoryPanel[] = draft.panels.map(panel => {
    const dialogue = panel.dialogue
      .map(line => `${line.speaker}: ${line.line}`)
      .join('\n')

    return {
      id: panel.panel_id,
      title: panel.headline,
      caption: panel.narration,
      dialogue,
      image_prompt: panel.image_prompt,
      image_path: artMap.get(panel.panel_id)
    }
  })

  const questions: QuizQuestion[] = draft.quiz.questions.map(question => ({
    id: question.id,
    question: question.question,
    options: question.options,
    correct_answer: question.correct_option,
    explanation: question.explanation
  }))

  const quest: Quest = {
    id: questId,
    title: draft.quest_title,
    description: draft.quest_description,
    type: 'quiz',
    difficulty,
    content: {
      questions,
      time_limit: draft.quiz.time_limit_seconds,
      passing_score: draft.quiz.passing_score,
      story: storyPanels
    } satisfies QuizQuest,
    reward_points: draft.rewards?.points ?? FALLBACK_REWARD_POINTS,
    reward_coins: draft.rewards?.coins ?? FALLBACK_REWARD_COINS,
    assigned_by: createdBy,
    is_active: true,
    expires_at: undefined,
    created_at: new Date().toISOString()
  }

  return quest
}
