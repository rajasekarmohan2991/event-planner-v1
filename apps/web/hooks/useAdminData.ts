import { useState, useEffect, useCallback } from 'react'
import { getAdminData } from '@/lib/admin'

export interface UseAdminDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

interface PaginatedData<T> {
  data: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export function useAdminData<T>(url: string): UseAdminDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: responseData, error: fetchError } = await getAdminData<T>(url)
      
      if (fetchError) {
        throw new Error(fetchError)
      }
      
      setData(responseData || null)
    } catch (err) {
      console.error(`Error fetching data from ${url}:`, err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh: fetchData
  }
}

export function usePaginatedAdminData<T>(
  baseUrl: string,
  initialPage: number = 1,
  initialLimit: number = 10
) {
  const [page, setPage] = useState<number>(initialPage)
  const [limit, setLimit] = useState<number>(initialLimit)
  
  const url = `${baseUrl}?page=${page}&limit=${limit}`
  const { data, loading, error, refresh } = useAdminData<PaginatedData<T>>(url)
  
  const handleSetPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage))
  }, [])
  
  const handleSetLimit = useCallback((newLimit: number) => {
    setLimit(Math.max(1, newLimit))
    setPage(1) // Reset to first page when changing limit
  }, [])
  
  return {
    data: data?.data || [],
    loading,
    error,
    refresh,
    page,
    limit,
    setPage: handleSetPage,
    setLimit: handleSetLimit,
    totalPages: data?.totalPages || 0,
    totalItems: data?.total || 0
  }
}
