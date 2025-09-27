'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { GameState, Quest, QuizQuest, QuizSubmission } from '@/types'
import { MapPin, Clock, Star, Trophy, Camera, QrCode, CheckCircle, Play, BookOpen, Zap } from 'lucide-react'
import { authService, QUEST_CATALOG_EVENT } from '@/lib/auth'

interface QuestCenterProps {
  gameState: GameState
  onQuestComplete?: () => void
}

type QuestFilter = 'all' | 'quiz' | 'photo' | 'qr' | 'daily-action'

export default function QuestCenter({ gameState, onQuestComplete }: QuestCenterProps) {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [filter, setFilter] = useState<QuestFilter>('all')
  const [quests, setQuests] = useState<Quest[]>([])
  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(300)
  // Story state
  const [showStory, setShowStory] = useState(false)
  const [scoreDialog, setScoreDialog] = useState({
    isOpen: false,
    score: 0,
    questTitle: '',
    message: '',
    rewardPoints: 0,
    rewardCoins: 0,
    isPerfect: false
  })

  useEffect(() => {
    const loadCatalog = () => {
      const catalog = authService.getQuestCatalog()
      setQuests(catalog)
    }

    loadCatalog()

    if (typeof window !== 'undefined') {
      window.addEventListener(QUEST_CATALOG_EVENT, loadCatalog)
      return () => window.removeEventListener(QUEST_CATALOG_EVENT, loadCatalog)
    }
  }, [])

  useEffect(() => {
    // Reset quiz state when entering quiz phase (not during story)
    if (selectedQuest && selectedQuest.type === 'quiz' && !showStory) {
      const quizContent = selectedQuest.content as QuizQuest
      setCurrentQuestion(0)
      setSelectedAnswers([])
      setTimeLeft(quizContent.time_limit || 300)
    }
  }, [selectedQuest, showStory])

  const filteredQuests = quests.filter(quest => 
    filter === 'all' || quest.type === filter
  )

  const getQuestIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Trophy className="h-5 w-5 text-neon-yellow" />
      case 'photo':
        return <Camera className="h-5 w-5 text-neon-blue" />
      case 'qr':
        return <QrCode className="h-5 w-5 text-neon-purple" />
      case 'daily-action':
        return <CheckCircle className="h-5 w-5 text-neon-green" />
      default:
        return <MapPin className="h-5 w-5 text-neon-cyan" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-neon-green border-neon-green text-gray-900'
      case 'medium':
        return 'bg-neon-yellow border-neon-yellow text-gray-900'
      case 'hard':
        return 'bg-danger-color border-danger-color text-foreground'
      default:
        return 'bg-game-tertiary border-ui-border text-foreground'
    }
  }

  const handleStartQuest = (quest: Quest) => {
    if (quest.type === 'quiz') {
      setSelectedQuest(quest)
      const quizContent = quest.content as QuizQuest
      if (quizContent.story && quizContent.story.length > 0) {
        setShowStory(true)
      } else {
        setShowStory(false)
      }
    } else {
      // Handle other quest types
      console.log('Starting quest:', quest.title)
    }
  }

  const renderStoryInterface = (quest: Quest) => {
    const quizContent = quest.content as QuizQuest
    const panels = quizContent.story || []
    const skipToQuiz = () => setShowStory(false)
    const startQuiz = () => setShowStory(false)

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-neon-cyan rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-neon-purple rounded-full blur-lg animate-bounce"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-neon-yellow rounded-full blur-md animate-ping"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedQuest(null)}
              className="btn-pixel bg-black/50 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all duration-300"
            >
              ← BACK
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white font-serif tracking-wide">{quest.title}</h1>
              <div className="flex items-center space-x-2 mt-1 text-neon-cyan font-medium">
                <BookOpen className="h-4 w-4" />
                <span>Scroll through {panels.length} comic cards</span>
              </div>
            </div>
          </div>

          <button
            onClick={skipToQuiz}
            className="btn-pixel bg-neon-yellow/20 border-neon-yellow text-neon-yellow hover:bg-neon-yellow hover:text-black transition-all duration-300 font-bold"
          >
            <Zap className="h-4 w-4 mr-2" />
            SKIP TO QUIZ
          </button>
        </div>

        {/* Comic Panels */}
        <div className="relative z-10 px-6 pb-24">
          <div className="max-w-6xl mx-auto space-y-12">
            {panels.map((panel, idx) => (
              <div key={panel.id} className="group relative pt-12">
                <div className="absolute top-0 left-8 inline-flex items-center gap-3 px-5 py-2 rounded-full border-2 border-neon-cyan bg-black/70 text-neon-cyan shadow-[0_10px_35px_rgba(0,255,255,0.35)] uppercase tracking-widest">
                  <span className="text-xs font-mono">Panel {idx + 1}</span>
                  <span className="font-serif text-sm md:text-base max-w-[14rem] truncate">{panel.title}</span>
                </div>

                <div className="relative rounded-[32px] border-8 border-white/10 bg-white/5 overflow-hidden shadow-[0_35px_120px_-30px_rgba(14,197,240,0.45)] transition-transform duration-500 group-hover:scale-[1.01] group-hover:border-neon-cyan/60">
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/30 via-transparent to-neon-cyan/30 opacity-40 group-hover:opacity-70 transition-opacity duration-500" />

                  <div className="relative w-full aspect-[3/4] min-h-[460px] md:min-h-[600px] lg:min-h-[720px] bg-slate-900 flex items-center justify-center overflow-hidden">
                    {panel.image_path ? (
                      <Image
                        src={panel.image_path}
                        alt={panel.title || `Panel ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 90vw, (max-width: 1024px) 70vw, 960px"
                        priority={idx === 0}
                      />
                    ) : (
                      <div className="text-center text-white/70 max-w-sm mx-auto space-y-3">
                        <Camera className="h-16 w-16 mx-auto opacity-60" />
                        <p className="font-semibold tracking-wide uppercase text-sm md:text-base">Comic art will appear here</p>
                        <p className="text-xs md:text-sm text-white/60">Generate the panel using the saved prompt and place the image at <span className="font-mono text-neon-cyan">{panel.image_path || '/story-panels/...'} </span></p>
                      </div>
                    )}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/10 via-transparent to-black/20" />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-center pt-4">
              <button
                onClick={startQuiz}
                className="btn-pixel bg-gradient-to-r from-neon-green to-neon-yellow border-neon-green text-gray-900 hover:shadow-neon-green/60 font-pixel text-lg px-12 py-5 transition-transform duration-300 hover:-translate-y-1 hover:scale-105"
              >
                <Play className="h-5 w-5 mr-3" />
                START QUIZ
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderQuestCard = (quest: Quest) => (
    <div key={quest.id} className="card-pixel border-neon-cyan p-6 hover:shadow-neon-cyan transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getQuestIcon(quest.type)}
          <div>
            <h3 className="font-bold text-neon-cyan font-pixel">{quest.title.toUpperCase()}</h3>
            <p className="text-sm text-neon-green font-mono capitalize">{quest.type.replace('-', ' ')} QUEST</p>
          </div>
        </div>

        <span className={`px-2 py-1 border-2 text-xs font-bold font-mono capitalize ${getDifficultyColor(quest.difficulty)}`}>
          {quest.difficulty}
        </span>
      </div>

      <p className="text-foreground-secondary mb-4 font-mono">{quest.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-neon-yellow">
            <Star className="h-4 w-4" />
            <span className="text-sm font-bold font-mono">{quest.reward_points} PTS</span>
          </div>
          <div className="flex items-center space-x-1 text-neon-yellow">
            <span className="text-lg pixel-perfect">🪙</span>
            <span className="text-sm font-bold font-mono">{quest.reward_coins} COINS</span>
          </div>
        </div>

        <button
          onClick={() => handleStartQuest(quest)}
          className="btn-pixel bg-neon-green border-neon-green text-gray-900 hover:shadow-neon-green font-mono font-bold"
        >
          <Play className="h-4 w-4 mr-2" />
          <span>START QUEST</span>
        </button>
      </div>
    </div>
  )

  const renderQuizInterface = (quest: Quest) => {
    const quizContent = quest.content as QuizQuest
    const question = quizContent.questions[currentQuestion]

    const handleAnswerSelect = (answerIndex: number) => {
      const newAnswers = [...selectedAnswers]
      newAnswers[currentQuestion] = answerIndex
      setSelectedAnswers(newAnswers)
    }

    const handleNextQuestion = () => {
      if (currentQuestion < quizContent.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        // Quiz completed
        handleQuizComplete(selectedAnswers)
      }
    }

    const handleQuizComplete = (answers: number[]) => {
      // Calculate score
      let correct = 0
      let attempted = 0
      quizContent.questions.forEach((q, index) => {
        // Skip questions marked with -1
        if (answers[index] !== -1) {
          attempted++
          if (answers[index] === q.correct_answer) {
            correct++
          }
        }
      })

      // Calculate score based on attempted questions only, not counting skipped ones
      const score = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
      const isPerfect = score === 100
      const awardedPoints = isPerfect ? quest.reward_points : 0
      const awardedCoins = isPerfect ? quest.reward_coins : 0

      const submission: QuizSubmission = {
        answers,
        time_taken: Math.max(0, (quizContent.time_limit || 0) - timeLeft),
        score
      }

      authService.recordQuestCompletion({
        user: gameState.user,
        quest,
        submission
      })

      const feedbackMessage = getScoreCelebration(score, isPerfect)

      setScoreDialog({
        isOpen: true,
        score,
        questTitle: quest.title,
        message: feedbackMessage,
        rewardPoints: awardedPoints,
        rewardCoins: awardedCoins,
        isPerfect
      })

      if (typeof onQuestComplete === 'function') {
        onQuestComplete()
      }

      setSelectedQuest(null)
    }

    return (
      <div className="card-pixel border-neon-cyan p-6">
        {/* Quiz Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neon-cyan font-pixel">{quest.title.toUpperCase()}</h2>
            <p className="text-neon-green font-mono">QUESTION {currentQuestion + 1} OF {quizContent.questions.length}</p>
          </div>

          <div className="flex items-center space-x-2 bg-neon-blue border-2 border-neon-blue px-3 py-2 shadow-pixel">
            <Clock className="h-4 w-4 text-gray-900" />
            <span className="font-bold text-gray-900 font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="status-bar-pixel mb-6">
          <div
            className="status-fill-pixel energy-fill"
            style={{ width: `${((currentQuestion + 1) / quizContent.questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-foreground font-mono mb-4">{question.question}</h3>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 border-2 font-mono transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-neon-blue bg-neon-blue text-gray-900 shadow-neon-blue'
                    : 'border-ui-border bg-game-tertiary text-foreground hover:border-neon-cyan hover:shadow-neon-cyan'
                }`}
              >
                <span className="font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setSelectedQuest(null)}
            className="btn-pixel bg-game-tertiary border-ui-border text-foreground hover:border-neon-cyan font-mono"
          >
            ← BACK TO QUESTS
          </button>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                // Skip current question by setting a default answer (-1)
                const newAnswers = [...selectedAnswers]
                newAnswers[currentQuestion] = -1
                setSelectedAnswers(newAnswers)
                handleNextQuestion()
              }}
              className="btn-pixel bg-yellow-600 border-yellow-400 text-white hover:shadow-yellow-400 font-mono"
            >
              SKIP QUESTION
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={selectedAnswers[currentQuestion] === undefined}
              className="btn-pixel bg-neon-green border-neon-green text-gray-900 hover:shadow-neon-green disabled:bg-game-tertiary disabled:border-ui-border disabled:text-foreground-secondary font-mono font-bold"
            >
              {currentQuestion === quizContent.questions.length - 1 ? 'COMPLETE QUIZ' : 'NEXT QUESTION →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getScoreCelebration = (score: number, isPerfect: boolean) => {
    if (isPerfect) {
      return 'Flawless eco victory! Your pet is cheering with twinkling eyes.'
    }
    if (score >= 75) {
      return 'Great job Explorer! Rewards unlock only with a perfect run—give it another go.'
    }
    if (score >= 50) {
      return "Nice effort! Study the panels again and aim for a perfect streak to earn rewards."
    }
    return 'Every attempt grows greener roots. Review the story and try again for a perfect score!'
  }

  const closeScoreDialog = () => {
    setScoreDialog(prev => ({ ...prev, isOpen: false }))
  }

  const renderScoreDialog = () => {
    if (!scoreDialog.isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
        <div className="relative max-w-2xl w-full bg-game-secondary border-4 border-neon-cyan shadow-[0_0_30px_rgba(0,255,255,0.4)] p-6 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-neon-purple/30 blur-3xl" />
          <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-6 items-center">
            <div>
              <h2 className="text-3xl font-bold text-neon-cyan font-pixel mb-2">QUEST COMPLETE!</h2>
              <p className="text-neon-green font-mono mb-6 uppercase">{scoreDialog.questTitle}</p>

              <div className="bg-game-tertiary border-2 border-neon-cyan p-4 shadow-pixel mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground-secondary font-mono">SCORE</span>
                  <span
                    className={`text-sm font-mono ${
                      scoreDialog.isPerfect ? 'text-neon-green' : 'text-foreground-secondary'
                    }`}
                  >
                    {scoreDialog.isPerfect ? 'Rewards unlocked!' : 'Perfect score needed for rewards'}
                  </span>
                </div>
                <div className="flex items-end space-x-3">
                  <span className="text-5xl font-bold text-neon-yellow font-pixel">{scoreDialog.score}</span>
                  <span className="text-xl text-neon-yellow font-mono">%</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-4 text-sm font-mono">
                  <div
                    className={`px-3 py-2 border-2 shadow-pixel ${
                      scoreDialog.rewardPoints > 0
                        ? 'border-neon-yellow text-neon-yellow'
                        : 'border-ui-border text-foreground-secondary'
                    }`}
                  >
                    +{scoreDialog.rewardPoints} pts
                  </div>
                  <div
                    className={`px-3 py-2 border-2 shadow-pixel ${
                      scoreDialog.rewardCoins > 0
                        ? 'border-neon-green text-neon-green'
                        : 'border-ui-border text-foreground-secondary'
                    }`}
                  >
                    +{scoreDialog.rewardCoins} coins
                  </div>
                </div>
              </div>

              <p className="text-foreground font-mono text-lg mb-4">{scoreDialog.message}</p>

              <button
                onClick={closeScoreDialog}
                className="btn-pixel bg-neon-green border-neon-green text-gray-900 hover:shadow-neon-green font-mono font-bold"
              >
                CONTINUE YOUR JOURNEY →
              </button>
            </div>

            <div className="relative h-60 md:h-full min-h-[240px] bg-game-tertiary border-2 border-ui-border flex items-center justify-center">
              <Image
                src="/model_2dimage.jpeg"
                alt="Eco companion celebrating"
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 60vw, 320px"
                priority
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedQuest) {
    if (showStory) {
      return (
        <>
          {renderScoreDialog()}
          {renderStoryInterface(selectedQuest)}
        </>
      )
    }
    return (
      <>
        {renderScoreDialog()}
        {renderQuizInterface(selectedQuest)}
      </>
    )
  }

  return (
    <div className="p-6 bg-game-dark font-mono">
      {renderScoreDialog()}
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neon-cyan font-pixel mb-2">QUEST CENTER</h2>
        <p className="text-neon-green font-mono">COMPLETE QUESTS TO EARN POINTS AND FEED YOUR PET! 🎯</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-game-secondary border-2 border-ui-border p-1 shadow-pixel">
        {[
          { id: 'all', label: 'ALL QUESTS', icon: MapPin, color: 'neon-cyan' },
          { id: 'quiz', label: 'QUIZ', icon: Trophy, color: 'neon-yellow' },
          { id: 'photo', label: 'PHOTO', icon: Camera, color: 'neon-blue' },
          { id: 'qr', label: 'QR CODE', icon: QrCode, color: 'neon-purple' },
          { id: 'daily-action', label: 'DAILY', icon: CheckCircle, color: 'neon-green' },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as QuestFilter)}
              className={`flex items-center space-x-2 px-4 py-2 btn-pixel transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 ${
                filter === tab.id
                  ? `bg-neon-${tab.color} border-neon-${tab.color} text-gray-900 shadow-neon-${tab.color}`
                  : 'bg-game-tertiary border-ui-border text-foreground-secondary hover:border-neon-cyan'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Quest Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredQuests.map(renderQuestCard)}
      </div>

      {/* Empty State */}
      {filteredQuests.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 text-neon-cyan mx-auto mb-4 pixel-perfect" />
          <h3 className="text-lg font-bold text-neon-cyan font-pixel mb-2">NO QUESTS FOUND</h3>
          <p className="text-neon-green font-mono">TRY CHANGING THE FILTER TO SEE MORE QUESTS.</p>
        </div>
      )}
    </div>
  )
}
