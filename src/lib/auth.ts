'use client'

import { User, MockCredentials, GameState } from '@/types'
import mockUsersData from '@/data/mock-users.json'

// Mock authentication service
export class MockAuthService {
  private static instance: MockAuthService
  private currentUser: User | null = null
  private listeners: Array<(user: User | null) => void> = []

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
        role: mockUser.profile.role as any,
        school_id: mockUser.profile.school_id,
        points: mockUser.profile.points,
        badges: mockUser.profile.badges.map(badgeId => ({
          id: badgeId,
          name: badgeId,
          description: '',
          type: 'eco-warrior' as any,
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

    } catch (error) {
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
        } catch (error) {
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
    const mockUser = mockUsersData.users.find(user => user.id === userId)
    if (!mockUser?.inventory) return null

    return {
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
  }

  // Get complete game state for user
  getGameState(userId: string): GameState | null {
    const user = this.getCurrentUser()
    if (!user || user.id !== userId) return null

    const pet = this.getUserPet(userId)
    const inventory = this.getUserInventory(userId)

    if (!pet || !inventory) return null

    return {
      user,
      pet: {
        id: pet.id,
        user_id: userId,
        name: pet.name,
        species: pet.species as any,
        growth_stage: pet.growth_stage as any,
        health: pet.health,
        happiness: pet.happiness,
        hunger: pet.hunger,
        accessories: pet.accessories.map(acc => ({
          id: acc,
          name: acc,
          type: 'toy' as any,
          image_url: '',
          price: 0,
          unlocked_at_stage: 'baby' as any
        })),
        last_fed: pet.last_fed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      inventory,
      active_quests: [], // TODO: Load from quests data
      completed_quests: [],
      leaderboard_rank: 1,
      daily_login_streak: 1
    }
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