'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { calculateBreakdowns } from '@/lib/calculate'
import { BreakdownCard } from '@/components/breakdown-card'
import { ParticipantBreakdown } from '@/types/session'

export default function BreakdownPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useSession(id)
  const [myId, setMyId] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(`participant:${id}`)
    if (stored) setMyId(stored)
  }, [id])

  if (!session) return <div className="p-6 text-muted-foreground">Loading…</div>

  const breakdowns = calculateBreakdowns(session)
  const host = session.participants.find(p => p.id === session.hostId) ?? session.participants[0]

  const myBreakdown = breakdowns.find(b => b.participant.id === myId)
  const others = breakdowns.filter(b => b.participant.id !== myId)

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">💰 Final Totals</h1>
        <p className="text-muted-foreground text-sm">
          Tax &amp; tip split proportionally to what you ordered.
        </p>
      </div>

      {/* My card first */}
      {myBreakdown && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">You</p>
          <BreakdownCard
            breakdown={myBreakdown}
            host={host}
            isMe={true}
          />
        </div>
      )}

      {/* Everyone else */}
      {others.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Everyone else</p>
          {others.map(b => (
            <BreakdownCard
              key={b.participant.id}
              breakdown={b}
              host={host}
              isMe={false}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="rounded-xl bg-muted p-4 text-sm space-y-1">
        <div className="flex justify-between font-semibold">
          <span>Receipt total</span>
          <span>${session.receipt.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Split between</span>
          <span>{session.participants.length} people</span>
        </div>
      </div>
    </main>
  )
}
