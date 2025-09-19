'use client'

import { useState } from 'react'
import { authService, MOCK_CREDENTIALS } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { User, Leaf, Shield } from 'lucide-react'

interface LoginFormProps {
  onLogin?: (user: any) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [credentials, setCredentials] = useState({ id: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCredentials, setShowCredentials] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await authService.login(credentials.id, credentials.password)
      
      if (result.success && result.user) {
        // Redirect based on user role
        const redirectPath = getRedirectPath(result.user.role)
        router.push(redirectPath)
        onLogin?.(result.user)
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <User className="h-4 w-4 text-green-600" />
      case 'teacher':
        return <Leaf className="h-4 w-4 text-blue-600" />
      case 'school-admin':
        return <Shield className="h-4 w-4 text-purple-600" />
      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #34d399, #3b82f6)' }}>
      {/* Subtle eco motif */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Leaf className="absolute top-10 left-8 h-10 w-10" style={{ color: '#10b981', opacity: 0.15 }} />
        <Leaf className="absolute bottom-16 right-10 h-8 w-8" style={{ color: '#10b981', opacity: 0.15 }} />
        <Leaf className="absolute top-1/2 left-1/4 h-12 w-12" style={{ color: '#22c55e', opacity: 0.12 }} />
      </div>

      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="mx-auto h-[60px] w-[60px] rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
            <Leaf className="h-7 w-7" style={{ color: '#ffffff' }} />
          </div>
          <h2 className="mt-4 font-heading text-[28px] font-semibold" style={{ color: '#1e293b' }}>
            Prakriti Odyssey
          </h2>
          <p className="mt-1 font-body text-[16px]" style={{ color: '#475569', letterSpacing: '0.3px' }}>
            Your environmental adventure awaits!
          </p>
        </div>

        {/* Card */}
        <div className="card-pixel p-6" style={{ borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="id" className="sr-only">User ID</label>
              <input
                id="id"
                name="id"
                type="text"
                required
                className="block w-full px-4 h-12 rounded-[12px] border focus:outline-none"
                placeholder="User ID"
                value={credentials.id}
                onChange={(e) => setCredentials(prev => ({ ...prev, id: e.target.value }))}
                style={{ borderColor: '#cbd5e1', color: '#1e293b' }}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full px-4 h-12 rounded-[12px] border focus:outline-none"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                style={{ borderColor: '#cbd5e1', color: '#1e293b' }}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-[12px]" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-pixel font-heading text-[16px]"
                style={{ background: '#22c55e', color: '#ffffff', borderColor: '#22c55e', borderRadius: '12px' }}
                onMouseOver={(e) => ((e.currentTarget.style.background = '#16a34a'))}
                onMouseOut={(e) => ((e.currentTarget.style.background = '#22c55e'))}
              >
                {isLoading ? 'Signing in...' : 'Sign in to Adventure'}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="w-full text-center underline"
              style={{ color: '#0ea5e9' }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#0369a1')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#0ea5e9')}
            >
              {showCredentials ? 'Hide' : 'Show'} Demo Credentials
            </button>

            {showCredentials && (
              <div className="mt-3 space-y-3">
                <h3 className="text-sm font-semibold" style={{ color: '#1e293b' }}>Demo Users:</h3>
                {MOCK_CREDENTIALS.map((cred) => (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between p-3 rounded-[12px] cursor-pointer"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                    onClick={() => setCredentials({ id: cred.id, password: cred.password })}
                  >
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(cred.role)}
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#1e293b' }}>{cred.name}</p>
                        <p className="text-xs capitalize" style={{ color: '#475569' }}>{cred.role}</p>
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: '#64748b' }}>
                      {cred.id} / {cred.password}
                    </div>
                  </div>
                ))}
                <p className="text-xs" style={{ color: '#64748b' }}>
                  Click any user above to auto-fill credentials
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
