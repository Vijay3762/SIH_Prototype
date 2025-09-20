'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { authService, QUEST_CATALOG_EVENT } from '@/lib/auth'
import { Quest, QuizQuest, User } from '@/types'
import { useRouter } from 'next/navigation'
import {
  Users,
  Award,
  BookOpen,
  TrendingUp,
  Settings,
  LogOut,
  Search,
  Plus,
  Eye,
  Coins,
  Target
} from 'lucide-react'
import CreateQuestModal from '@/components/teacher/CreateQuestModal'

interface QuestHistoryRecord {
  id: string
  user_id: string
  quest_id: string
  quest_title: string
  quest_type: string
  username: string
  reward_points: number
  reward_coins?: number
  is_perfect?: boolean
  score?: number
  completed_at: string
  submission?: {
    score: number
  }
}

interface LeaderboardRecord {
  user_id: string
  username: string
  school_id?: string
  school_name?: string
  points: number
  coins: number
  badges_count: number
  pet_stage: string
  updated_at: string
}

export default function TeacherDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'quests' | 'analytics'>('overview')
  const [showSettings, setShowSettings] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRecord[]>([])
  const [questHistory, setQuestHistory] = useState<QuestHistoryRecord[]>([])
  const [teacherQuests, setTeacherQuests] = useState<Quest[]>([])
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false)
  const router = useRouter()

  const refreshTeacherQuests = useCallback(() => {
    setTeacherQuests(authService.getCustomQuestsSnapshot())
  }, [])

  const handleQuestCreated = useCallback(() => {
    refreshTeacherQuests()
  }, [refreshTeacherQuests])

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'school-admin')) {
      router.push('/')
      return
    }

    setUser(currentUser)
    setIsLoading(false)
  }, [router])

  useEffect(() => {
    const loadHistory = () => {
      const history = authService.getQuestHistorySnapshot() as QuestHistoryRecord[]
      const sorted = history
        .slice()
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      setQuestHistory(sorted)
    }

    loadHistory()

    if (typeof window !== 'undefined') {
      window.addEventListener('prakritiQuestUpdate', loadHistory)
      return () => window.removeEventListener('prakritiQuestUpdate', loadHistory)
    }
  }, [])

  useEffect(() => {
    const loadLeaderboard = () => {
      const records = authService.getLeaderboardSnapshot() as LeaderboardRecord[]
      setLeaderboard(records)
    }

    loadLeaderboard()

    if (typeof window !== 'undefined') {
      window.addEventListener('prakritiLeaderboardUpdate', loadLeaderboard)
      return () => window.removeEventListener('prakritiLeaderboardUpdate', loadLeaderboard)
    }
  }, [])

  useEffect(() => {
    refreshTeacherQuests()

    if (typeof window !== 'undefined') {
      window.addEventListener(QUEST_CATALOG_EVENT, refreshTeacherQuests)
      return () => window.removeEventListener(QUEST_CATALOG_EVENT, refreshTeacherQuests)
    }
  }, [refreshTeacherQuests])

  const handleLogout = async () => {
    await authService.logout()
    router.push('/')
  }

  const stats = useMemo(() => {
    const relevantLeaderboard = leaderboard.filter(entry => {
      if (!user?.school_id) return true
      return entry.school_id === user.school_id
    })

    const uniqueStudents = relevantLeaderboard.length
    const uniqueQuests = new Set(questHistory.map(entry => entry.quest_id)).size
    const totalCompletions = questHistory.length
    const totalScore = questHistory.reduce((sum, entry) => {
      const score = entry.score ?? entry.submission?.score ?? 0
      return sum + score
    }, 0)
    const avgScore = totalCompletions > 0 ? Math.round(totalScore / totalCompletions) : 0
    const totalCoins = relevantLeaderboard.reduce((sum, entry) => sum + entry.coins, 0)
    const totalPoints = relevantLeaderboard.reduce((sum, entry) => sum + entry.points, 0)

    return {
      uniqueStudents,
      uniqueQuests,
      totalCompletions,
      avgScore,
      totalCoins,
      totalPoints
    }
  }, [leaderboard, questHistory, user?.school_id])

  const sortedTeacherQuests = useMemo(() => {
    return teacherQuests
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [teacherQuests])

  const recentActivity = useMemo(() => questHistory.slice(0, 6), [questHistory])

  const studentSummaries = useMemo(() => {
    const questSummary = new Map<string, {
      quests: number
      totalScore: number
      totalReward: number
      totalRewardCoins: number
      lastQuest: string
      lastCompletedAt: string
      lastScore: number
      lastRewardPoints: number
      lastRewardCoins: number
    }>()

    questHistory.forEach(entry => {
      const existing = questSummary.get(entry.user_id) || {
        quests: 0,
        totalScore: 0,
        totalReward: 0,
        totalRewardCoins: 0,
        lastQuest: '',
        lastCompletedAt: '',
        lastScore: 0,
        lastRewardPoints: 0,
        lastRewardCoins: 0
      }

      const score = entry.score ?? entry.submission?.score ?? 0
      const rewardPoints = entry.reward_points ?? 0
      const rewardCoins = entry.reward_coins ?? 0

      existing.quests += 1
      existing.totalScore += score
      existing.totalReward += rewardPoints
      existing.totalRewardCoins += rewardCoins

      if (!existing.lastCompletedAt || new Date(entry.completed_at) > new Date(existing.lastCompletedAt)) {
        existing.lastCompletedAt = entry.completed_at
        existing.lastQuest = entry.quest_title
        existing.lastScore = score
        existing.lastRewardPoints = rewardPoints
        existing.lastRewardCoins = rewardCoins
      }

      questSummary.set(entry.user_id, existing)
    })

    const relevantLeaderboard = leaderboard.filter(entry => {
      if (!user?.school_id) return true
      return entry.school_id === user.school_id
    })

    return relevantLeaderboard
      .map(record => {
        const history = questSummary.get(record.user_id)
        const questCount = history?.quests ?? 0
        const averageScore = questCount > 0 ? Math.round((history?.totalScore ?? 0) / questCount) : 0
        const progressPercent = Math.min(100, Math.round((questCount / 10) * 100))

        return {
          userId: record.user_id,
          name: record.username,
          points: record.points,
          coinBalance: record.coins,
          quests: questCount,
          averageScore,
          totalReward: history?.totalReward ?? 0,
          totalRewardCoins: history?.totalRewardCoins ?? 0,
          lastQuest: history?.lastQuest ?? '',
          lastScore: history?.lastScore ?? 0,
          lastRewardPoints: history?.lastRewardPoints ?? 0,
          lastRewardCoins: history?.lastRewardCoins ?? 0,
          progressPercent
        }
      })
      .sort((a, b) => (b.points !== a.points ? b.points - a.points : b.averageScore - a.averageScore))
  }, [leaderboard, questHistory, user?.school_id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-center">
          <h1 className="text-2xl font-bold mb-4">Access denied</h1>
          <button 
            onClick={() => router.push('/')}
            className="bg-cyan-600 text-white px-4 py-2 font-semibold hover:bg-cyan-500"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 border-2 border-cyan-400 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-mono">STUDENTS TRACKED</p>
              <p className="text-2xl font-bold text-white font-mono">{stats.uniqueStudents}</p>
            </div>
            <Users className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="bg-gray-800 border-2 border-green-400 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-mono">QUESTS TRACKED</p>
              <p className="text-2xl font-bold text-white font-mono">{stats.uniqueQuests}</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 border-2 border-blue-400 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-mono">COIN BANK</p>
              <p className="text-2xl font-bold text-white font-mono">{stats.totalCoins}</p>
            </div>
            <Coins className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 border-2 border-yellow-400 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-mono">AVG SCORE</p>
              <p className="text-2xl font-bold text-white font-mono">{stats.avgScore}%</p>
            </div>
            <Award className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 border-2 border-gray-600">
        <div className="border-b-2 border-gray-600 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-mono">RECENT ACTIVITY</h2>
          <span className="text-sm text-gray-400 font-mono">{stats.totalCompletions} completions logged</span>
        </div>
        <div className="p-4 space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => {
              const score = activity.score ?? activity.submission?.score ?? 0
              const completedAt = new Date(activity.completed_at).toLocaleString()
              const rewardCoins = activity.reward_coins ?? 0
              return (
                <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-700 p-3 border border-gray-600 gap-2">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-cyan-400 mt-1"></div>
                    <div>
                      <p className="text-white font-mono text-sm">
                        {activity.username.toUpperCase()} COMPLETED {activity.quest_title.toUpperCase()}
                      </p>
                      <p className="text-gray-400 text-xs font-mono">Score {score}% · +{activity.reward_points} pts · +{rewardCoins} coins</p>
                    </div>
                  </div>
                  <div className="text-gray-400 text-xs font-mono text-right">{completedAt}</div>
                </div>
              )
            })
          ) : (
            <div className="text-center text-gray-400 font-mono py-6">
              No quiz activity yet. Encourage your explorers to attempt a quest!
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderTopPerformers = () => {
    const performers = leaderboard
      .filter(entry => !user?.school_id || entry.school_id === user.school_id)
      .slice()
      .sort((a, b) => (b.points !== a.points ? b.points - a.points : b.coins - a.coins))
      .slice(0, 3)

    return (
      <div className="bg-gray-800 border-2 border-gray-600">
        <div className="border-b-2 border-gray-600 p-4">
          <h2 className="text-xl font-bold text-white font-mono">TOP PERFORMERS</h2>
        </div>
        <div className="p-4 space-y-3">
          {performers.length > 0 ? (
            performers.map((entry, index) => (
              <div key={entry.user_id} className="flex items-center justify-between bg-gray-700 p-4 border border-gray-600">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-cyan-400 font-mono">#{index + 1}</span>
                  <div>
                    <p className="text-white font-mono text-sm">{entry.username.toUpperCase()}</p>
                    <p className="text-xs text-gray-400 font-mono">{entry.school_name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm font-mono">
                  <span className="text-yellow-400">{entry.points} pts</span>
                  <span className="text-green-400">{entry.coins} coins</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 font-mono py-6">No leaderboard data yet.</div>
          )}
        </div>
      </div>
    )
  }

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white font-mono">STUDENT MANAGEMENT</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search students..."
              className="bg-gray-800 border-2 border-gray-600 text-white pl-10 pr-4 py-2 font-mono focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border-2 border-gray-600">
        <div className="border-b-2 border-gray-600 p-4 grid grid-cols-7 gap-4 font-mono text-gray-400 text-sm">
          <div>STUDENT</div>
          <div>JOURNEY</div>
          <div>AVG SCORE</div>
          <div>LAST QUEST</div>
          <div>POINTS</div>
          <div>COINS</div>
          <div>ACTIONS</div>
        </div>
        {studentSummaries.length > 0 ? (
          studentSummaries.map((student) => (
            <div key={student.userId} className="p-4 border-b border-gray-700 grid grid-cols-7 gap-4 items-center">
              <div className="text-white font-mono">{student.name}</div>
              <div>
                <div className="w-full bg-gray-700 h-2">
                  <div
                    className="bg-cyan-400 h-2"
                    style={{ width: `${student.progressPercent}%` }}
                  ></div>
                </div>
                <span className="text-gray-300 text-xs font-mono block mt-1">
                  {student.quests} quests completed
                </span>
              </div>
              <div className="text-cyan-400 font-mono">{student.averageScore}%</div>
              <div className="text-white font-mono">
                <div>{student.lastQuest || '—'}</div>
                <div className="text-xs text-gray-400">Score {student.lastScore}% · +{student.lastRewardPoints} pts · +{student.lastRewardCoins} coins</div>
              </div>
              <div className="text-yellow-400 font-mono">
                <div>+{student.totalReward} pts</div>
                <div className="text-xs text-green-400">+{student.totalRewardCoins} coins</div>
              </div>
              <div className="text-green-400 font-mono">{student.coinBalance}</div>
              <div className="flex space-x-2">
                <button className="bg-blue-600 text-white p-2 hover:bg-blue-500">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 font-mono py-8">
            No quest attempts recorded yet.
          </div>
        )}
      </div>
    </div>
  )

  const renderQuests = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-mono">QUEST MANAGEMENT</h2>
          <p className="text-sm text-gray-400 font-mono">Upload a PDF to instantly craft SDG13 + NEP2020 quests for your students.</p>
        </div>
        <button
          onClick={() => setIsQuestModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 font-mono hover:bg-green-500 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>CREATE QUEST</span>
        </button>
      </div>

      <div className="bg-gray-800 border-2 border-gray-600">
        <div className="border-b-2 border-gray-600 p-4 grid grid-cols-6 gap-4 font-mono text-gray-400 text-sm">
          <div>QUEST</div>
          <div>DIFFICULTY</div>
          <div>QUIZ</div>
          <div>REWARDS</div>
          <div>CREATED</div>
          <div>STATUS</div>
        </div>
        {sortedTeacherQuests.length > 0 ? (
          sortedTeacherQuests.map((quest) => {
            const quizContent = quest.content as QuizQuest
            const storyPanels = quizContent.story?.length ?? 0
            const questionCount = quizContent.questions.length
            const createdOn = new Date(quest.created_at)
            const createdLabel = Number.isNaN(createdOn.getTime())
              ? '—'
              : createdOn.toLocaleString()

            return (
              <div key={quest.id} className="p-4 border-b border-gray-700 grid grid-cols-6 gap-4 items-start">
                <div>
                  <div className="text-white font-mono font-semibold">{quest.title}</div>
                  <p className="text-xs text-gray-400 font-mono mt-1 max-w-prose">{quest.description}</p>
                  <p className="text-xs text-cyan-400 font-mono mt-1">Story panels: {storyPanels} · Questions: {questionCount}</p>
                </div>
                <div className={`font-mono uppercase text-sm ${
                  quest.difficulty === 'easy'
                    ? 'text-green-400'
                    : quest.difficulty === 'hard'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                }`}>
                  {quest.difficulty}
                </div>
                <div className="text-sm font-mono text-cyan-300">
                  <div>Pass: {quizContent.passing_score}%</div>
                  <div className="text-xs text-gray-400">Time: {quizContent.time_limit ? `${quizContent.time_limit}s` : '—'}</div>
                </div>
                <div className="text-sm font-mono text-yellow-300">
                  <div>{quest.reward_points} pts</div>
                  <div className="text-xs text-green-300">{quest.reward_coins} coins</div>
                </div>
                <div className="text-sm font-mono text-gray-200">
                  {createdLabel}
                </div>
                <div className="text-sm font-mono text-green-400">
                  {quest.is_active ? 'READY' : 'INACTIVE'}
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center text-gray-400 font-mono py-8">
            No teacher-created quests yet. Click “Create Quest” to launch your first SDG13 mission.
          </div>
        )}
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white font-mono">ANALYTICS</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 border-2 border-gray-600 p-6">
          <h3 className="text-xl font-bold text-white font-mono mb-4">ENGAGEMENT TRENDS</h3>
          <div className="h-64 bg-gray-700 border border-gray-600 flex items-center justify-center">
            <div className="text-gray-400 font-mono">📊 Chart Placeholder</div>
          </div>
        </div>
        <div className="bg-gray-800 border-2 border-gray-600 p-6">
          <h3 className="text-xl font-bold text-white font-mono mb-4">COMPLETION RATES</h3>
          <div className="h-64 bg-gray-700 border border-gray-600 flex items-center justify-center">
            <div className="text-gray-400 font-mono">📈 Chart Placeholder</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 font-mono">
      {/* Header */}
      <header className="bg-gray-800 border-b-4 border-cyan-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo and User Info */}
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-cyan-400 flex items-center justify-center">
                <Target className="h-8 w-8 text-gray-900" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">PRAKRITI ODYSSEY</h1>
                <p className="text-cyan-400 font-semibold">TEACHER DASHBOARD - {user.username}</p>
              </div>
            </div>

            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600"
              >
                <Settings className="h-6 w-6" />
              </button>

              {showSettings && (
                <div className="absolute right-0 mt-3 w-48 bg-gray-800 border-2 border-gray-600 py-2 z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-left text-white hover:bg-gray-700 font-mono"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    LOGOUT
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 border-b-2 border-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-0">
            {[
              { id: 'overview', label: 'OVERVIEW', icon: TrendingUp },
              { id: 'students', label: 'STUDENTS', icon: Users },
              { id: 'quests', label: 'QUESTS', icon: BookOpen },
              { id: 'analytics', label: 'ANALYTICS', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'students' | 'quests' | 'analytics')}
                  className={`flex items-center space-x-3 px-6 py-4 font-bold text-sm border-2 ${
                    isActive
                      ? 'text-white bg-cyan-600 border-cyan-400'
                      : 'text-gray-400 hover:text-white bg-gray-700 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline font-mono">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {renderOverview()}
            {renderTopPerformers()}
          </div>
        )}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'quests' && renderQuests()}
        {activeTab === 'analytics' && renderAnalytics()}
      </main>

      <CreateQuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        onQuestCreated={handleQuestCreated}
        teacherId={user?.id}
      />
    </div>
  )
}
