'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { X, Upload, Loader2, CheckCircle2, AlertTriangle, FileText, RefreshCw } from 'lucide-react'
import { Quest, QuestDifficulty } from '@/types'
import { authService } from '@/lib/auth'

interface CreateQuestModalProps {
  isOpen: boolean
  onClose: () => void
  onQuestCreated?: (quest: Quest) => void
  teacherId?: string
}

type StepStatus = 'pending' | 'active' | 'done' | 'error'

interface StepDefinition {
  id: 'prepare' | 'gemini' | 'nanobanana' | 'finalize'
  label: string
  description: string
}

const STEPS: StepDefinition[] = [
  { id: 'prepare', label: 'Upload PDF', description: 'Attach the source lesson or briefing document.' },
  { id: 'gemini', label: 'Craft Quest Story', description: 'Gemini maps SDG13 + NEP2020 story beats.' },
  { id: 'nanobanana', label: 'Render Comic Panels', description: 'Nanobanana illustrates up to 5 panels.' },
  { id: 'finalize', label: 'Build Quiz & Rewards', description: 'Package the quest for students.' }
]

interface DraftSummary {
  quest_title: string
  quest_summary: string
  quest_description: string
  positive_outcome: string
}

interface QuestApiResponse {
  success: boolean
  quest?: Quest
  draft_summary?: DraftSummary
  panel_art?: Array<{ panel_id: string; image_url: string }>
  error?: string
}

const defaultStepStatus = (): Record<StepDefinition['id'], StepStatus> => ({
  prepare: 'pending',
  gemini: 'pending',
  nanobanana: 'pending',
  finalize: 'pending'
})

