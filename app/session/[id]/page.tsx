'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/hooks/use-session'

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useSession(id)
  const router = useRouter()

  useEffect(() => {
    if (!session) return
    switch (session.status) {
      case 'scanning':   return void router.replace(`/session/${id}/scan`)
      case 'reviewing':  return void router.replace(`/session/${id}/review`)
      case 'claiming':   return void router.replace(`/session/${id}/claim`)
      case 'settled':    return void router.replace(`/session/${id}/breakdown`)
    }
  }, [session?.status, id, router])

  return <div className="p-6 text-muted-foreground">Loading session…</div>
}
