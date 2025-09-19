'use client'

import { useState } from 'react'
import { User, GameState } from '@/types'
import { User as UserIcon, Trophy, Star, Calendar, School, Mail, Edit3, Save, X } from 'lucide-react'

interface UserProfileProps {
  user: User
  gameState: GameState
}

export default function UserProfile({ user, gameState }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    username: user.username,
    email: user.email
  })

  const handleSaveProfile = () => {
    // TODO: Implement profile update logic
    console.log('Saving profile:', editedProfile)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedProfile({
      username: user.username,
      email: user.email
    })
    setIsEditing(false)
  }

  const getJoinDate = () => {
    return new Date(user.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'eco-warrior':
        return '🌱'
      case 'questmaster':
        return '🎯'
      case 'pet-lover':
        return '🐾'
      case 'knowledge-seeker':
        return '📚'
      default:
        return '🏆'
    }
  }

  const getAvatarDisplay = () => {
    if (user.avatar) {
      return (
        <div className="text-6xl pixel-perfect">
          {user.avatar.skin_tone === 'light' ? '👱‍♀️' :
           user.avatar.skin_tone === 'medium' ? '👩' : '👩🏿'}
        </div>
      )
    }
    return (
      <div className="w-24 h-24 bg-neon-cyan border-2 border-neon-cyan shadow-pixel flex items-center justify-center pixel-perfect">
        <UserIcon className="h-12 w-12 text-gray-900" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-game-dark font-mono">
      {/* Profile Header */}
      <div className="card-pixel border-neon-cyan p-6 mb-8">
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {getAvatarDisplay()}
          </div>

          {/* User Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-neon-cyan font-mono mb-1">
                    USERNAME
                  </label>
                  <input
                    type="text"
                    value={editedProfile.username}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value }))}
                    className="block w-full px-3 py-2 bg-game-tertiary border-2 border-ui-border text-foreground font-mono focus:outline-none focus:border-neon-cyan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neon-cyan font-mono mb-1">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="block w-full px-3 py-2 bg-game-tertiary border-2 border-ui-border text-foreground font-mono focus:outline-none focus:border-neon-cyan"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    className="btn-pixel bg-neon-green border-neon-green text-gray-900 hover:shadow-neon-green font-mono font-bold"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    SAVE
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="btn-pixel bg-game-tertiary border-ui-border text-foreground hover:border-neon-cyan font-mono font-bold"
                  >
                    <X className="h-4 w-4 mr-2" />
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-neon-cyan font-pixel">{user.username.toUpperCase()}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-neon-green hover:text-neon-cyan transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1 text-neon-green font-mono">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>JOINED {getJoinDate().toUpperCase()}</span>
                  </div>
                  {user.school_id && (
                    <div className="flex items-center space-x-2">
                      <School className="h-4 w-4" />
                      <span>SCHOOL MEMBER</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card-pixel border-neon-yellow p-6 text-center">
          <div className="text-3xl font-bold text-neon-yellow font-pixel mb-2">{user.points}</div>
          <div className="flex items-center justify-center space-x-1 text-foreground-secondary font-mono">
            <Star className="h-4 w-4" />
            <span>TOTAL POINTS</span>
          </div>
        </div>

        <div className="card-pixel border-neon-purple p-6 text-center">
          <div className="text-3xl font-bold text-neon-purple font-pixel mb-2">{user.badges.length}</div>
          <div className="flex items-center justify-center space-x-1 text-foreground-secondary font-mono">
            <Trophy className="h-4 w-4" />
            <span>BADGES EARNED</span>
          </div>
        </div>

        <div className="card-pixel border-neon-green p-6 text-center">
          <div className="text-3xl font-bold text-neon-green font-pixel mb-2 capitalize">
            {gameState.pet.growth_stage}
          </div>
          <div className="flex items-center justify-center space-x-1 text-foreground-secondary font-mono">
            <span className="pixel-perfect">🐾</span>
            <span>PET STAGE</span>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="card-pixel border-neon-yellow p-6 mb-8">
        <h2 className="text-xl font-bold text-neon-yellow font-pixel mb-4 flex items-center">
          <Trophy className="h-5 w-5 mr-2" />
          ACHIEVEMENT BADGES
        </h2>

        {user.badges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {user.badges.map((badge, index) => (
              <div
                key={badge.id || index}
                className="card-pixel-hover border-ui-border p-4 text-center transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1"
              >
                <div className="text-3xl mb-2 pixel-perfect">
                  {getBadgeIcon(badge.type)}
                </div>
                <h3 className="font-bold text-neon-cyan font-pixel text-sm mb-1">
                  {badge.name || badge.id}
                </h3>
                <p className="text-xs text-foreground-secondary font-mono">
                  {badge.description || 'ACHIEVEMENT UNLOCKED!'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-neon-yellow mx-auto mb-4 pixel-perfect" />
            <h3 className="text-lg font-bold text-neon-cyan font-pixel mb-2">NO BADGES YET</h3>
            <p className="text-neon-green font-mono">COMPLETE QUESTS TO EARN YOUR FIRST BADGE!</p>
          </div>
        )}
      </div>

      {/* Pet Information */}
      <div className="card-pixel border-neon-pink p-6">
        <h2 className="text-xl font-bold text-neon-pink font-pixel mb-4 flex items-center">
          <span className="mr-2 pixel-perfect">🐾</span>
          MY PET: {gameState.pet.name.toUpperCase()}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neon-green font-mono">SPECIES:</span>
              <span className="font-bold text-neon-cyan font-mono capitalize">
                {gameState.pet.species.replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green font-mono">GROWTH STAGE:</span>
              <span className="font-bold text-neon-cyan font-mono capitalize">{gameState.pet.growth_stage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green font-mono">HEALTH:</span>
              <span className="font-bold text-neon-cyan font-mono">{gameState.pet.health}/100</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neon-green font-mono">HAPPINESS:</span>
              <span className="font-bold text-neon-cyan font-mono">{gameState.pet.happiness}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green font-mono">HUNGER:</span>
              <span className="font-bold text-neon-cyan font-mono">{gameState.pet.hunger}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green font-mono">ACCESSORIES:</span>
              <span className="font-bold text-neon-cyan font-mono">{gameState.pet.accessories.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}