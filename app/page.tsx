'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const start = async () => {
    setLoading(true)
    const res = await fetch('/api/session/create', { method: 'POST' })
    const { id, hostId } = await res.json()
    localStorage.setItem(`host:${id}`, hostId)
    localStorage.setItem(`participant:${id}`, hostId)
    router.push(`/session/${id}/scan`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted">
      <div className="max-w-sm w-full space-y-8 text-center">
        <div className="space-y-3">
          <div className="text-6xl">🧾</div>
          <h1 className="text-4xl font-bold tracking-tight">Receipt Split</h1>
          <p className="text-muted-foreground text-lg">
            Scan a receipt, claim your items, pay instantly.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full text-base h-14 rounded-xl"
            onClick={start}
            disabled={loading}
          >
            {loading ? 'Starting…' : '📸 Start Splitting'}
          </Button>
          <p className="text-xs text-muted-foreground">
            No account required · Share a link · Done in minutes
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center pt-4">
          {[
            { icon: '📸', label: 'Scan receipt' },
            { icon: '👆', label: 'Claim items' },
            { icon: '💸', label: 'Pay instantly' },
          ].map(({ icon, label }) => (
            <div key={label} className="space-y-1">
              <div className="text-2xl">{icon}</div>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
