'use client'

import { useState, useEffect, useRef } from 'react'
import { Pet, UserInventory, User } from '@/types'
import { Heart, Sparkles, Utensils, ShoppingBag, Star, Gamepad2, Droplets, Zap, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Zap as Lightning } from 'lucide-react'
import Scene3D, { Scene3DRef } from './Scene3D'

interface PetDisplayProps {
  pet: Pet
  inventory: UserInventory
  user: User
}

export default function PetDisplay({ pet, inventory, user }: PetDisplayProps) {
  const sceneRef = useRef<Scene3DRef>(null)
  const [selectedFood, setSelectedFood] = useState<string | null>(null)
  const [showFeedingOptions, setShowFeedingOptions] = useState(false)
  const [showMiniGames, setShowMiniGames] = useState<'fetch' | 'bubble' | 'recycle' | null>(null)
  const [petStats, setPetStats] = useState(pet)
  const [lastInteraction, setLastInteraction] = useState<string>('')
  const [showStats, setShowStats] = useState(true)
  const [currentAnimation, setCurrentAnimation] = useState('Idle')

  useEffect(() => {
    // Update pet stats based on time decay
    const interval = setInterval(() => {
      setPetStats(prev => ({
        ...prev,
        hunger: Math.min(100, prev.hunger + 1), // Hunger increases over time
        happiness: Math.max(0, prev.happiness - 0.5), // Happiness decreases
        health: prev.hunger > 90 ? Math.max(0, prev.health - 1) : prev.health // Health decreases if very hungry
      }))
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handlePetInteraction = (type: 'feed' | 'play' | 'pet') => {
    setLastInteraction(type)
    
    switch (type) {
      case 'feed':
        setShowFeedingOptions(true)
        break
      case 'play':
        // Show mini-game selection
        setShowMiniGames('fetch')
        break
      case 'pet':
        // Increase happiness slightly
        setPetStats(prev => ({
          ...prev,
          happiness: Math.min(100, prev.happiness + 5)
        }))
        break
    }
  }

  const handleFeedPet = async (foodId: string) => {
    const foodItem = inventory.food_items.find(item => item.item_id === foodId)
    if (!foodItem || foodItem.quantity <= 0) {
      alert('No food available!')
      return
    }

    // Get food properties from store data
    const foodProperties = getFoodProperties(foodId)
    
    setPetStats(prev => ({
      ...prev,
      hunger: Math.max(0, prev.hunger - foodProperties.nutrition),
      happiness: Math.min(100, prev.happiness + foodProperties.happiness),
      health: Math.min(100, prev.health + foodProperties.nutrition / 2),
      last_fed: new Date().toISOString()
    }))

    // TODO: Update inventory in backend
    console.log('Fed pet with:', foodId)
    alert(`${pet.name} enjoyed the ${foodId.replace('-', ' ')}! 🐾`)
    setShowFeedingOptions(false)
  }

  const getFoodProperties = (foodId: string) => {
    const foodProps: Record<string, { nutrition: number, happiness: number }> = {
      'basic-seeds': { nutrition: 15, happiness: 5 },
      'fresh-berries': { nutrition: 20, happiness: 15 },
      'organic-vegetables': { nutrition: 25, happiness: 10 },
      'algae-smoothie': { nutrition: 30, happiness: 20 },
      'energy-crystals': { nutrition: 50, happiness: 30 }
    }
    return foodProps[foodId] || { nutrition: 10, happiness: 5 }
  }

  const handleMiniGameComplete = (score: number, coins: number) => {
    setPetStats(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + Math.floor(score / 10))
    }))
    
    // TODO: Update user coins in backend
    alert(`Great job! Score: ${score}, Earned: ${coins} coins! 🎉`)
    setShowMiniGames(null)
  }

  const getStageEmoji = (stage: string) => {
    const stages = {
      egg: '🥚',
      baby: '🐣', 
      child: '🌱',
      adult: '🦋',
      elder: '✨'
    }
    return stages[stage as keyof typeof stages] || '🐣'
  }

  const getHealthStatus = () => {
    if (petStats.health > 80) return { color: 'text-green-600', status: 'Excellent' }
    if (petStats.health > 50) return { color: 'text-yellow-600', status: 'Good' }
    return { color: 'text-red-600', status: 'Poor' }
  }

  const getHappinessStatus = () => {
    if (petStats.happiness > 80) return { color: 'text-pink-600', status: 'Joyful' }
    if (petStats.happiness > 50) return { color: 'text-yellow-600', status: 'Content' }
    return { color: 'text-gray-600', status: 'Sad' }
  }

  const getHungerStatus = () => {
    if (petStats.hunger < 30) return { color: 'text-green-600', status: 'Full' }
    if (petStats.hunger < 70) return { color: 'text-yellow-600', status: 'Hungry' }
    return { color: 'text-red-600', status: 'Starving' }
  }

  const handleAnimationChange = (animation: string) => {
    setCurrentAnimation(animation)
    switch (animation) {
      case 'Idle':
        sceneRef.current?.playIdle()
        break
      case 'Walking':
        sceneRef.current?.playWalking()
        break
      case 'Running':
        sceneRef.current?.playRunning()
        break
      case 'Dance':
        sceneRef.current?.playDance()
        break
      case 'Jump':
        sceneRef.current?.playJump()
        break
      default:
        sceneRef.current?.triggerAnimation(animation)
    }
  }

  return (
    <div className="relative w-full min-h-[85vh] bg-game-dark font-body">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="relative card-pixel overflow-hidden h-[80vh]">
          {/* Stats Panel - inside card */}
          <div className={`absolute top-4 left-4 z-20 transition-all duration-200 ${showStats ? 'translate-x-0' : '-translate-x-full'}`}>
             <div className="card-pixel">
              <button
                onClick={() => setShowStats(!showStats)}
                className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white border rounded-full p-1 shadow"
                aria-label="Toggle stats"
                title="Toggle stats"
              >
                {showStats ? (
                  <ChevronLeft className="h-5 w-5" style={{ color: '#2563eb' }} />
                ) : (
                  <ChevronRight className="h-5 w-5" style={{ color: '#2563eb' }} />
                )}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{getStageEmoji(petStats.growth_stage)}</div>
                <div>
                  <h3 className="text-xl font-heading font-semibold" style={{ color: '#1e293b' }}>{pet.name}</h3>
                  <p className="text-sm font-body capitalize" style={{ color: '#10b981' }}>{petStats.growth_stage} {petStats.species.replace('-', ' ')}</p>
                </div>
              </div>

              <div className="space-y-4">
            {/* Health */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5" style={{ color: '#ef4444' }} />
                  <span className="font-semibold font-body" style={{ color: '#1e293b' }}>Health</span>
                </div>
                <span className={`text-sm font-semibold ${getHealthStatus().color}`}>
                  {getHealthStatus().status}
                </span>
              </div>
              <div className="status-bar-pixel">
                <div
                  className={`status-fill-pixel ${
                    petStats.health >= 80 ? 'health-fill' :
                    petStats.health >= 50 ? 'warning-fill' :
                    'danger-fill'
                  }`}
                  style={{ width: `${petStats.health}%` }}
                />
              </div>
              <span className="text-xs text-foreground-secondary">{petStats.health}/100</span>
            </div>

            {/* Happiness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" style={{ color: '#8b5cf6' }} />
                  <span className="font-semibold" style={{ color: '#1e293b' }}>Happy</span>
                </div>
                <span className={`text-sm font-semibold ${getHappinessStatus().color}`}>
                  {getHappinessStatus().status}
                </span>
              </div>
              <div className="status-bar-pixel">
                <div
                  className={`status-fill-pixel ${
                    petStats.happiness >= 80 ? 'energy-fill' :
                    petStats.happiness >= 50 ? 'warning-fill' :
                    'danger-fill'
                  }`}
                  style={{ width: `${petStats.happiness}%` }}
                />
              </div>
              <span className="text-xs text-foreground-secondary">{petStats.happiness}/100</span>
            </div>

            {/* Hunger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" style={{ color: '#eab308' }} />
                  <span className="font-semibold" style={{ color: '#1e293b' }}>Hunger</span>
                </div>
                <span className={`text-sm font-semibold ${getHungerStatus().color}`}>
                  {getHungerStatus().status}
                </span>
              </div>
              <div className="status-bar-pixel">
                <div
                  className={`status-fill-pixel ${
                    petStats.hunger <= 30 ? 'health-fill' :
                    petStats.hunger <= 70 ? 'warning-fill' :
                    'danger-fill'
                  }`}
                  style={{ width: `${petStats.hunger}%` }}
                />
              </div>
              <span className="text-xs text-foreground-secondary">{petStats.hunger}/100</span>
            </div>
              </div>
            </div>
          </div>

          {/* Animation Controls - Top Right */}
          <div className="absolute top-4 right-4 z-20">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleAnimationChange('Idle')}
                className={`btn-pixel ${currentAnimation === 'Idle' ? 'bg-neon-cyan text-gray-900' : ''}`}
                title="Idle Animation"
              >
                <div className="flex items-center gap-2">
                  <Pause className="h-4 w-4" />
                  <span className="text-sm">Idle</span>
                </div>
              </button>
              <button
                onClick={() => handleAnimationChange('Walking')}
                className={`btn-pixel ${currentAnimation === 'Walking' ? 'bg-neon-green text-gray-900' : ''}`}
                title="Walking Animation"
              >
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span className="text-sm">Walk</span>
                </div>
              </button>
              <button
                onClick={() => handleAnimationChange('Running')}
                className={`btn-pixel ${currentAnimation === 'Running' ? 'bg-neon-yellow text-gray-900' : ''}`}
                title="Running Animation"
              >
                <div className="flex items-center gap-2">
                  <Lightning className="h-4 w-4" />
                  <span className="text-sm">Run</span>
                </div>
              </button>
              <button
                onClick={() => handleAnimationChange('Dance')}
                className={`btn-pixel ${currentAnimation === 'Dance' ? 'bg-neon-purple text-white' : ''}`}
                title="Dance Animation"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span className="text-sm">Dance</span>
                </div>
              </button>
              <button
                onClick={() => handleAnimationChange('Jump')}
                className={`btn-pixel ${currentAnimation === 'Jump' ? 'bg-neon-blue text-gray-900' : ''}`}
                title="Jump Animation"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">Jump</span>
                </div>
              </button>
              <button
                onClick={() => setShowFeedingOptions(true)}
                className="btn-pixel bg-neon-orange text-gray-900"
                title="Feed Pet"
              >
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  <span className="text-sm">Feed</span>
                </div>
              </button>
            </div>
          </div>

          {/* 3D Scene inside card */}
          <Scene3D
            ref={sceneRef}
            pet={petStats}
            user={user}
            onPetInteraction={handlePetInteraction}
            showMiniGame={showMiniGames}
            onMiniGameComplete={handleMiniGameComplete}
          />

        </div>
      </div>

      {/* Feeding Modal */}
      {showFeedingOptions && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30">
          <div className="card-pixel max-w-md w-full mx-4">
            <h3 className="text-2xl font-heading font-semibold mb-6 text-center" style={{ color: '#1e293b' }}>Feed {pet.name}</h3>
            
            {inventory.food_items.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 max-h-64 overflow-y-auto">
                {inventory.food_items.map((food) => (
                  <button
                    key={food.item_id}
                    onClick={() => handleFeedPet(food.item_id)}
                    className="flex items-center justify-between p-4 card-pixel-hover"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🥕</div>
                      <div className="text-left">
                        <p className="font-semibold capitalize">
                          {food.item_id.replace('-', ' ')}
                        </p>
                        <p className="text-sm text-foreground-secondary">QTY: {food.quantity}</p>
                      </div>
                    </div>
                    <div className="font-semibold" style={{ color: '#22c55e' }}>FEED</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="h-16 w-16 text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-secondary mb-2">No food in inventory</p>
                <p className="text-sm text-foreground-muted">Complete quests to earn coins and buy food.</p>
              </div>
            )}
            
            <button
              onClick={() => setShowFeedingOptions(false)}
              className="w-full mt-6 btn-pixel btn-outline-pixel"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
