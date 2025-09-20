'use client'

import { useState, useEffect } from 'react'
import { UserInventory } from '@/types'
import { Coins, Star, Package } from 'lucide-react'
import storeData from '@/data/store.json'
import { authService } from '@/lib/auth'

interface PetStoreProps {
  inventory: UserInventory
  onInventoryChange?: (updated: UserInventory) => void
}

type StoreTab = 'food' | 'accessories'

type StoreFoodItem = {
  id: string
  name: string
  description: string
  image_url: string
  price: number
  nutrition_value: number
  happiness_boost: number
  rarity: 'common' | 'rare' | 'legendary'
}

type StoreAccessoryItem = {
  id: string
  name: string
  description: string
  image_url: string
  price: number
  type: string
  unlocked_at_stage: string
}

type StoreItem = StoreFoodItem | StoreAccessoryItem

const foodItems = storeData.food_items as StoreFoodItem[]
const accessoryItems = storeData.accessories as StoreAccessoryItem[]

export default function PetStore({ inventory, onInventoryChange }: PetStoreProps) {
  const [activeTab, setActiveTab] = useState<StoreTab>('food')
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [balance, setBalance] = useState(inventory.coins)

  useEffect(() => {
    setBalance(inventory.coins)
  }, [inventory.coins])

  const handlePurchase = async (item: StoreItem) => {
    if (balance < item.price) {
      alert('Not enough coins! Complete more quests to earn coins.')
      return
    }

    const user = authService.getCurrentUser()
    if (!user) {
      alert('You must be logged in to purchase.')
      return
    }

    const updated = authService.consumeInventoryItem({ userId: user.id, item })

    if (updated) {
      setBalance(updated.coins)
      onInventoryChange?.(updated)
      console.log('Purchasing:', item.name, 'for', item.price, 'coins')
      alert(`Successfully purchased ${item.name}!`)
      setShowPurchaseModal(false)
      setSelectedItem(null)
    } else {
      alert('Purchase failed. Please try again.')
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-ui-border bg-game-tertiary'
      case 'rare':
        return 'border-neon-blue bg-neon-blue'
      case 'legendary':
        return 'border-neon-purple bg-neon-purple'
      default:
        return 'border-ui-border bg-game-tertiary'
    }
  }

  const getRarityBadge = (rarity: string) => {
    const colors = {
      common: 'bg-game-tertiary border-ui-border text-foreground',
      rare: 'bg-neon-blue border-neon-blue text-gray-900',
      legendary: 'bg-neon-purple border-neon-purple text-foreground'
    }
    return `px-2 py-1 border-2 text-xs font-bold font-mono ${colors[rarity as keyof typeof colors] || colors.common}`
  }

  const renderFoodItems = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {foodItems.map((item) => (
        <div key={item.id} className={`card-pixel p-4 transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 ${getRarityColor(item.rarity)}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="text-4xl mb-2 pixel-perfect">🍃</div>
            <span className={getRarityBadge(item.rarity)}>{item.rarity.toUpperCase()}</span>
          </div>

          <h3 className="font-bold text-neon-cyan font-pixel mb-1">{item.name.toUpperCase()}</h3>
          <p className="text-sm text-foreground-secondary font-mono mb-3">{item.description}</p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neon-green font-mono">NUTRITION:</span>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < Math.floor(item.nutrition_value / 20) ? 'text-neon-yellow fill-current' : 'text-foreground-muted'}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neon-pink font-mono">HAPPINESS:</span>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < Math.floor(item.happiness_boost / 20) ? 'text-neon-pink fill-current' : 'text-foreground-muted'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-neon-yellow">
              <Coins className="h-4 w-4" />
              <span className="font-bold font-mono">{item.price}</span>
            </div>

            <button
              onClick={() => {
                setSelectedItem(item)
                setShowPurchaseModal(true)
              }}
              disabled={balance < item.price}
              className="btn-pixel bg-neon-green border-neon-green text-gray-900 hover:shadow-neon-green disabled:bg-game-tertiary disabled:border-ui-border disabled:text-foreground-secondary font-mono font-bold"
            >
              BUY
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderAccessories = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {accessoryItems.map((item) => (
        <div key={item.id} className="card-pixel border-neon-purple p-4 transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 hover:shadow-neon-purple">
          <div className="text-4xl mb-3 text-center pixel-perfect">✨</div>

          <h3 className="font-bold text-neon-purple font-pixel mb-1">{item.name.toUpperCase()}</h3>
          <p className="text-sm text-foreground-secondary font-mono mb-2">{item.description}</p>
          <p className="text-xs text-neon-cyan font-mono mb-4 capitalize">
            TYPE: {item.type} • UNLOCKS AT: {item.unlocked_at_stage}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-neon-yellow">
              <Coins className="h-4 w-4" />
              <span className="font-bold font-mono">{item.price}</span>
            </div>

            <button
              onClick={() => {
                setSelectedItem(item)
                setShowPurchaseModal(true)
              }}
              disabled={balance < item.price}
              className="btn-pixel bg-neon-purple border-neon-purple text-foreground hover:shadow-neon-purple disabled:bg-game-tertiary disabled:border-ui-border disabled:text-foreground-secondary font-mono font-bold"
            >
              BUY
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderPurchaseModal = () => {
    if (!showPurchaseModal || !selectedItem) return null

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="card-pixel border-neon-green p-6 max-w-md w-full">
          <h3 className="text-lg font-bold text-neon-green font-pixel mb-4">CONFIRM PURCHASE</h3>

          <div className="text-center mb-6">
            <div className="text-6xl mb-2 pixel-perfect">
              {activeTab === 'food' ? '🍃' : '✨'}
            </div>
            <h4 className="font-bold text-neon-cyan font-pixel">{selectedItem.name.toUpperCase()}</h4>
            <p className="text-sm text-foreground-secondary font-mono mt-1">{selectedItem.description}</p>
          </div>

          <div className="bg-game-secondary border-2 border-ui-border rounded-lg p-4 mb-6 shadow-pixel">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neon-green font-mono">PRICE:</span>
              <div className="flex items-center space-x-1 text-neon-yellow">
                <Coins className="h-4 w-4" />
                <span className="font-bold font-mono">{selectedItem.price}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-neon-green font-mono">YOUR COINS:</span>
              <div className="flex items-center space-x-1 text-neon-yellow">
                <Coins className="h-4 w-4" />
                <span className="font-bold font-mono">{balance}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t-2 border-ui-border pt-2">
              <span className="text-neon-green font-mono">AFTER PURCHASE:</span>
              <div className="flex items-center space-x-1 text-neon-yellow">
                <Coins className="h-4 w-4" />
                <span className="font-bold font-mono">{balance - selectedItem.price}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowPurchaseModal(false)
                setSelectedItem(null)
              }}
              className="flex-1 btn-pixel bg-game-tertiary border-ui-border text-foreground hover:border-neon-cyan font-mono font-bold"
            >
              CANCEL
            </button>
            <button
              onClick={() => handlePurchase(selectedItem)}
              disabled={balance < selectedItem.price}
              className="flex-1 btn-pixel bg-neon-green border-neon-green text-gray-900 hover:shadow-neon-green disabled:bg-game-tertiary disabled:border-ui-border disabled:text-foreground-secondary font-mono font-bold"
            >
              BUY NOW
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-game-dark font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-neon-cyan font-pixel mb-2">PET STORE</h2>
          <p className="text-neon-green font-mono">BUY FOOD AND ACCESSORIES FOR YOUR PET! 🛒</p>
        </div>

        <div className="flex items-center space-x-2 bg-neon-yellow border-2 border-neon-yellow px-4 py-2 shadow-pixel">
          <Coins className="h-5 w-5 text-gray-900" />
          <span className="font-bold text-gray-900 font-mono">{balance} COINS</span>
        </div>
      </div>

      {/* Store Tabs */}
      <div className="flex space-x-1 mb-6 bg-game-secondary border-2 border-ui-border p-1 shadow-pixel">
        <button
          onClick={() => setActiveTab('food')}
          className={`flex items-center space-x-2 px-4 py-2 btn-pixel transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 ${
            activeTab === 'food'
              ? 'bg-neon-green border-neon-green text-gray-900 shadow-neon-green'
              : 'bg-game-tertiary border-ui-border text-foreground-secondary hover:border-neon-cyan'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>FOOD ITEMS</span>
        </button>
        <button
          onClick={() => setActiveTab('accessories')}
          className={`flex items-center space-x-2 px-4 py-2 btn-pixel transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 ${
            activeTab === 'accessories'
              ? 'bg-neon-purple border-neon-purple text-foreground shadow-neon-purple'
              : 'bg-game-tertiary border-ui-border text-foreground-secondary hover:border-neon-cyan'
          }`}
        >
          <Star className="h-4 w-4" />
          <span>ACCESSORIES</span>
        </button>
      </div>

      {/* Store Content */}
      {activeTab === 'food' ? renderFoodItems() : renderAccessories()}

      {/* Purchase Modal */}
      {renderPurchaseModal()}
    </div>
  )
}
