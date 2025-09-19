'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/lib/auth'
import { GameState, User } from '@/types'
import { useRouter } from 'next/navigation'
import GameDashboard from '@/components/game/GameDashboard'

export default function StudentPage() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    
    if (!currentUser || currentUser.role !== 'student') {
      router.push('/')
      return
    }

    setUser(currentUser)
    
    // Load game state
    const gameData = authService.getGameState(currentUser.id)
    if (gameData) {
      setGameState(gameData)
    }
    
    setIsLoading(false)
  }, [router])

  const handleLogout = async () => {
    await authService.logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!gameState || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Game data not found</h1>
          <button 
            onClick={handleLogout}
            className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return <GameDashboard gameState={gameState} onLogout={handleLogout} />
}