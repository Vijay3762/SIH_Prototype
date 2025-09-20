'use client'

import {
  User,
  MockCredentials,
  GameState,
  Quest,
  QuestCompletion,
  QuizSubmission,
  BadgeType,
  QuizQuest,
  PetSpecies,
  PetGrowthStage,
  UserInventory,
  InventoryAccessory
} from '@/types'

type ExtendedQuestCompletion = QuestCompletion & {
  quest_title: string
  quest_type: Quest['type']
  reward_points: number
  reward_coins: number
  is_perfect: boolean
}

type QuestHistoryItem = ExtendedQuestCompletion & {
  username: string
}

type LeaderboardRecord = {
  user_id: string
  username: string
  school_id?: string
  school_name?: string
  points: number
  coins: number
  badges_count: number
  pet_stage: PetGrowthStage
  updated_at: string
}
import mockUsersData from '@/data/mock-users.json'

// Mock authentication service
export class MockAuthService {
  private static instance: MockAuthService
  private currentUser: User | null = null
  private listeners: Array<(user: User | null) => void> = []

  private readonly questHistoryEventName = 'prakritiQuestUpdate'
  private readonly leaderboardEventName = 'prakritiLeaderboardUpdate'
  private readonly inventoryStoragePrefix = 'prakriti_inventory_'
  private readonly leaderboardStorageKey = 'prakriti_leaderboard'

  private isBrowser(): boolean {
    return typeof window !== 'undefined'
  }

  private getInventoryStorageKey(userId: string) {
    return `${this.inventoryStoragePrefix}${userId}`
  }

  private readStoredInventory(userId: string): UserInventory | null {
    if (!this.isBrowser()) return null

    const stored = window.localStorage.getItem(this.getInventoryStorageKey(userId))
    if (!stored) return null

    try {
      const parsed = JSON.parse(stored) as UserInventory
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    } catch (error) {
      console.error('Failed to parse stored inventory', error)
    }

    return null
  }

  private persistUserInventory(userId: string, inventory: UserInventory) {
    if (!this.isBrowser()) return
    window.localStorage.setItem(this.getInventoryStorageKey(userId), JSON.stringify(inventory))
  }

  private getSchoolName(schoolId?: string) {
    if (!schoolId) return undefined
    const school = (mockUsersData.schools || []).find(s => s.id === schoolId)
    return school?.name
  }

  private getLeaderboardRecords(): LeaderboardRecord[] {
    if (!this.isBrowser()) return []

    const stored = window.localStorage.getItem(this.leaderboardStorageKey)
    if (!stored) {
      return this.seedLeaderboardRecords()
    }

    try {
      const parsed = JSON.parse(stored) as LeaderboardRecord[]
      if (!Array.isArray(parsed)) {
        return this.seedLeaderboardRecords()
      }
      return parsed
    } catch (error) {
      console.error('Failed to parse leaderboard records', error)
      return this.seedLeaderboardRecords()
    }
  }

  private persistLeaderboardRecords(records: LeaderboardRecord[]) {
    if (!this.isBrowser()) return
    window.localStorage.setItem(this.leaderboardStorageKey, JSON.stringify(records))
    window.dispatchEvent(new CustomEvent(this.leaderboardEventName))
  }

  private seedLeaderboardRecords(): LeaderboardRecord[] {
    const records: LeaderboardRecord[] = (mockUsersData.users || [])
      .filter(user => user.profile.role === 'student')
      .map(user => {
        const inventory = this.getUserInventory(user.id)
        const pet = this.getUserPet(user.id)
        const petStage = pet?.growth_stage ? (pet.growth_stage as PetGrowthStage) : 'baby'
        return {
          user_id: user.id,
          username: user.profile.username,
          school_id: user.profile.school_id,
          school_name: this.getSchoolName(user.profile.school_id),
          points: user.profile.points,
          coins: inventory?.coins ?? 0,
          badges_count: user.profile.badges.length,
          pet_stage: petStage,
          updated_at: new Date().toISOString()
        }
      })

    this.persistLeaderboardRecords(records)
    return records
  }

