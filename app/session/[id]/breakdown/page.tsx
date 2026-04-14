'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { calculateBreakdowns, getUnclaimedItems } from '@/lib/calculate'
import { BreakdownCard } from '@/components/breakdown-card'
import { UnclaimedItems } from '@/components/unclaimed-items'
import { ReceiptItem } from '@/types/session'

function GuestClaimableItems({
  items,
  sessionId,
  myId,
  onClaimed,
}: {
  items: ReceiptItem[]
  sessionId: string
  myId: string
  onClaimed: () => void
}) {
  const [claiming, setClaiming] = useState<string | null>(null)

  const claim = async (itemId: string) => {
    setClaiming(itemId)
    await fetch(`/api/session/${sessionId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, participantId: myId, fraction: 1 }),
    })
    setClaiming(null)
    onClaimed()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Unclaimed Items
        </p>
        <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 font-medium">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="rounded-xl border border-orange-200 bg-orange-50 divide-y divide-orange-100">
        {items.map(item => (
          <div key={item.id} className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                ${(item.price * item.quantity).toFixed(2)}
                {item.quantity > 1 && ` (${item.quantity}×$${item.price.toFixed(2)})`}
              </p>
            </div>
            <button
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
              disabled={claiming === item.id}
              onClick={() => claim(item.id)}
            >
              {claiming === item.id ? '…' : 'That\'s mine'}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Tap items you ordered. Your total will update automatically.
      </p>
    </div>
  )
}

export default function BreakdownPage() {
  const { id } = useParams<{ id: string }>()
  const { session, refresh } = useSession(id)
  const [myId, setMyId] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem(`participant:${id}`)
    if (stored) setMyId(stored)
  }, [id])

  if (!session) return <div className="p-6 text-muted-foreground">Loading…</div>

  const isHost = myId === session.hostId
  const breakdowns = calculateBreakdowns(session)
  const unclaimed = getUnclaimedItems(session)
  const host = session.participants.find(p => p.id === session.hostId) ?? session.participants[0]
  const myBreakdown = breakdowns.find(b => b.participant.id === myId)
  const others = breakdowns.filter(b => b.participant.id !== myId)

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto space-y-6 pb-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Final Totals</h1>
        <p className="text-muted-foreground text-sm">
          Tax &amp; tip split proportionally to what you ordered.
        </p>
      </div>

      {/* Unclaimed items */}
      {unclaimed.length > 0 && isHost && (
        <UnclaimedItems
          sessionId={id}
          items={unclaimed}
          participants={session.participants}
          onAssigned={refresh}
        />
      )}
      {unclaimed.length > 0 && !isHost && myId && (
        <GuestClaimableItems
          items={unclaimed}
          sessionId={id}
          myId={myId}
          onClaimed={refresh}
        />
      )}

      {/* My card first */}
      {myBreakdown && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">You</p>
          <BreakdownCard breakdown={myBreakdown} host={host} isMe={true} showItems={true} />
        </div>
      )}

      {/* Everyone else */}
      {others.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Everyone else</p>
          {others.map(b => (
            <BreakdownCard key={b.participant.id} breakdown={b} host={host} isMe={false} showItems={false} />
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
