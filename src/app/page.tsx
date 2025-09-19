'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/lib/auth'
import { User } from '@/types'
import LoginForm from '@/components/auth/LoginForm'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)

    // If user is authenticated, redirect to appropriate dashboard
    if (currentUser) {
      const redirectPath = getRedirectPath(currentUser.role)
      router.push(redirectPath)
    }

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user)
      if (user) {
        const redirectPath = getRedirectPath(user.role)
        router.push(redirectPath)
      }
    })

    return unsubscribe
  }, [router])

  const getRedirectPath = (role: string): string => {
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

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  // If user is not authenticated, show login form
  if (!user) {
    return <LoginForm />
  }

  // This shouldn't be reached due to redirect, but just in case
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-2xl font-bold">Redirecting...</h1>
        <p>Welcome back, {user.username}!</p>
      </div>
    </div>
  )
}
