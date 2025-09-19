'use client'

import { useState, useEffect } from 'react'
import { GameState, Quest, QuizQuest, StoryPanel } from '@/types'
import { MapPin, Clock, Star, Trophy, Camera, QrCode, CheckCircle, Play, ChevronLeft, ChevronRight, SkipForward, BookOpen, Zap } from 'lucide-react'
import questsData from '@/data/quests.json'

interface QuestCenterProps {
  gameState: GameState
}

type QuestFilter = 'all' | 'quiz' | 'photo' | 'qr' | 'daily-action'

export default function QuestCenter({ gameState }: QuestCenterProps) {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [filter, setFilter] = useState<QuestFilter>('all')
  const [quests, setQuests] = useState<Quest[]>([])
  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(300)
  // Story state
  const [showStory, setShowStory] = useState(false)
  const [currentPanel, setCurrentPanel] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // Load quests from seed data
    setQuests(questsData.quests as Quest[])
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
        setCurrentPanel(0)
      } else {
        setShowStory(false)
      }
    } else {
      // Handle other quest types
      console.log('Starting quest:', quest.title)
    }
  }

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    // TODO: Implement quiz logic
    console.log('Quiz answer:', { questionIndex, answerIndex })
  }

  const handlePanelTransition = (direction: 'next' | 'prev') => {
    if (!selectedQuest) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      const quizContent = selectedQuest.content as QuizQuest
      const storyLength = quizContent.story?.length || 0
      
      if (direction === 'next') {
        setCurrentPanel((p) => Math.min(storyLength - 1, p + 1))
      } else {
        setCurrentPanel((p) => Math.max(0, p - 1))
      }
      setIsTransitioning(false)
    }, 150)
  }

  const renderStoryInterface = (quest: Quest) => {
    const quizContent = quest.content as QuizQuest
    const panels = quizContent.story || []
    const currentPanelData = panels[currentPanel]

    if (!currentPanelData) return null

    const goPrev = () => handlePanelTransition('prev')
    const goNext = () => handlePanelTransition('next')
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
        <div className="relative z-10 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedQuest(null)}
              className="btn-pixel bg-black/50 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all duration-300"
            >
              ← BACK
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white font-serif tracking-wide">{quest.title}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <BookOpen className="h-4 w-4 text-neon-cyan" />
                <span className="text-neon-cyan font-medium">Chapter {currentPanel + 1} of {panels.length}</span>
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

        {/* Main Comic Panel */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className={`max-w-4xl w-full transition-all duration-300 ${isTransitioning ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
            
            {/* Comic Panel Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800 relative">
              
              {/* Panel Title */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 text-center">
                <h2 className="text-2xl font-bold text-white font-serif tracking-wider uppercase">
                  {currentPanelData.title}
                </h2>
              </div>

              {/* Image Area */}
              <div className="relative h-96 bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center">
                {/* Image placeholder with comic-style border */}
                <div className="w-full h-full bg-white border-4 border-dashed border-gray-400 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Comic Panel Image</p>
                    <p className="text-sm">Will appear here after generation</p>
                  </div>
                </div>
                
                {/* Comic-style speech bubble for dialogue */}
                {(currentPanelData as any).dialogue && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-white rounded-2xl p-4 border-4 border-gray-800 shadow-lg relative">
                      <div className="absolute -bottom-3 left-8 w-6 h-6 bg-white border-l-4 border-b-4 border-gray-800 transform rotate-45"></div>
                      <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-line">
                        {(currentPanelData as any).dialogue}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Story Caption */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <p className="text-white text-lg leading-relaxed font-medium text-center">
                  {currentPanelData.caption}
                </p>
              </div>

              {/* Progress Dots */}
              <div className="bg-gray-100 p-4 flex justify-center space-x-2">
                {panels.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      idx === currentPanel 
                        ? 'bg-blue-500 scale-125' 
                        : idx < currentPanel 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="relative z-10 p-6 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentPanel === 0}
            className={`btn-pixel px-8 py-4 text-lg font-bold transition-all duration-300 ${
              currentPanel === 0
                ? 'bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-neon-blue border-neon-blue text-white hover:bg-white hover:text-neon-blue hover:scale-105'
            }`}
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            PREVIOUS
          </button>

          <div className="text-center">
            <div className="text-white text-sm opacity-75 mb-1">Swipe or use buttons to navigate</div>
            <div className="text-neon-cyan font-bold text-lg">
              {currentPanel + 1} / {panels.length}
            </div>
          </div>

          {currentPanel < panels.length - 1 ? (
            <button
              onClick={goNext}
              className="btn-pixel bg-neon-green border-neon-green text-white hover:bg-white hover:text-neon-green hover:scale-105 px-8 py-4 text-lg font-bold transition-all duration-300"
            >
              NEXT
              <ChevronRight className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={startQuiz}
              className="btn-pixel bg-gradient-to-r from-orange-500 to-red-500 border-orange-500 text-white hover:scale-105 px-8 py-4 text-lg font-bold transition-all duration-300 animate-pulse"
            >
              <Play className="h-5 w-5 mr-2" />
              START QUIZ!
            </button>
          )}
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
      quizContent.questions.forEach((q, index) => {
        if (answers[index] === q.correct_answer) {
          correct++
        }
      })

      const score = Math.round((correct / quizContent.questions.length) * 100)

      // TODO: Save quest completion
      console.log('Quiz completed with score:', score)
      alert(`QUIZ COMPLETED! SCORE: ${score}%`)
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

          <button
            onClick={handleNextQuestion}
            disabled={selectedAnswers[currentQuestion] === undefined}
            className="btn-pixel bg-neon-green border-neon-green text-gray-900 hover:shadow-neon-green disabled:bg-game-tertiary disabled:border-ui-border disabled:text-foreground-secondary font-mono font-bold"
          >
            {currentQuestion === quizContent.questions.length - 1 ? 'COMPLETE QUIZ' : 'NEXT QUESTION →'}
          </button>
        </div>
      </div>
    )
  }

  if (selectedQuest) {
    if (showStory) {
      return renderStoryInterface(selectedQuest)
    }
    return renderQuizInterface(selectedQuest)
  }

  return (
    <div className="p-6 bg-game-dark font-mono">
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