'use client'

import { useState } from 'react'
import { ReceiptItem, Participant, Claim } from '@/types/session'
import { ParticipantBadge } from './participant-badge'

interface Props {
  items: ReceiptItem[]
  participants: Participant[]
  claims: Claim[]
  myParticipantId: string
  onClaim: (itemId: string, fraction: number) => void
}

export function ClaimBoard({ items, participants, claims, myParticipantId, onClaim }: Props) {
  const [splitting, setSplitting] = useState<string | null>(null)

  const getClaimsForItem = (itemId: string) =>
    claims.filter(c => c.itemId === itemId)

  const myClaimForItem = (itemId: string) =>
    claims.find(c => c.itemId === itemId && c.participantId === myParticipantId)

  const totalClaimedFraction = (itemId: string) =>
    claims.filter(c => c.itemId === itemId).reduce((s, c) => s + c.fraction, 0)

  const claimerColors = (itemId: string) => {
    const itemClaims = getClaimsForItem(itemId)
    return itemClaims.map(c => {
      const p = participants.find(p => p.id === c.participantId)
      return p ? { color: p.color, fraction: c.fraction, name: p.name } : null
    }).filter(Boolean)
  }

  const handleTap = (itemId: string) => {
    const existing = myClaimForItem(itemId)
    if (existing) {
      // Unclaim
      onClaim(itemId, 0)
    } else {
      const remaining = 1 - totalClaimedFraction(itemId)
      if (remaining > 0) {
        onClaim(itemId, remaining)
      }
    }
  }

  const handleSplit = (itemId: string, parts: number) => {
    onClaim(itemId, 1 / parts)
    setSplitting(null)
  }

  return (
    <div className="space-y-3">
      {items.map(item => {
        const myClaim = myClaimForItem(item.id)
        const colors = claimerColors(item.id)
        const isClaimed = !!myClaim
        const totalClaimed = totalClaimedFraction(item.id)

        return (
          <div
            key={item.id}
            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all select-none
              ${isClaimed
                ? 'border-transparent shadow-md'
                : totalClaimed >= 0.99
                  ? 'border-muted bg-muted/40 opacity-60'
                  : 'border-border hover:border-primary/40 hover:shadow-sm'
              }`}
            style={isClaimed ? { borderColor: participants.find(p => p.id === myParticipantId)?.color } : {}}
            onClick={() => splitting !== item.id && handleTap(item.id)}
          >
            {/* Colored fraction bar */}
            {colors.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden flex">
                {colors.map((c, i) => (
                  <div
                    key={i}
                    className="h-full"
                    style={{ width: `${(c!.fraction) * 100}%`, backgroundColor: c!.color }}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                {item.quantity > 1 && (
                  <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                )}
              </div>
              <span className="font-semibold tabular-nums">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>

            {/* Who claimed */}
            {colors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {colors.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: c!.color }}
                  >
                    {c!.name}{c!.fraction < 0.99 ? ` (${Math.round(c!.fraction * 100)}%)` : ''}
                  </span>
                ))}
              </div>
            )}

            {/* Split button */}
            {splitting === item.id ? (
              <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                <p className="text-xs text-muted-foreground mr-1 self-center">Split:</p>
                {[2, 3, 4].map(n => (
                  <button
                    key={n}
                    className="text-xs px-3 py-1 rounded-lg bg-primary text-primary-foreground font-medium"
                    onClick={() => handleSplit(item.id, n)}
                  >
                    {n} ways
                  </button>
                ))}
                <button
                  className="text-xs px-3 py-1 rounded-lg border"
                  onClick={() => setSplitting(null)}
                >
                  Cancel
                </button>
              </div>
            ) : totalClaimed < 0.99 && !isClaimed ? (
              <button
                className="mt-2 text-xs text-muted-foreground underline underline-offset-2"
                onClick={e => { e.stopPropagation(); setSplitting(item.id) }}
              >
                Split item
              </button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
