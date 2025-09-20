import fs from 'fs/promises'
import path from 'path'
import questsSeed from '@/data/quests.json'
import { Quest } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'src', 'data')
const GENERATED_FILENAME = 'generated-quests.json'
const GENERATED_PATH = path.join(DATA_DIR, GENERATED_FILENAME)

type QuestStoreFile = {
  quests: Quest[]
}

function castSeed(): Quest[] {
  return (questsSeed as { quests: Quest[] }).quests ?? []
}

async function readGeneratedFile(): Promise<Quest[]> {
  try {
    const raw = await fs.readFile(GENERATED_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<QuestStoreFile>
    return Array.isArray(parsed.quests) ? parsed.quests : []
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException
    if (err?.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

async function writeGeneratedFile(quests: Quest[]) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const payload: QuestStoreFile = { quests }
  await fs.writeFile(GENERATED_PATH, JSON.stringify(payload, null, 2), 'utf-8')
}

export async function loadAllQuests(): Promise<Quest[]> {
  const generated = await readGeneratedFile()
  return [...castSeed(), ...generated]
}

export async function appendQuest(quest: Quest): Promise<void> {
  const generated = await readGeneratedFile()
  const updated = [quest, ...generated]
  await writeGeneratedFile(updated)
}

export async function overwriteGeneratedQuests(quests: Quest[]): Promise<void> {
  await writeGeneratedFile(quests)
}

export function getGeneratedQuestsPath(): string {
  return GENERATED_PATH
}
