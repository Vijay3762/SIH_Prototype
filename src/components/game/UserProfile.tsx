'use client'

import { useState } from 'react'
import { User, GameState, QuestCompletion } from '@/types'
import { User as UserIcon, Trophy, Star, Calendar, School, Mail, Edit3, Save, X, TrendingUp, Compass } from 'lucide-react'

type PlayerQuestCompletion = QuestCompletion & {
  quest_title?: string
  reward_points?: number
}

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

  const resolveScore = (completion: PlayerQuestCompletion): number => {
    if (typeof completion?.score === 'number') {
      return completion.score
    }
    const submission = completion?.submission
    if (submission && 'score' in submission && typeof submission.score === 'number') {
      return submission.score
    }
    return 0
  }

  const completedQuests = (gameState.completed_quests as PlayerQuestCompletion[]).slice()

  const totalCompleted = completedQuests.length
  const totalRewardPoints = completedQuests.reduce((total, completion) => {
    return total + (completion.reward_points ?? 0)
  }, 0)
  const totalRewardCoins = completedQuests.reduce((total, completion) => {
    return total + ((completion as any).reward_coins ?? 0)
  }, 0)
  const averageScore = totalCompleted
    ? Math.round(
        completedQuests.reduce((total, completion) => {
          const completionScore = resolveScore(completion)
          return total + completionScore
        }, 0) / totalCompleted
      )
    : 0
  const topScore = totalCompleted
    ? completedQuests.reduce((best, completion) => {
        const completionScore = resolveScore(completion)
        return Math.max(best, completionScore)
      }, 0)
    : 0
  const journeyPercent = Math.min(100, Math.round((totalCompleted / 10) * 100))
  const remainder = totalCompleted % 10
  const questsToNextMilestone = remainder === 0 ? 10 : 10 - remainder
  const recentCompletions = completedQuests.sort((a, b) => {
    return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  })
  const chartSeries = recentCompletions
    .slice()
    .reverse()
    .slice(-8)

  const chartWidth = 360
  const chartHeight = 160
  const chartPadding = 24
  const chartInnerWidth = chartWidth - chartPadding * 2
  const chartInnerHeight = chartHeight - chartPadding * 2

  const chartPoints = chartSeries.map((completion, index) => {
    const score = resolveScore(completion)
    const ratio = chartSeries.length > 1 ? index / (chartSeries.length - 1) : 0.5
    const x = chartPadding + ratio * chartInnerWidth
    const y = chartPadding + (1 - score / 100) * chartInnerHeight
    const label = new Date(completion.completed_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
    return { x, y, score, label }
  })

  const polylinePoints = chartPoints.map(point => `${point.x},${point.y}`).join(' ')
  const areaPoints = chartPoints.length > 0
    ? `${chartPoints[chartPoints.length - 1].x},${chartPadding + chartInnerHeight} ${polylinePoints} ${chartPoints[0].x},${chartPadding + chartInnerHeight}`
    : ''

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
                  <h1 className="font-bold text-neon-cyan font-pixel" style={{ fontSize: '18px' }}>{user.username.toUpperCase()}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-neon-green hover:text-neon-cyan transition-colors"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-1 text-neon-green font-mono">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-base sm:text-lg">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-base sm:text-lg">JOINED {getJoinDate().toUpperCase()}</span>
                  </div>
                  {user.school_id && (
                    <div className="flex items-center space-x-2">
                      <School className="h-4 w-4" />
                      <span className="text-base sm:text-lg">SCHOOL MEMBER</span>
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
          <div className="font-bold text-neon-yellow font-pixel mb-2" style={{ fontSize: '48px' }}>{user.points}</div>
          <div className="flex items-center justify-center space-x-1 text-foreground-secondary font-mono" style={{ fontSize: '16px' }}>
            <Star className="h-4 w-4" />
            <span>TOTAL POINTS</span>
          </div>
        </div>

        <div className="card-pixel border-neon-purple p-6 text-center">
          <div className="font-bold text-neon-purple font-pixel mb-2" style={{ fontSize: '48px' }}>{user.badges.length}</div>
          <div className="flex items-center justify-center space-x-1 text-foreground-secondary font-mono" style={{ fontSize: '16px' }}>
            <Trophy className="h-4 w-4" />
            <span>BADGES EARNED</span>
          </div>
        </div>

        <div className="card-pixel border-neon-green p-6 text-center">
          <div className="font-bold text-neon-green font-pixel mb-2 capitalize" style={{ fontSize: '48px' }}>
            {gameState.pet.growth_stage}
          </div>
          <div className="flex items-center justify-center space-x-1 text-foreground-secondary font-mono" style={{ fontSize: '16px' }}>
            <span className="pixel-perfect" style={{ fontSize: '15px' }}>🐾</span>
            <span>PET STAGE</span>
          </div>
        </div>
      </div>

      {/* Journey Progress */}
      <div className="card-pixel border-neon-blue p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="font-bold text-neon-blue font-pixel flex items-center" style={{ fontSize: '28px' }}>
            <Compass className="h-8 w-8 mr-2" />
            YOUR JOURNEY
          </h2>
          <div className="flex items-center space-x-2 text-neon-green font-mono text-lg sm:text-xl">
            <TrendingUp className="h-5 w-5" />
            <span>{averageScore}% avg. score</span>
          </div>
        </div>

        {totalCompleted > 0 ? (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm sm:text-base text-foreground-secondary font-mono mb-2">
                <span>{totalCompleted} quests completed</span>
                <span>Next milestone in {questsToNextMilestone} quest{questsToNextMilestone === 1 ? '' : 's'}</span>
              </div>
              <div className="status-bar-pixel h-4 overflow-hidden">
                <div
                  className="status-fill-pixel energy-fill"
                  style={{ width: `${journeyPercent}%` }}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-game-tertiary border-2 border-neon-blue p-4 shadow-pixel">
                <div className="text-base sm:text-lg text-foreground-secondary font-mono mb-1">BEST SCORE</div>
                <div className="text-3xl sm:text-4xl font-bold text-neon-blue font-pixel">{topScore}%</div>
              </div>
            <div className="bg-game-tertiary border-2 border-neon-blue p-4 shadow-pixel">
              <div className="text-base sm:text-lg text-foreground-secondary font-mono mb-1">TOTAL REWARD</div>
              <div className="text-3xl sm:text-4xl font-bold text-neon-blue font-pixel flex items-baseline space-x-2">
                <span>{totalRewardPoints}</span>
                <span className="text-base font-mono">pts</span>
              </div>
              <div className="text-sm text-neon-green font-mono mt-1">+{totalRewardCoins} coins earned</div>
            </div>
              <div className="bg-game-tertiary border-2 border-neon-blue p-4 shadow-pixel">
                <div className="text-base sm:text-lg text-foreground-secondary font-mono mb-1">LATEST QUEST</div>
                <div className="text-lg sm:text-xl font-semibold text-neon-green font-mono">
                  {recentCompletions[0]?.quest_title || '—'}
                </div>
              </div>
            </div>

            <div className="bg-game-tertiary border-2 border-ui-border shadow-pixel p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-foreground-secondary font-mono">SCORE JOURNEY</span>
                <span className="text-xs text-foreground-secondary font-mono">
                  {chartSeries.length > 0 ? `${chartSeries.length} latest quests` : 'No quests yet'}
                </span>
              </div>
              {chartPoints.length > 0 ? (
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40">
                  <defs>
                    <linearGradient id="journey-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(0, 255, 170, 0.35)" />
                      <stop offset="100%" stopColor="rgba(0, 255, 170, 0.05)" />
                    </linearGradient>
                    <linearGradient id="journey-stroke" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((value) => {
                    const y = chartPadding + (1 - value / 100) * chartInnerHeight
                    return (
                      <g key={value}>
                        <line
                          x1={chartPadding}
                          y1={y}
                          x2={chartPadding + chartInnerWidth}
                          y2={y}
                          stroke="rgba(148, 163, 184, 0.15)"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={chartPadding - 12}
                          y={y + 4}
                          fontSize="10"
                          fill="rgba(148, 163, 184, 0.6)"
                          textAnchor="end"
                          className="font-mono"
                        >
                          {value}
                        </text>
                      </g>
                    )
                  })}

                  {/* Area fill */}
                  <polygon
                    points={areaPoints}
                    fill="url(#journey-gradient)"
                    opacity={0.8}
                  />

                  {/* Score line */}
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="url(#journey-stroke)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Points */}
                  {chartPoints.map((point, index) => (
                    <g key={index}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={5}
                        fill="#22d3ee"
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                      <text
                        x={point.x}
                        y={point.y - 12}
                        fontSize="10"
                        fill="#38bdf8"
                        textAnchor="middle"
                        className="font-mono"
                      >
                        {point.score}%
                      </text>
                      <text
                        x={point.x}
                        y={chartPadding + chartInnerHeight + 16}
                        fontSize="10"
                        fill="rgba(148, 163, 184, 0.6)"
                        textAnchor="middle"
                        className="font-mono"
                      >
                        {point.label}
                      </text>
                    </g>
                  ))}
                </svg>
              ) : (
                <div className="text-center text-sm text-foreground-secondary font-mono py-8">
                  Complete quests to start charting your eco-progress!
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {recentCompletions.map((completion) => {
                const completionScore = resolveScore(completion)
                const completedAt = new Date(completion.completed_at).toLocaleString()
                const rewardPoints = completion.reward_points ?? 0
                const rewardCoins = (completion as any).reward_coins ?? 0
                return (
                  <div
                    key={completion.id}
                    className="bg-game-tertiary border-2 border-ui-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:border-neon-blue transition-colors"
                  >
                    <div>
                      <div className="text-sm font-bold text-neon-cyan font-pixel">
                        {completion.quest_title || completion.quest_id}
                      </div>
                      <div className="text-xs text-foreground-secondary font-mono">{completedAt}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm text-neon-green">{completionScore}%</span>
                      <span className="font-mono text-xs text-neon-yellow">+{rewardPoints} pts</span>
                      <span className="font-mono text-xs text-neon-green">+{rewardCoins} coins</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Compass className="h-12 w-12 text-neon-blue mx-auto mb-3" />
            <p className="text-neon-green font-mono">Start a quest to chart your eco-adventure!</p>
          </div>
        )}
      </div>

      {/* Badges Section */}
      <div className="card-pixel border-neon-yellow p-6 mb-8">
        <h2 className="font-bold text-neon-yellow font-pixel mb-4 flex items-center" style={{ fontSize: '22px' }}>
          <Trophy className="h-8 w-8 mr-2" />
          ACHIEVEMENT BADGES
        </h2>

        {user.badges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {user.badges.map((badge, index) => (
              <div
                key={badge.id || index}
                className="card-pixel-hover border-ui-border p-4 text-center transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1"
              >
                <div className="text-4xl mb-2 pixel-perfect">
                  {getBadgeIcon(badge.type)}
                </div>
                <h3 className="font-bold text-neon-cyan font-pixel text-base sm:text-lg mb-1">
                  {badge.name || badge.id}
                </h3>
                <p className="text-sm sm:text-base text-foreground-secondary font-mono">
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
        <h2 className="font-bold text-neon-pink font-pixel mb-4 flex items-center" style={{ fontSize: '28px' }}>
          <span className="mr-2 pixel-perfect" style={{ fontSize: '28px' }}>🐾</span>
          MY PET: {gameState.pet.name.toUpperCase()}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neon-green font-mono text-base sm:text-lg">SPECIES:</span>
              <span className="font-bold text-neon-cyan font-mono capitalize text-base sm:text-lg">
                {gameState.pet.species.replace('-', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green font-mono text-base sm:text-lg">GROWTH STAGE:</span>
              <span className="font-bold text-neon-cyan font-mono capitalize text-base sm:text-lg">{gameState.pet.growth_stage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green font-mono text-base sm:text-lg">HEALTH:</span>
              <span className="font-bold text-neon-cyan font-mono text-base sm:text-lg">{gameState.pet.health}/100</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neon-green font-mono text-base sm:text-lg">HAPPINESS:</span>
              <span className="font-bold text-neon-cyan font-mono text-base sm:text-lg">{gameState.pet.happiness}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green font-mono text-base sm:text-lg">HUNGER:</span>
              <span className="font-bold text-neon-cyan font-mono text-base sm:text-lg">{gameState.pet.hunger}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neon-green font-mono text-base sm:text-lg">ACCESSORIES:</span>
              <span className="font-bold text-neon-cyan font-mono text-base sm:text-lg">{gameState.pet.accessories.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
