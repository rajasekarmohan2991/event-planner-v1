import { User, UserRole } from '@/types/user'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface GetUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: UserRole
}

export interface GetUsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
  const { page = 1, limit = 10, search, role } = params
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(role && { role }),
  })

  const response = await fetch(`${API_URL}/admin/users?${queryParams}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  return response.json()
}

export async function getUserById(id: string): Promise<User> {
  const response = await fetch(`${API_URL}/admin/users/${id}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user')
  }

  return response.json()
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const response = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update user')
  }

  return response.json()
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to delete user')
  }
}

export async function inviteUser(email: string, role: UserRole): Promise<void> {
  const response = await fetch(`${API_URL}/admin/users/invite`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, role }),
  })

  if (!response.ok) {
    throw new Error('Failed to invite user')
  }
}
