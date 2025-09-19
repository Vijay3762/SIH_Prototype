'use client'

import { useState, useEffect } from 'react'
import { Leaderboard as LeaderboardType } from '@/types'
import { Trophy, Medal, Star, School, Globe, Filter } from 'lucide-react'

interface LeaderboardProps {
  userId: string
  schoolId?: string
}

type LeaderboardFilter = 'global' | 'school'
type LeaderboardPeriod = 'daily' | 'weekly' | 'all-time'

export default function Leaderboard({ userId, schoolId }: LeaderboardProps) {
  const [filter, setFilter] = useState<LeaderboardFilter>('school')
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time')
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardType[]>([])
  const [userRank, setUserRank] = useState<LeaderboardType | null>(null)

  useEffect(() => {
    loadLeaderboardData()
  }, [filter, period])

  const loadLeaderboardData = async () => {
    // Mock leaderboard data - in real app this would come from API
    const mockData: LeaderboardType[] = [
      {
        id: '1',
        user_id: 'user-005',
        username: 'DragonMaster',
        school_id: 'school-002',
        school_name: 'Riverdale Middle School',
        points: 750,
        badges_count: 4,
        pet_stage: 'adult',
        period: 'all-time',
        rank: 1,
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        user_id: 'user-002',
        username: 'NatureGuard',
        school_id: 'school-001',
        school_name: 'Greenwood Elementary',
        points: 520,
        badges_count: 3,
        pet_stage: 'adult',
        period: 'all-time',
        rank: 2,
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        user_id: 'user-001',
        username: 'EcoExplorer',
        school_id: 'school-001',
        school_name: 'Greenwood Elementary',
        points: 350,
        badges_count: 2,
        pet_stage: 'child',
        period: 'all-time',
        rank: 3,
        updated_at: new Date().toISOString()
      }
    ]

    // Filter by school if needed
    let filteredData = mockData
    if (filter === 'school' && schoolId) {
      filteredData = mockData.filter(entry => entry.school_id === schoolId)
    }

    setLeaderboardData(filteredData)

    // Find current user's rank
    const currentUser = filteredData.find(entry => entry.user_id === userId)
    if (currentUser) {
      setUserRank(currentUser)
    } else {
      // User not in top rankings, create mock entry
      setUserRank({
        id: 'current',
        user_id: userId,
        username: 'You',
        school_id: schoolId,
        school_name: 'Your School',
        points: 0,
        badges_count: 0,
        pet_stage: 'baby',
        period: 'all-time',
        rank: filteredData.length + 1,
        updated_at: new Date().toISOString()
      })
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-neon-yellow" />
      case 2:
        return <Medal className="h-6 w-6 text-neon-cyan" />
      case 3:
        return <Medal className="h-6 w-6 text-neon-pink" />
      default:
        return <span className="text-lg font-bold text-neon-green font-mono">#{rank}</span>
    }
  }

  const getPetStageEmoji = (stage: string) => {
    const emojis = {
      egg: '🥚',
      baby: '🐣',
      child: '🌱',
      adult: '🦋',
      elder: '✨'
    }
    return emojis[stage as keyof typeof emojis] || '🐣'
  }

  const renderLeaderboardEntry = (entry: LeaderboardType, index: number) => {
    const isCurrentUser = entry.user_id === userId

    return (
      <div
        key={entry.id}
        className={`flex items-center space-x-4 p-4 card-pixel transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 ${
          isCurrentUser
            ? 'border-neon-blue shadow-neon-blue'
            : 'border-ui-border'
        }`}
      >
        {/* Rank */}
        <div className="flex-shrink-0 w-12 flex justify-center">
          {getRankIcon(entry.rank)}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className={`font-bold truncate font-mono ${
              isCurrentUser ? 'text-neon-blue' : 'text-neon-cyan'
            }`}>
              {entry.username.toUpperCase()}
              {isCurrentUser && <span className="text-neon-cyan ml-1">(YOU)</span>}
            </h3>
            <span className="text-lg pixel-perfect">{getPetStageEmoji(entry.pet_stage)}</span>
          </div>
          {entry.school_name && (
            <p className="text-sm text-neon-green font-mono truncate">{entry.school_name.toUpperCase()}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1 text-neon-yellow">
            <Star className="h-4 w-4" />
            <span className="font-bold font-mono">{entry.points}</span>
          </div>
          <div className="flex items-center space-x-1 text-neon-purple">
            <Trophy className="h-4 w-4" />
            <span className="font-bold font-mono">{entry.badges_count}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-game-dark font-mono">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neon-cyan font-pixel mb-2">LEADERBOARD</h2>
        <p className="text-neon-green font-mono">SEE HOW YOU RANK AGAINST OTHER ECO-WARRIORS! 🏆</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Scope Filter */}
        <div className="flex space-x-1 bg-game-secondary border-2 border-ui-border p-1 shadow-pixel">
          <button
            onClick={() => setFilter('school')}
            className={`flex items-center space-x-2 px-3 py-2 btn-pixel transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 ${
              filter === 'school'
                ? 'bg-neon-green border-neon-green text-gray-900 shadow-neon-green'
                : 'bg-game-tertiary border-ui-border text-foreground-secondary hover:border-neon-cyan'
            }`}
          >
            <School className="h-4 w-4" />
            <span>SCHOOL</span>
          </button>
          <button
            onClick={() => setFilter('global')}
            className={`flex items-center space-x-2 px-3 py-2 btn-pixel transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 ${
              filter === 'global'
                ? 'bg-neon-blue border-neon-blue text-gray-900 shadow-neon-blue'
                : 'bg-game-tertiary border-ui-border text-foreground-secondary hover:border-neon-cyan'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>GLOBAL</span>
          </button>
        </div>

        {/* Period Filter */}
        <div className="flex space-x-1 bg-game-secondary border-2 border-ui-border p-1 shadow-pixel">
          {['daily', 'weekly', 'all-time'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as LeaderboardPeriod)}
              className={`px-3 py-2 btn-pixel transition-all duration-300 transform hover:translate-x-1 hover:-translate-y-1 capitalize ${
                period === p
                  ? 'bg-neon-purple border-neon-purple text-foreground shadow-neon-purple'
                  : 'bg-game-tertiary border-ui-border text-foreground-secondary hover:border-neon-cyan'
              }`}
            >
              {p.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Current User Rank (if not in top list) */}
      {userRank && userRank.rank > 3 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-neon-cyan font-mono mb-2 flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            YOUR RANK
          </h3>
          {renderLeaderboardEntry(userRank, -1)}
        </div>
      )}

      {/* Top Rankings */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-neon-cyan font-mono flex items-center">
          <Trophy className="h-4 w-4 mr-1" />
          TOP {filter === 'school' ? 'SCHOOL' : 'GLOBAL'} RANKINGS
        </h3>

        {leaderboardData.length > 0 ? (
          leaderboardData.map((entry, index) => renderLeaderboardEntry(entry, index))
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-neon-cyan mx-auto mb-4 pixel-perfect" />
            <h3 className="text-lg font-bold text-neon-cyan font-pixel mb-2">NO RANKINGS YET</h3>
            <p className="text-neon-green font-mono">COMPLETE QUESTS TO START CLIMBING THE LEADERBOARD!</p>
          </div>
        )}
      </div>

      {/* Motivation Message */}
      <div className="mt-8 card-pixel border-neon-green p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Star className="h-5 w-5 text-neon-green" />
          <h3 className="font-bold text-neon-green font-pixel">KEEP GOING!</h3>
        </div>
        <p className="text-sm text-foreground-secondary font-mono">
          COMPLETE MORE QUESTS TO EARN POINTS AND CLIMB THE LEADERBOARD. EVERY ENVIRONMENTAL ACTION COUNTS! 🌱
        </p>
      </div>
    </div>
  )
}