export default function CreateQuestModal({ isOpen, onClose, onQuestCreated, teacherId }: CreateQuestModalProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('medium')
  const [questTitle, setQuestTitle] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [teacherNotes, setTeacherNotes] = useState('')
  const [stepStatus, setStepStatus] = useState<Record<StepDefinition['id'], StepStatus>>(defaultStepStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftSummary, setDraftSummary] = useState<DraftSummary | null>(null)
  const [panelArtPreview, setPanelArtPreview] = useState<Array<{ panel_id: string; image_url: string }>>([])

  const resetState = useCallback(() => {
    setPdfFile(null)
    setQuestTitle('')
    setGradeLevel('')
    setTeacherNotes('')
    setDifficulty('medium')
    setStepStatus(defaultStepStatus())
    setError(null)
    setDraftSummary(null)
    setPanelArtPreview([])
    setIsSubmitting(false)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      resetState()
    }
  }, [isOpen, resetState])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      setPdfFile(null)
      return
    }

    const file = files[0]
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file. Other formats are not supported yet.')
      setPdfFile(null)
      return
    }

    setError(null)
    setPdfFile(file)
  }

  const updateStep = (stepId: StepDefinition['id'], status: StepStatus) => {
    setStepStatus(prev => ({
      ...prev,
      [stepId]: status
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!pdfFile) {
      setError('Upload the reference PDF before generating a quest.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setDraftSummary(null)
      setPanelArtPreview([])
      setStepStatus(defaultStepStatus())
      updateStep('prepare', 'active')

      const formData = new FormData()
      formData.append('pdf', pdfFile)
      formData.append('difficulty', difficulty)
      if (questTitle.trim()) formData.append('questTitle', questTitle.trim())
      if (gradeLevel.trim()) formData.append('gradeLevel', gradeLevel.trim())
      if (teacherNotes.trim()) formData.append('teacherNotes', teacherNotes.trim())
      if (teacherId) formData.append('createdBy', teacherId)

      updateStep('prepare', 'done')
      updateStep('gemini', 'active')

      const response = await fetch('/api/quests', {
        method: 'POST',
        body: formData
      })

      const data = (await response.json()) as QuestApiResponse

      if (!response.ok || !data.success || !data.quest) {
        throw new Error(data.error || 'Quest generation failed')
      }

      updateStep('gemini', 'done')
      updateStep('nanobanana', 'done')
      updateStep('finalize', 'done')

      authService.addQuestToCatalog(data.quest)
      onQuestCreated?.(data.quest)
      setDraftSummary(data.draft_summary ?? null)
      setPanelArtPreview(data.panel_art ?? [])
    } catch (err) {
      console.error('Quest generation error', err)
      setError(err instanceof Error ? err.message : 'Something went wrong while creating the quest.')
      setStepStatus(prev => ({
        ...prev,
        gemini: prev.gemini === 'done' ? prev.gemini : 'error',
        nanobanana: 'error',
        finalize: 'error'
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusIcon = (status: StepStatus) => {
    if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-green-400" />
    if (status === 'active') return <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
    if (status === 'error') return <AlertTriangle className="h-4 w-4 text-red-400" />
    return <Loader2 className="h-4 w-4 text-gray-500" />
  }

  const modalClasses = useMemo(() => (
    'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'
  ), [])

  if (!isOpen) {
    return null
  }

  const questGenerated = !isSubmitting && draftSummary !== null

  return (
    <div className={modalClasses}>
      <div className="w-full max-w-3xl bg-gray-900 border-2 border-cyan-500 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold font-mono tracking-wide">Generate SDG13 Quest</h2>
            <p className="text-sm text-gray-400 font-mono">Upload a lesson PDF to auto-create a kid-friendly quest covering SDG13 + NEP2020.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close quest generator"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6 max-h-[85vh] overflow-y-auto">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold font-mono text-gray-300">Reference PDF</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/60 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-300 transition-colors">
                <Upload className="h-8 w-8 text-cyan-300 mb-2" />
                <span className="font-mono text-sm text-gray-200">Drag & drop or click to upload</span>
                <span className="font-mono text-xs text-gray-500 mt-1">PDF files only · max 10MB</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {pdfFile && (
                <div className="flex items-center space-x-3 bg-gray-800/80 border border-gray-700 rounded px-3 py-2 text-sm font-mono">
                  <FileText className="h-4 w-4 text-cyan-300" />
                  <div className="flex-1 text-left">
                    <p className="text-white truncate">{pdfFile.name}</p>
                    <p className="text-gray-400 text-xs">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                    className="text-gray-400 hover:text-red-400"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold font-mono text-gray-300">Optional title hint</label>
                <input
                  type="text"
                  value={questTitle}
                  onChange={(event) => setQuestTitle(event.target.value)}
                  placeholder="e.g., Rain Garden Rescuers"
                  className="w-full bg-gray-800 border border-gray-700 text-sm font-mono px-3 py-2 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold font-mono text-gray-300">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as QuestDifficulty)}
                    className="w-full bg-gray-800 border border-gray-700 text-sm font-mono px-3 py-2 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold font-mono text-gray-300">Grade band</label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(event) => setGradeLevel(event.target.value)}
                    placeholder="e.g., Grade 5-6"
                    className="w-full bg-gray-800 border border-gray-700 text-sm font-mono px-3 py-2 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold font-mono text-gray-300">Teacher notes</label>
                <textarea
                  value={teacherNotes}
                  onChange={(event) => setTeacherNotes(event.target.value)}
                  placeholder="Specific skills, local issues, or constraints to emphasise."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 text-sm font-mono px-3 py-2 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </section>

          <section className="bg-gray-800/70 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold font-mono text-gray-300 mb-3">Generation progress</h3>
            <div className="space-y-3">
              {STEPS.map(step => (
                <div key={step.id} className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {statusIcon(stepStatus[step.id])}
                  </div>
                  <div>
                    <p className="text-sm font-mono text-white">{step.label}</p>
                    <p className="text-xs font-mono text-gray-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <div className="flex items-start space-x-3 bg-red-900/40 border border-red-600 text-red-100 px-4 py-3 rounded">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-mono text-sm font-semibold">Generation failed</p>
                <p className="font-mono text-xs text-red-200">{error}</p>
              </div>
            </div>
          )}

          {draftSummary && (
            <section className="bg-gray-800/80 border border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-base font-semibold text-cyan-300">Quest ready for students</h3>
                <span className="flex items-center space-x-2 text-green-400 font-mono text-xs uppercase tracking-wide">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Auto-saved</span>
                </span>
              </div>
              <div className="space-y-2 text-sm font-mono text-gray-200">
                <p><span className="text-gray-400">Title:</span> {draftSummary.quest_title}</p>
                <p><span className="text-gray-400">Summary:</span> {draftSummary.quest_summary}</p>
                <p><span className="text-gray-400">Positive impact:</span> {draftSummary.positive_outcome}</p>
              </div>
              {panelArtPreview.length > 0 && (
                <div>
                  <p className="text-xs uppercase font-mono text-gray-400 mb-2">Panel previews</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {panelArtPreview.slice(0, 5).map(panel => (
                      <div key={panel.panel_id} className="relative border border-gray-700 rounded overflow-hidden bg-gray-900 h-36">
                        <Image
                          src={panel.image_url}
                          alt={`Panel ${panel.panel_id}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 45vw, 200px"
                          unoptimized
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs font-mono text-gray-200 px-2 py-1">
                          Panel {panel.panel_id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={questGenerated ? resetState : onClose}
              className="flex items-center space-x-2 text-sm font-mono text-gray-400 hover:text-white"
            >
              {questGenerated ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Generate another quest</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-pixel bg-cyan-500 border-cyan-400 text-gray-900 hover:shadow-neon-cyan disabled:opacity-60 disabled:cursor-not-allowed font-mono"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating…</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Create Quest</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
