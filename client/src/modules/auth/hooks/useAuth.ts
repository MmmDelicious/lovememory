/**
 * Auth hooks for managing authentication state
 */
import { useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '../../../store/hooks'
import { authAPI as authService } from '@api/auth'
import type { LoginRequest, RegisterRequest } from '../types'

// Note: These will be connected to the actual store slice later
export const useAuth = () => {
  const dispatch = useAppDispatch()
  const { user, isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth)

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        // dispatch(loginStart())
        const response = await authService.login(credentials)
        // dispatch(loginSuccess(response.user))
        return response
      } catch (error) {
        // dispatch(loginError(error.message))
        throw error
      }
    },
    [dispatch]
  )

  const register = useCallback(
    async (userData: RegisterRequest) => {
      try {
        // dispatch(registerStart())
        const response = await authService.register(userData)
        // dispatch(registerSuccess(response.user))
        return response
      } catch (error) {
        // dispatch(registerError(error.message))
        throw error
      }
    },
    [dispatch]
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
      // dispatch(logout())
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even on error
      // dispatch(logout())
    }
  }, [dispatch])

  const getMe = useCallback(async () => {
    try {
      const user = await authService.getMe()
      // dispatch(setUser(user))
      return user
    } catch (error) {
      // dispatch(clearUser())
      throw error
    }
  }, [dispatch])

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    getMe,
  }
}

export default useAuth
