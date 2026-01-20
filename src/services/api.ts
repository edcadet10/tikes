const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

let authToken: string | null = localStorage.getItem('tikes_token')

export function setAuthToken(token: string | null) {
  authToken = token
  if (token) {
    localStorage.setItem('tikes_token', token)
  } else {
    localStorage.removeItem('tikes_token')
  }
}

export function getAuthToken() {
  return authToken
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// Auth endpoints
export async function register(businessName: string, ownerName: string, phone: string, pin: string) {
  const data = await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ businessName, ownerName, phone, pin }),
  })
  setAuthToken(data.token)
  return data
}

export async function login(businessId: number, pin: string) {
  const data = await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ businessId, pin }),
  })
  setAuthToken(data.token)
  return data
}

export async function verifyToken() {
  return fetchAPI('/auth/verify')
}

// Sync endpoints
export async function pushSync(data: {
  products?: any[]
  customers?: any[]
  sales?: any[]
  categories?: any[]
  creditTransactions?: any[]
}) {
  return fetchAPI('/sync/push', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function pullSync(since?: string) {
  const query = since ? `?since=${encodeURIComponent(since)}` : ''
  return fetchAPI(`/sync/pull${query}`)
}

// Business endpoints
export async function getBusiness() {
  return fetchAPI('/business')
}

export async function updateBusiness(data: { name?: string; phone?: string; address?: string }) {
  return fetchAPI('/business', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
