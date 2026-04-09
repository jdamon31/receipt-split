'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function JoinPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)

  const join = async () => {
    if (!name.trim()) return
    setJoining(true)
    const res = await fetch(`/api/session/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const { participant } = await res.json()
    localStorage.setItem(`participant:${id}`, participant.id)
    router.push(`/session/${id}/claim`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-5xl">👋</div>
          <h1 className="text-2xl font-bold">Join the Split</h1>
          <p className="text-muted-foreground text-sm">
            Enter your name to join and claim your items.
          </p>
        </div>
        <div className="space-y-2 text-left">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            placeholder="e.g. Alex"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && join()}
            autoFocus
            className="h-12 text-base"
          />
        </div>
        <Button
          size="lg"
          className="w-full h-12 rounded-xl"
          onClick={join}
          disabled={joining || !name.trim()}
        >
          {joining ? 'Joining…' : 'Join →'}
        </Button>
      </div>
    </main>
  )
}
