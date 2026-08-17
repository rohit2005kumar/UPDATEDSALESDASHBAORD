/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import apiClient, { ACCESS_TOKEN_KEY } from '../services/apiClient'

const AuthContext = createContext(null)

export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')
    return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')))
  } catch {
    return null
  }
}

export function isJwtValid(token) {
  const payload = decodeJwt(token)
  return Boolean(payload?.exp && payload.exp * 1000 > Date.now())
}

function userFromToken(token) {
  const payload = decodeJwt(token)
  if (!payload) return null
  const name = payload.name || payload.full_name || payload.email || 'Sales Agent'
  return {
    name,
    email: payload.email || '',
    role: payload.role || 'Sales Executive',
    initials: payload.initials || name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase(),
  }
}

function readToken() {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  if (token && !isJwtValid(token)) sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  return token && isJwtValid(token) ? token : null
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readToken)

  const login = async ({ email, password }) => {
    const response = await apiClient.post('/sales/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    }, { skipAuth: true })
    const accessToken = response.data?.access_token
    if (!isJwtValid(accessToken)) throw new Error('Your sign-in session is invalid or expired')
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    setToken(accessToken)
    return userFromToken(accessToken)
  }

  const logout = () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    setToken(null)
  }

  useEffect(() => {
    window.addEventListener('sales:unauthorized', logout)
    return () => window.removeEventListener('sales:unauthorized', logout)
  }, [])

  const user = useMemo(() => token ? userFromToken(token) : null, [token])
  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(token && isJwtValid(token)), login, logout }),
    [user, token],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is missing')
  return value
}
