'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'
import { Loader2, Upload, XCircle } from 'lucide-react'
import { Quest, QuestDifficulty } from '@/types'

interface CreateQuestModalProps {
  open: boolean
  onClose: () => void
  onCreated: (quest: Quest) => void
  teacherId: string
}

const difficultyOptions: { label: string; value: QuestDifficulty }[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' }
]

export default function CreateQuestModal({ open, onClose, onCreated, teacherId }: CreateQuestModalProps) {
  const [questTitle, setQuestTitle] = useState('')
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('medium')
  const [gradeLevel, setGradeLevel] = useState('')
  const [teacherNotes, setTeacherNotes] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [didComplete, setDidComplete] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fileLabel = useMemo(() => {
    if (!pdfFile) return 'Upload quest PDF (max 10MB)'
    const sizeMb = (pdfFile.size / (1024 * 1024)).toFixed(2)
    return `${pdfFile.name} (${sizeMb} MB)`
  }, [pdfFile])

  const resetForm = () => {
    setQuestTitle('')
    setDifficulty('medium')
    setGradeLevel('')
    setTeacherNotes('')
    setPdfFile(null)
    setError(null)
    setStatus(null)
    setIsSubmitting(false)
    setDidComplete(false)
    abortControllerRef.current = null
  }

  const handleClose = () => {
    if (isSubmitting) {
      abortControllerRef.current?.abort()
      setError('Quest generation cancelled by teacher.')
      setStatus(null)
      setIsSubmitting(false)
    }
    resetForm()
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pdfFile) {
      setError('Please upload a PDF before generating the quest.')
      return
    }

    if (pdfFile.size > 10 * 1024 * 1024) {
      setError('Please choose a PDF smaller than 10MB.')
      return
    }

    setError(null)
    setStatus('Generating quest with Gemini & Nanobanana. This may take up to a minute...')
    setIsSubmitting(true)
    setDidComplete(false)

    try {
      const formData = new FormData()
      formData.append('questPdf', pdfFile)
      if (questTitle) formData.append('questTitle', questTitle)
      formData.append('difficulty', difficulty)
      if (gradeLevel) formData.append('gradeLevel', gradeLevel)
      if (teacherNotes) formData.append('teacherNotes', teacherNotes)
      formData.append('assignedBy', teacherId)

      const controller = new AbortController()
      abortControllerRef.current = controller

      const response = await fetch('/api/quests', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create quest')
      }

      if (!payload?.quest) {
        throw new Error('Quest generation succeeded but no quest data was returned.')
      }

      onCreated(payload.quest as Quest)
      setStatus('Quest generated successfully! You can start another or close this window.')
      setDidComplete(true)
    } catch (err) {
      console.error('Quest generation failed', err)
      const errorObj = err as Error
      if (errorObj.name === 'AbortError') {
        setError('Quest generation was stopped.')
      } else {
        const message = errorObj.message || 'Failed to create quest'
        setError(message)
        if (message.includes('Missing') || message.includes('API')) {
          setStatus('Verify Gemini & Nanobanana API keys or enable stub mode in your environment variables.')
        } else {
          setStatus('We could not reach the AI services. Loaded offline templates instead - please try again.')
        }
      }
    } finally {
      setIsSubmitting(false)
      abortControllerRef.current = null
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-3xl bg-gray-900 border-2 border-cyan-400 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-cyan-400">
          <div>
            <h2 className="text-2xl font-bold text-white">Create AI-Generated Quest</h2>
            <p className="text-sm text-cyan-200 mt-1">
              Upload a reference PDF. We will craft a 5-panel comic, generate visuals, and prepare a quiz.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-cyan-200 hover:text-white"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Quest title (optional)</label>
              <input
                type="text"
                className="w-full bg-gray-800 border border-cyan-700 text-white px-3 py-2 focus:border-cyan-400 focus:outline-none"
                placeholder="E.g. Monsoon Mission"
                value={questTitle}
                onChange={(event) => setQuestTitle(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Difficulty</label>
              <div className="relative">
                <select
                  className="w-full bg-gray-800 border border-cyan-700 text-white px-3 py-2 focus:border-cyan-400 focus:outline-none appearance-none"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value as QuestDifficulty)}
                  disabled={isSubmitting}
                >
                  {difficultyOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-cyan-400">v</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Grade band / age (optional)</label>
              <input
                type="text"
                className="w-full bg-gray-800 border border-cyan-700 text-white px-3 py-2 focus:border-cyan-400 focus:outline-none"
                placeholder="Grade 5-6"
                value={gradeLevel}
                onChange={(event) => setGradeLevel(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-2">Teacher notes (optional)</label>
              <input
                type="text"
                className="w-full bg-gray-800 border border-cyan-700 text-white px-3 py-2 focus:border-cyan-400 focus:outline-none"
                placeholder="Highlight local flooding issue"
                value={teacherNotes}
                onChange={(event) => setTeacherNotes(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="bg-gray-800 border border-dashed border-cyan-500 px-4 py-6 text-center">
            <input
              id="quest-pdf-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setPdfFile(file)
              }}
              disabled={isSubmitting}
            />
            <label
              htmlFor="quest-pdf-upload"
              className={`inline-flex items-center space-x-3 px-4 py-2 text-cyan-100 border border-cyan-400 hover:bg-cyan-500/10 cursor-pointer ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <Upload className="h-5 w-5" />
              <span>{fileLabel}</span>
            </label>
            <p className="text-xs text-cyan-300 mt-2">Ensure the PDF has clear, factual content. The comic is capped at 5 panels, grouping up to 3 key visuals per panel.</p>
          </div>

          {status && (
            <div className="flex flex-col space-y-2 bg-cyan-900/40 border border-cyan-600 px-4 py-3 text-cyan-100">
              <div className="flex items-center space-x-3">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <p className="text-sm">{status}</p>
              </div>
              {isSubmitting && (
                <button
                  type="button"
                  className="self-start text-xs underline text-cyan-200 hover:text-white"
                  onClick={handleClose}
                >
                  Stop and close
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-900/40 border border-red-500 px-4 py-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          {didComplete && !isSubmitting && (
            <div className="flex items-center justify-between bg-gray-800 border border-cyan-500 px-4 py-3 text-cyan-100">
              <p className="text-sm">Quest saved. Ready to launch another mission?</p>
              <button
                type="button"
                onClick={() => {
                  setDidComplete(false)
                  setStatus(null)
                  setError(null)
                  setQuestTitle('')
                  setTeacherNotes('')
                  setGradeLevel('')
                  setPdfFile(null)
                }}
                className="px-3 py-1 border border-cyan-400 text-cyan-200 hover:bg-cyan-500/10"
              >
                Start another
              </button>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-cyan-200 hover:text-white"
              onClick={handleClose}
            >
              {isSubmitting ? 'Stop & Close' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-500 text-gray-900 font-semibold hover:bg-cyan-400 flex items-center space-x-2 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSubmitting ? 'Generating...' : 'Generate Quest'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