  private upsertLeaderboardRecord(record: LeaderboardRecord) {
    const records = this.getLeaderboardRecords()
    const index = records.findIndex(entry => entry.user_id === record.user_id)
    if (index >= 0) {
      records[index] = {
        ...records[index],
        ...record,
        updated_at: new Date().toISOString()
      }
    } else {
      records.push({
        ...record,
        updated_at: new Date().toISOString()
      })
    }

    this.persistLeaderboardRecords(records)
  }

  private updateLeaderboardEntry(user: User, inventory?: UserInventory) {
    if (!this.isBrowser()) return

    const pet = this.getUserPet(user.id)
    const inventoryData = inventory ?? this.getUserInventory(user.id)

    const petStage = pet?.growth_stage ? (pet.growth_stage as PetGrowthStage) : 'baby'

    const record: LeaderboardRecord = {
      user_id: user.id,
      username: user.username,
      school_id: user.school_id,
      school_name: this.getSchoolName(user.school_id),
      points: user.points,
      coins: inventoryData?.coins ?? 0,
      badges_count: user.badges.length,
      pet_stage: petStage,
      updated_at: new Date().toISOString()
    }

    this.upsertLeaderboardRecord(record)
  }

  consumeInventoryItem(params: {
    userId: string
    item: { id: string; price: number; type?: string; rarity?: string; [key: string]: unknown }
  }): UserInventory | null {
    const inventory = this.getUserInventory(params.userId)
    if (!inventory) return null

    if (inventory.coins < params.item.price) {
      return null
    }

    const updatedCoins = inventory.coins - params.item.price
    const timestamp = new Date().toISOString()

    let updatedInventory: UserInventory = {
      ...inventory,
      coins: updatedCoins,
      updated_at: timestamp
    }

    if ('rarity' in params.item) {
      const existingIndex = updatedInventory.food_items.findIndex(food => food.item_id === params.item.id)

      if (existingIndex >= 0) {
        const updatedFoodItems = [...updatedInventory.food_items]
        const existing = updatedFoodItems[existingIndex]
        updatedFoodItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1,
          purchased_at: timestamp
        }
        updatedInventory = {
          ...updatedInventory,
          food_items: updatedFoodItems
        }
      } else {
        updatedInventory = {
          ...updatedInventory,
          food_items: [
            ...updatedInventory.food_items,
            {
              item_id: params.item.id,
              quantity: 1,
              purchased_at: timestamp
            }
          ]
        }
      }
    } else {
      const accessItem: InventoryAccessory = {
        accessory_id: params.item.id,
        equipped: false,
        purchased_at: timestamp
      }
      updatedInventory = {
        ...updatedInventory,
        accessories: [...updatedInventory.accessories, accessItem]
      }
    }

    this.persistUserInventory(params.userId, updatedInventory)

    const user = this.currentUser && this.currentUser.id === params.userId
      ? this.currentUser
      : null

    if (user) {
      this.updateLeaderboardEntry(user, updatedInventory)
      this.notifyListeners()
    } else {
      const mockUser = mockUsersData.users.find(entry => entry.id === params.userId)
      if (mockUser) {
        const petStage = mockUser.pet?.growth_stage ? (mockUser.pet.growth_stage as PetGrowthStage) : 'baby'

        this.upsertLeaderboardRecord({
          user_id: mockUser.id,
          username: mockUser.profile.username,
          school_id: mockUser.profile.school_id,
          school_name: this.getSchoolName(mockUser.profile.school_id),
          points: mockUser.profile.points,
          coins: updatedInventory.coins,
          badges_count: mockUser.profile.badges.length,
          pet_stage: petStage,
          updated_at: new Date().toISOString()
        })
      }
    }

