'use client'

import useSWR from 'swr'
import { Session } from '@/types/session'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useSession(id: string) {
  const { data, error, mutate } = useSWR<Session>(
    id ? `/api/session/${id}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  return {
    session: data,
    loading: !data && !error,
    error,
    refresh: mutate,
  }
}
