'use client'

import { useEffect, useState } from 'react'
import { GameState, UserInventory } from '@/types'
import { 
  Heart, 
  Star, 
  Coins, 
  ShoppingBag, 
  Trophy, 
  MapPin, 
  Settings, 
  LogOut,
  Sparkles,
  Zap
} from 'lucide-react'
import PetDisplay from './PetDisplay'
import QuestCenter from './QuestCenter'
import PetStore from './PetStore'
import Leaderboard from './Leaderboard'
import UserProfile from './UserProfile'
import { authService } from '@/lib/auth'

interface GameDashboardProps {
  gameState: GameState
  onLogout: () => void
}

type ActiveTab = 'home' | 'quests' | 'store' | 'leaderboard' | 'profile'

export default function GameDashboard({ gameState, onLogout }: GameDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home')
  const [showSettings, setShowSettings] = useState(false)
  const [currentState, setCurrentState] = useState<GameState>(gameState)

  useEffect(() => {
    setCurrentState(gameState)
  }, [gameState])

  const userId = currentState.user.id

  const handleQuestComplete = () => {
    const latestState = authService.getGameState(userId)
    if (latestState) {
      setCurrentState(latestState)
    }
  }

  const handleInventoryChange = (updatedInventory: UserInventory) => {
    setCurrentState(prev => ({
      ...prev,
      inventory: updatedInventory
    }))
  }

  const { user, pet, inventory } = currentState

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <PetDisplay pet={pet} inventory={inventory} user={user} />
      case 'quests':
        return <QuestCenter gameState={currentState} onQuestComplete={handleQuestComplete} />
      case 'store':
        return <PetStore inventory={inventory} onInventoryChange={handleInventoryChange} />
      case 'leaderboard':
        return <Leaderboard userId={user.id} schoolId={user.school_id} />
      case 'profile':
        return <UserProfile user={user} gameState={currentState} />
      default:
        return <PetDisplay pet={pet} inventory={inventory} user={user} />
    }
  }

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'bg-green-500'
    if (health >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getHappinessColor = (happiness: number) => {
    if (happiness >= 80) return 'bg-pink-500'
    if (happiness >= 50) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  const getHungerColor = (hunger: number) => {
    if (hunger <= 20) return 'bg-green-500'
    if (hunger <= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
        <div className="min-h-screen bg-game-dark font-mono">
    {/* Header */}
            <header className="bg-game-secondary shadow-pixel border-b-4 border-neon-cyan">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo and User Info */}
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-neon-yellow border-2 border-neon-yellow shadow-pixel flex items-center justify-center pixel-perfect transform hover:translate-x-1 hover:-translate-y-1 transition-all duration-300">
                <Sparkles className="h-8 w-8 text-gray-900 animate-pulse" />
             
              </div>
              <div>
                 <h1 className="text-3xl font-bold text-neon-cyan font-pixel">PRAKRITI ODYSSEY</h1>
                <p className="text-lg text-neon-green font-mono">WELCOME BACK, {user.username.toUpperCase()}! 🌱</p>
              </div>
            </div>

            {/* User Stats */}
            <div className="flex items-center space-x-4">
              {/* Points */}
               <div className="flex items-center space-x-2 bg-neon-yellow border-2 border-neon-yellow px-4 py-3 shadow-pixel hover:shadow-neon-yellow transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 font-mono">
                <Star className="h-6 w-6 text-gray-900" />
                <span className="font-bold text-gray-900 text-lg">{user.points}</span>
              </div>

              {/* Coins */}
               <div className="flex items-center space-x-2 bg-neon-yellow border-2 border-neon-yellow px-4 py-3 shadow-pixel hover:shadow-neon-yellow transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 font-mono">
                <Coins className="h-6 w-6 text-gray-900" />
                <span className="font-bold text-gray-900 text-lg">{inventory.coins}</span>
              </div>

              {/* Logout - direct button to avoid delay */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-3 bg-game-tertiary border-2 border-neon-cyan shadow-pixel hover:shadow-neon-cyan transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1"
                >
                  <Settings className="h-6 w-6 text-neon-cyan" />
                </button>
                {showSettings && (
                  <div className="absolute right-0 mt-3 w-48 bg-game-secondary border-2 border-neon-cyan shadow-pixel py-2 z-50">
                    <button
                      onClick={onLogout}
                      className="flex items-center w-full px-4 py-3 text-left text-foreground hover:bg-danger-color transition-colors font-mono font-bold"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      LOGOUT
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pet Status Bar */}
          <div className="pb-6">
                        <div className="card-pixel border-neon-cyan p-6">

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-neon-cyan font-pixel">{pet.name.toUpperCase()} 🐾</h3>
                <span className="text-sm font-bold text-neon-green bg-game-tertiary px-3 py-1 border border-neon-green font-mono capitalize">
                 {pet.species.replace('-', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Health */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-neon-pink" />
                    <span className="font-semibold text-foreground font-mono">HEALTH</span>
                   </div>
                  <div className="status-bar-pixel">
                    <div
                      className={`status-fill-pixel ${
                        pet.health >= 80 ? 'health-fill' :
                        pet.health >= 50 ? 'warning-fill' :
                        'danger-fill'
                      }`}
                      style={{ width: `${pet.health}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground-secondary font-mono">{pet.health}/100</span>
                </div>

                {/* Happiness */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-neon-purple" />
                    <span className="font-semibold text-foreground font-mono">HAPPINESS</span>
                  </div>
                  <div className="status-bar-pixel">
                    <div
                      className={`status-fill-pixel ${
                        pet.happiness >= 80 ? 'energy-fill' :
                        pet.happiness >= 50 ? 'warning-fill' :
                        'danger-fill'
                      }`}
                      style={{ width: `${pet.happiness}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground-secondary font-mono">{pet.happiness}/100</span>
                </div>

                {/* Hunger */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-neon-yellow" />
                    <span className="font-semibold text-foreground font-mono">HUNGER</span>
                  </div>
                  <div className="status-bar-pixel">
                    <div
                      className={`status-fill-pixel ${
                        pet.hunger <= 30 ? 'health-fill' :
                        pet.hunger <= 70 ? 'warning-fill' :
                        'danger-fill'
                      }`}
                      style={{ width: `${pet.hunger}%` }}
                    />
                  </div>
                                    <span className="text-xs text-foreground-secondary font-mono">{pet.hunger}/100</span>

                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - simple horizontal row under header */}
      <nav className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 py-4">
            {[
              { id: 'home', icon: Heart, label: 'My Pet' },
              { id: 'quests', icon: MapPin, label: 'Quests' },
              { id: 'store', icon: ShoppingBag, label: 'Store' },
              { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
              { id: 'profile', icon: Settings, label: 'Profile' },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm btn-pixel ${
                    isActive ? 'btn-primary-pixel' : 'btn-secondary-pixel'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-0">
        <div className="min-h-screen">
          {renderActiveTab()}
        </div>
      </main>
    </div>
  )
}
