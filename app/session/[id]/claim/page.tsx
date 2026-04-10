'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { ClaimBoard } from '@/components/claim-board'
import { ParticipantBadge } from '@/components/participant-badge'
import { Button } from '@/components/ui/button'
import { ShareBanner } from '@/components/share-banner'

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useSession(id)
  const router = useRouter()
  const [myId, setMyId] = useState<string>('')
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(`participant:${id}`)
    if (stored) setMyId(stored)
  }, [id])

  const me = session?.participants.find(p => p.id === myId)
  const isHost = localStorage.getItem(`host:${id}`) === myId

  const claim = async (itemId: string, fraction: number) => {
    if (!myId) return
    await fetch(`/api/session/${id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, participantId: myId, fraction }),
    })
  }

  const finish = async () => {
    setAdvancing(true)
    await fetch(`/api/session/${id}/advance`, { method: 'POST' })
    router.push(`/session/${id}/breakdown`)
  }

  if (!session) return <div className="p-6 text-muted-foreground">Loading…</div>

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto space-y-6 pb-32">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Claim Your Items</h1>
        <p className="text-muted-foreground text-sm">Tap items you ordered.</p>
      </div>

      {/* Who's here */}
      <div className="flex flex-wrap gap-2">
        {session.participants.map(p => (
          <ParticipantBadge key={p.id} participant={p} size={p.id === myId ? 'md' : 'sm'} />
        ))}
        {session.participants.length === 0 && (
          <p className="text-sm text-muted-foreground">Waiting for people to join…</p>
        )}
      </div>

      {myId && me ? (
        <ClaimBoard
          items={session.receipt.items}
          participants={session.participants}
          claims={session.claims}
          myParticipantId={myId}
          onClaim={claim}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">You haven&apos;t joined yet.</p>
          <ShareBanner sessionId={id} />
        </div>
      )}

      {isHost && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t">
          <div className="max-w-md mx-auto">
            <Button
              size="lg"
              className="w-full h-14 rounded-xl text-base"
              onClick={finish}
              disabled={advancing}
            >
              {advancing ? 'Calculating…' : 'Everyone\'s done — see totals →'}
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
