'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/lib/auth'
import { User } from '@/types'
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
  CheckCircle,
  Clock,
  Target
} from 'lucide-react'

export default function TeacherDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'quests' | 'analytics'>('overview')
  const [showSettings, setShowSettings] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    
    if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'school-admin')) {
      router.push('/')
      return
    }

    setUser(currentUser)
    setIsLoading(false)
  }, [router])

  const handleLogout = async () => {
    await authService.logout()
    router.push('/')
  }

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
              <p className="text-gray-400 text-sm font-mono">TOTAL STUDENTS</p>
              <p className="text-2xl font-bold text-white font-mono">24</p>
            </div>
            <Users className="h-8 w-8 text-cyan-400" />
          </div>
        </div>

        <div className="bg-gray-800 border-2 border-green-400 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-mono">ACTIVE QUESTS</p>
              <p className="text-2xl font-bold text-white font-mono">8</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 border-2 border-blue-400 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-mono">COMPLETIONS</p>
              <p className="text-2xl font-bold text-white font-mono">156</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 border-2 border-yellow-400 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-mono">AVG SCORE</p>
              <p className="text-2xl font-bold text-white font-mono">87%</p>
            </div>
            <Award className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 border-2 border-gray-600">
        <div className="border-b-2 border-gray-600 p-4">
          <h2 className="text-xl font-bold text-white font-mono">RECENT ACTIVITY</h2>
        </div>
        <div className="p-4 space-y-4">
          {[
            { student: 'EcoExplorer', action: 'completed quest', quest: 'Ocean Cleanup', time: '2 min ago' },
            { student: 'NatureGuard', action: 'submitted photo', quest: 'Tree Planting', time: '5 min ago' },
            { student: 'DragonMaster', action: 'earned badge', quest: 'Eco Warrior', time: '10 min ago' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-700 p-3 border border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-cyan-400"></div>
                <span className="text-white font-mono">{activity.student}</span>
                <span className="text-gray-400 font-mono">{activity.action}</span>
                <span className="text-cyan-400 font-mono">"{activity.quest}"</span>
              </div>
              <span className="text-gray-500 text-sm font-mono">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

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
        <div className="border-b-2 border-gray-600 p-4 grid grid-cols-5 gap-4 font-mono text-gray-400 text-sm">
          <div>STUDENT</div>
          <div>PROGRESS</div>
          <div>PET STAGE</div>
          <div>POINTS</div>
          <div>ACTIONS</div>
        </div>
        {[
          { name: 'EcoExplorer', progress: 75, petStage: 'child', points: 350, status: 'active' },
          { name: 'NatureGuard', progress: 90, petStage: 'adult', points: 520, status: 'active' },
          { name: 'DragonMaster', progress: 95, petStage: 'adult', points: 750, status: 'active' },
        ].map((student, index) => (
          <div key={index} className="p-4 border-b border-gray-700 grid grid-cols-5 gap-4 items-center">
            <div className="text-white font-mono">{student.name}</div>
            <div className="flex items-center space-x-2">
              <div className="w-full bg-gray-700 h-2">
                <div 
                  className="bg-cyan-400 h-2" 
                  style={{ width: `${student.progress}%` }}
                ></div>
              </div>
              <span className="text-white text-sm font-mono">{student.progress}%</span>
            </div>
            <div className="text-green-400 font-mono uppercase">{student.petStage}</div>
            <div className="text-yellow-400 font-mono">{student.points}</div>
            <div className="flex space-x-2">
              <button className="bg-blue-600 text-white p-2 hover:bg-blue-500">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderQuests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white font-mono">QUEST MANAGEMENT</h2>
        <button className="bg-green-600 text-white px-4 py-2 font-mono hover:bg-green-500 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>CREATE QUEST</span>
        </button>
      </div>

      <div className="bg-gray-800 border-2 border-gray-600">
        <div className="border-b-2 border-gray-600 p-4 grid grid-cols-6 gap-4 font-mono text-gray-400 text-sm">
          <div>QUEST</div>
          <div>TYPE</div>
          <div>DIFFICULTY</div>
          <div>COMPLETION</div>
          <div>REWARD</div>
          <div>STATUS</div>
        </div>
        {[
          { name: 'Ocean Cleanup Challenge', type: 'PHOTO', difficulty: 'MEDIUM', completion: '15/24', reward: '50pts', status: 'ACTIVE' },
          { name: 'Renewable Energy Quiz', type: 'QUIZ', difficulty: 'HARD', completion: '8/24', reward: '75pts', status: 'ACTIVE' },
          { name: 'Tree Planting Mission', type: 'QR', difficulty: 'EASY', completion: '22/24', reward: '30pts', status: 'ACTIVE' },
        ].map((quest, index) => (
          <div key={index} className="p-4 border-b border-gray-700 grid grid-cols-6 gap-4 items-center">
            <div className="text-white font-mono">{quest.name}</div>
            <div className="text-blue-400 font-mono">{quest.type}</div>
            <div className={`font-mono ${
              quest.difficulty === 'EASY' ? 'text-green-400' : 
              quest.difficulty === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {quest.difficulty}
            </div>
            <div className="text-cyan-400 font-mono">{quest.completion}</div>
            <div className="text-yellow-400 font-mono">{quest.reward}</div>
            <div className="text-green-400 font-mono">{quest.status}</div>
          </div>
        ))}
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
                  onClick={() => setActiveTab(tab.id as any)}
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'quests' && renderQuests()}
        {activeTab === 'analytics' && renderAnalytics()}
      </main>
    </div>
  )
}