
import { TOKEN_KEY } from './authConfig'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const API_BASE_URL = (
  configuredApiUrl || 'https://findit-backend-momd.onrender.com/api'
).replace(/\/+$/, '')

export const apiRequest = async (path, { auth = false, ...options } = {}) => {
  const headers = new Headers(options.headers)
  const token = localStorage.getItem(TOKEN_KEY)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    if (!token) {
      throw new Error('Please log in to continue.')
    }

    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  let result

  try {
    result = await response.json()
  } catch {
    throw new Error(`The server returned an invalid response (${response.status}).`)
  }

  if (
    auth &&
    (
      response.status === 401 ||
      (path === '/users/profile' && response.status === 404)
    )
  ) {
    window.dispatchEvent(new Event('findit:unauthorized'))
  }

  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status}).`)
  }

  return result
}