    return updatedInventory
  }

  private normalizeCompletion(raw: unknown): ExtendedQuestCompletion {
    const completion = (raw ?? {}) as Partial<ExtendedQuestCompletion> & {
      reward_coins?: number
      is_perfect?: boolean
      quest_type?: Quest['type']
    }

    const submission = completion.submission as QuizSubmission | undefined
    const resolvedScore = typeof completion.score === 'number'
      ? completion.score
      : typeof submission?.score === 'number'
        ? submission.score
        : 0

    return {
      id: typeof completion.id === 'string' ? completion.id : `legacy-${Date.now()}`,
      user_id: typeof completion.user_id === 'string' ? completion.user_id : '',
      quest_id: typeof completion.quest_id === 'string' ? completion.quest_id : '',
      submission: submission ?? { answers: [], time_taken: 0, score: resolvedScore },
      status: completion.status ?? 'completed',
      score: resolvedScore,
      feedback: completion.feedback,
      completed_at: completion.completed_at ?? new Date().toISOString(),
      reviewed_by: completion.reviewed_by,
      reviewed_at: completion.reviewed_at,
      quest_title: typeof completion.quest_title === 'string' ? completion.quest_title : 'Quest',
      quest_type: completion.quest_type ?? 'quiz',
      reward_points: typeof completion.reward_points === 'number' ? completion.reward_points : 0,
      reward_coins: typeof completion.reward_coins === 'number' ? completion.reward_coins : 0,
      is_perfect: typeof completion.is_perfect === 'boolean' ? completion.is_perfect : resolvedScore === 100,
    }
  }

  static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService()
    }
    return MockAuthService.instance
  }

  // Subscribe to authentication state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  // Notify all listeners of auth state change
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser))
  }

  // Login with mock credentials
  async login(id: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Find user by credentials
      const mockUser = mockUsersData.users.find(
        user => user.credentials.id === id && user.credentials.password === password
      )

      if (!mockUser) {
        return { success: false, error: 'Invalid credentials' }
      }

      // Create user object
      this.currentUser = {
        id: mockUser.id,
        email: mockUser.profile.email,
        username: mockUser.profile.username,
        role: mockUser.profile.role as User['role'],
        school_id: mockUser.profile.school_id,
        points: mockUser.profile.points,
        badges: mockUser.profile.badges.map(badgeId => ({
          id: badgeId,
          name: badgeId,
          description: '',
          type: 'eco-warrior' as BadgeType,
          icon: '',
          requirements: []
        })),
        avatar: mockUser.profile.avatar,
        created_at: mockUser.profile.created_at,
        updated_at: new Date().toISOString()
      }

      // Store in localStorage for persistence
      localStorage.setItem('prakriti_user', JSON.stringify(this.currentUser))
      
      this.notifyListeners()
      return { success: true, user: this.currentUser }

    } catch {
      return { success: false, error: 'Login failed' }
    }
  }

  // Logout
  async logout(): Promise<void> {
    this.currentUser = null
    localStorage.removeItem('prakriti_user')
    localStorage.removeItem('prakriti_game_state')
    this.notifyListeners()
  }

  // Get current user
  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser
    }

    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('prakriti_user')
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored)
          return this.currentUser
        } catch {
          localStorage.removeItem('prakriti_user')
        }
      }
    }

    return null
  }

  // Get user's pet
  getUserPet(userId: string) {
    const mockUser = mockUsersData.users.find(user => user.id === userId)
    return mockUser?.pet || null
  }

  // Get user's inventory
  getUserInventory(userId: string) {
    const storedInventory = this.readStoredInventory(userId)
    if (storedInventory) {
      return storedInventory
    }

    const mockUser = mockUsersData.users.find(user => user.id === userId)
    if (!mockUser?.inventory) return null

    const baseInventory: UserInventory = {
      id: `inventory-${userId}`,
      user_id: userId,
      coins: mockUser.inventory.coins,
      food_items: mockUser.inventory.food_items.map(item => ({
        ...item,
        purchased_at: new Date().toISOString()
      })),
      accessories: mockUser.inventory.accessories.map(acc => ({
        accessory_id: acc.accessory_id,
        equipped: acc.equipped,
        purchased_at: acc.purchased_at
      })),
      updated_at: new Date().toISOString()
    }

    return baseInventory
  }

  // Get complete game state for user
  getGameState(userId: string): GameState | null {
    const user = this.getCurrentUser()
    if (!user || user.id !== userId) return null

    const pet = this.getUserPet(userId)
    const inventory = this.getUserInventory(userId)

    if (!pet || !inventory) return null

    const completedQuests = this.getUserQuestHistory(userId)

    return {
      user,
      pet: {
        id: pet.id,
        user_id: userId,
        name: pet.name,
        species: pet.species as PetSpecies,
        growth_stage: pet.growth_stage as PetGrowthStage,
        health: pet.health,
        happiness: pet.happiness,
        hunger: pet.hunger,
        accessories: pet.accessories.map(acc => ({
          id: acc,
          name: acc,
          type: 'toy' as const,
          image_url: '',
          price: 0,
          unlocked_at_stage: 'baby' as PetGrowthStage
        })),
        last_fed: pet.last_fed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      inventory,
      active_quests: [], // TODO: Load from quests data
      completed_quests: completedQuests,
      leaderboard_rank: 1,
      daily_login_streak: 1
    }
  }

  private getUserQuestHistory(userId: string): ExtendedQuestCompletion[] {
    if (!this.isBrowser()) return []

    const key = `prakriti_completed_quests_${userId}`
    const stored = window.localStorage.getItem(key)
    if (!stored) return []

    try {
      const parsed = JSON.parse(stored) as unknown[]
      if (!Array.isArray(parsed)) return []
      return parsed.map(item => this.normalizeCompletion(item))
    } catch (error) {
      console.error('Failed to parse quest history', error)
      return []
    }
  }

  private getGlobalQuestHistory(): QuestHistoryItem[] {
    if (!this.isBrowser()) return []

    const stored = window.localStorage.getItem('prakriti_quest_history')
    if (!stored) return []

    try {
      const parsed = JSON.parse(stored) as unknown[]
      if (!Array.isArray(parsed)) return []
      return parsed.map(item => {
        const entry = (item ?? {}) as Partial<QuestHistoryItem>
        const completion = this.normalizeCompletion(entry)
        return {
          ...completion,
          username: typeof entry.username === 'string' ? entry.username : 'Explorer'
        }
      })
    } catch (error) {
      console.error('Failed to parse global quest history', error)
      return []
    }
  }

  private persistUserQuestHistory(userId: string, history: ExtendedQuestCompletion[]) {
    if (!this.isBrowser()) return
    const key = `prakriti_completed_quests_${userId}`
    window.localStorage.setItem(key, JSON.stringify(history))
  }

  private persistGlobalQuestHistory(history: QuestHistoryItem[]) {
    if (!this.isBrowser()) return
    window.localStorage.setItem('prakriti_quest_history', JSON.stringify(history))
  }

  private updateCurrentUser(user: User) {
    this.currentUser = user
    if (this.isBrowser()) {
      window.localStorage.setItem('prakriti_user', JSON.stringify(user))
    }
    this.updateLeaderboardEntry(user)
    this.notifyListeners()
  }

  recordQuestCompletion(params: {
    user: User
    quest: Quest
    submission: QuizSubmission
  }): { completion: ExtendedQuestCompletion; updatedUser: User } | null {
    if (!this.isBrowser()) return null

    const questContent = params.quest.content as QuizQuest
    const passingScore = typeof questContent?.passing_score === 'number' ? questContent.passing_score : 0

    const isPerfect = params.submission.score === 100
    const awardedPoints = isPerfect ? params.quest.reward_points : 0
    const awardedCoins = isPerfect ? params.quest.reward_coins : 0

    const completion: ExtendedQuestCompletion = {
      id: `completion-${params.quest.id}-${Date.now()}`,
      user_id: params.user.id,
      quest_id: params.quest.id,
      submission: params.submission,
      status: 'completed',
      score: params.submission.score,
      feedback: params.submission.score >= passingScore
        ? 'Fantastic work!'
        : 'Keep exploring and try again!',
      completed_at: new Date().toISOString(),
      quest_title: params.quest.title,
      quest_type: params.quest.type,
      reward_points: awardedPoints,
      reward_coins: awardedCoins,
      is_perfect: isPerfect
    }

    const userHistory = [...this.getUserQuestHistory(params.user.id), completion]
    this.persistUserQuestHistory(params.user.id, userHistory)

    const globalHistoryEntry: QuestHistoryItem = {
      ...completion,
      username: params.user.username
    }

    const globalHistory = [...this.getGlobalQuestHistory(), globalHistoryEntry]
    this.persistGlobalQuestHistory(globalHistory)

    if (awardedCoins > 0) {
      const inventory = this.getUserInventory(params.user.id)
      if (inventory) {
        const updatedInventory: UserInventory = {
          ...inventory,
          coins: inventory.coins + awardedCoins,
          updated_at: new Date().toISOString()
        }
        this.persistUserInventory(params.user.id, updatedInventory)
      }
    }

    const updatedUser: User = {
      ...params.user,
      points: params.user.points + awardedPoints,
      updated_at: new Date().toISOString()
    }

    this.updateCurrentUser(updatedUser)

    window.dispatchEvent(new CustomEvent(this.questHistoryEventName))

    return { completion, updatedUser }
  }

  getQuestHistorySnapshot() {
    return this.getGlobalQuestHistory()
  }

  getLeaderboardSnapshot(): LeaderboardRecord[] {
    return this.getLeaderboardRecords()
  }

  // Check if user has permission for action
  hasPermission(action: string): boolean {
    const user = this.getCurrentUser()
    if (!user) return false

    switch (action) {
      case 'create_quest':
        return user.role === 'teacher' || user.role === 'school-admin'
      case 'approve_quest':
        return user.role === 'teacher' || user.role === 'school-admin'
      case 'view_admin_dashboard':
        return user.role === 'school-admin'
      case 'view_teacher_dashboard':
        return user.role === 'teacher' || user.role === 'school-admin'
      case 'play_game':
        return user.role === 'student'
      default:
        return false
    }
  }
}

// Mock credentials for easy testing
export const MOCK_CREDENTIALS: MockCredentials[] = [
  { id: 'student1', password: 'eco123', role: 'student', name: 'EcoExplorer', school_id: 'school-001' },
  { id: 'student2', password: 'nature456', role: 'student', name: 'NatureGuard', school_id: 'school-001' },
  { id: 'student3', password: 'earth321', role: 'student', name: 'DragonMaster', school_id: 'school-002' },
  { id: 'teacher1', password: 'teach789', role: 'teacher', name: 'Ms. Green', school_id: 'school-001' },
  { id: 'admin1', password: 'admin999', role: 'school-admin', name: 'Principal Johnson', school_id: 'school-001' }
]

// Get the singleton instance
export const authService = MockAuthService.getInstance()

// Utility functions
export const isAuthenticated = (): boolean => {
  return authService.getCurrentUser() !== null
}

export const requireAuth = (allowedRoles?: string[]) => {
  const user = authService.getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }

  return user
}

export const redirectToRole = (role: string): string => {
  switch (role) {
    case 'student':
      return '/student'
    case 'teacher':
      return '/teacher'
    case 'school-admin':
      return '/admin'
    default:
      return '/'
  }
}
