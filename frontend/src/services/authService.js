import { apiRequest } from './api'

export const register = (formData) => apiRequest('/users/register', {
  method: 'POST',
  body: JSON.stringify(formData),
})

export const login = (formData) => apiRequest('/users/login', {
  method: 'POST',
  body: JSON.stringify(formData),
})

export const getProfile = () => apiRequest('/users/profile', { auth: true })
