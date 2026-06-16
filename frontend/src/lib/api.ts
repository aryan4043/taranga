// frontend/src/lib/api.ts
// Typed API client — replaces all mock/static data in your UI

const TREK_API = ''
const USER_API = ''

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null

async function req(base: string, path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ── Auth ──────────────────────────────────────────────────────
export const auth = {
  register: (body: { username: string; email: string; password: string; full_name: string }) =>
    req(USER_API, '/api/users/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (email: string, password: string) =>
    req(USER_API, '/api/users/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      .then((data) => { if (data?.token) localStorage.setItem('token', data.token); return data }),

  logout: () => localStorage.removeItem('token'),
}

// ── Users ─────────────────────────────────────────────────────
export const users = {
  profile:       (username: string) => req(USER_API, `/api/users/profile/${username}`),
  updateMe:      (body: object)     => req(USER_API, '/api/users/profile/me', { method: 'PATCH', body: JSON.stringify(body) }),
  search:        (q: string, rank?: string) => req(USER_API, `/api/users/search?q=${q}${rank ? `&rank=${rank}` : ''}`),
  follow:        (id: string)       => req(USER_API, `/api/users/${id}/follow`, { method: 'POST' }),
  unfollow:      (id: string)       => req(USER_API, `/api/users/${id}/follow`, { method: 'DELETE' }),
  followers:     (id: string)       => req(USER_API, `/api/users/${id}/followers`),
  following:     (id: string)       => req(USER_API, `/api/users/${id}/following`),
}

// ── Treks ─────────────────────────────────────────────────────
export const treks = {
  explore:    (params?: object) => req(TREK_API, `/api/treks/explore?${new URLSearchParams(params as any)}`),
  my:         ()                => req(TREK_API, '/api/treks/my'),
  get:        (id: string)      => req(TREK_API, `/api/treks/${id}`),
  leaderboard:(type?: string)   => req(TREK_API, `/api/treks/leaderboard?type=${type || 'distance'}`),

  create: (body: object) =>
    req(TREK_API, '/api/treks', { method: 'POST', body: JSON.stringify(body) }),

  complete: (id: string) =>
    req(TREK_API, `/api/treks/${id}/complete`, { method: 'PATCH' }),

  like:   (id: string) => req(TREK_API, `/api/treks/${id}/like`, { method: 'POST' }),
  unlike: (id: string) => req(TREK_API, `/api/treks/${id}/like`, { method: 'DELETE' }),
}

// ── Marketplace ───────────────────────────────────────────────
export const marketplace = {
  list:     (params?: object) => req(USER_API, `/api/marketplace?${new URLSearchParams(params as any)}`),
  create:   (body: object)    => req(USER_API, '/api/marketplace', { method: 'POST', body: JSON.stringify(body) }),
  interest: (id: string, message?: string) =>
    req(USER_API, `/api/marketplace/${id}/interest`, { method: 'POST', body: JSON.stringify({ message }) }),
}
