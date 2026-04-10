'use client'

import { useState } from 'react'
import { ReceiptItem, Participant } from '@/types/session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  sessionId: string
  items: ReceiptItem[]
  participants: Participant[]
  onAssigned: () => void
}

export function UnclaimedItems({ sessionId, items, participants, onAssigned }: Props) {
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [customNames, setCustomNames] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  if (items.length === 0) return null

  const assign = async () => {
    setSaving(true)
    const entries = Object.entries(assignments)
    await Promise.all(entries.map(([itemId, value]) => {
      const isParticipantId = participants.some(p => p.id === value)
      return fetch(`/api/session/${sessionId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isParticipantId
            ? { itemId, participantId: value }
            : { itemId, name: value }
        ),
      })
    }))
    setSaving(false)
    onAssigned()
  }

  const pendingCount = Object.keys(assignments).length

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
          <div key={item.id} className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">{item.name}</span>
              <span className="text-sm font-semibold">${item.price.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              {/* Existing participants */}
              <div className="flex flex-wrap gap-1 flex-1">
                {participants.map(p => (
                  <button
                    key={p.id}
                    className={`text-xs px-2 py-1 rounded-full border font-medium transition-all ${
                      assignments[item.id] === p.id
                        ? 'text-white border-transparent'
                        : 'bg-white border-border text-foreground'
                    }`}
                    style={assignments[item.id] === p.id ? { backgroundColor: p.color, borderColor: p.color } : {}}
                    onClick={() => setAssignments(a => ({ ...a, [item.id]: p.id }))}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            {/* New name input */}
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Or type a name…"
                className="h-8 text-sm"
                value={customNames[item.id] ?? ''}
                onChange={e => {
                  setCustomNames(n => ({ ...n, [item.id]: e.target.value }))
                  if (e.target.value.trim()) {
                    setAssignments(a => ({ ...a, [item.id]: e.target.value.trim() }))
                  } else {
                    setAssignments(a => { const next = { ...a }; delete next[item.id]; return next })
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <Button
          className="w-full"
          onClick={assign}
          disabled={saving}
        >
          {saving ? 'Assigning…' : `Assign ${pendingCount} item${pendingCount !== 1 ? 's' : ''}`}
        </Button>
      )}
    </div>
  )
}
