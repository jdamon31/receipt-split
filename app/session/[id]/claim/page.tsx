'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { ClaimBoard } from '@/components/claim-board'
import { ParticipantBadge } from '@/components/participant-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShareBanner } from '@/components/share-banner'
import { Claim } from '@/types/session'
import { applyClaim } from '@/lib/session'

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useSession(id)
  const router = useRouter()
  const [myId, setMyId] = useState<string>('')
  const [advancing, setAdvancing] = useState(false)
  const [guestDone, setGuestDone] = useState(false)
  const [optimisticClaims, setOptimisticClaims] = useState<Claim[] | null>(null)

  // Host name entry state
  const [hostName, setHostName] = useState('')
  const [joiningAsHost, setJoiningAsHost] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(`participant:${id}`)
    if (stored) setMyId(stored)
  }, [id])

  // Drop optimistic override when server state updates
  useEffect(() => {
    if (session) setOptimisticClaims(null)
  }, [session?.claims])

  const me = session?.participants.find(p => p.id === myId)
  const originalHostToken = typeof window !== 'undefined' ? localStorage.getItem(`host:${id}`) ?? '' : ''
  // Host = stored host token matches either current myId OR original hostId on session
  const isHost = myId === session?.hostId || myId === originalHostToken
  const hasJoined = !!me

  const displayClaims = optimisticClaims ?? session?.claims ?? []

  const claim = (itemId: string, fraction: number) => {
    if (!myId || !session) return
    setOptimisticClaims(prev => applyClaim(prev ?? session.claims, itemId, myId, fraction))
    fetch(`/api/session/${id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, participantId: myId, fraction }),
    })
  }

  const joinAsHost = async () => {
    if (!hostName.trim()) return
    setJoiningAsHost(true)
    const res = await fetch(`/api/session/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: hostName, hostToken: originalHostToken }),
    })
    const { participant } = await res.json()
    localStorage.setItem(`participant:${id}`, participant.id)
    localStorage.setItem(`host:${id}`, participant.id)
    setMyId(participant.id)
    setJoiningAsHost(false)
  }

  const finish = async () => {
    setAdvancing(true)
    await fetch(`/api/session/${id}/advance`, { method: 'POST' })
    router.push(`/session/${id}/breakdown`)
  }

  if (!session) return <div className="p-6 text-muted-foreground">Loading…</div>

  // Host hasn't entered their name yet
  const hostNeedsToJoin = !hasJoined && (myId === originalHostToken || myId === session.hostId)

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

      {/* Host needs to enter their name */}
      {hostNeedsToJoin && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
          <p className="font-medium text-sm">What's your name? Add yourself to start claiming.</p>
          <div className="flex gap-2">
            <Input
              placeholder="Your name"
              value={hostName}
              onChange={e => setHostName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && joinAsHost()}
              autoFocus
              className="h-10"
            />
            <Button onClick={joinAsHost} disabled={joiningAsHost || !hostName.trim()}>
              {joiningAsHost ? '…' : 'Join'}
            </Button>
          </div>
        </div>
      )}

      {/* Claim board */}
      {hasJoined ? (
        <ClaimBoard
          items={session.receipt.items}
          participants={session.participants}
          claims={displayClaims}
          myParticipantId={myId}
          onClaim={claim}
        />
      ) : !hostNeedsToJoin ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">You haven&apos;t joined yet.</p>
          <ShareBanner sessionId={id} />
        </div>
      ) : null}

      {/* Share */}
      {hasJoined && (
        <ShareBanner sessionId={id} />
      )}

      {/* Host footer */}
      {isHost && hasJoined && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t">
          <div className="max-w-md mx-auto">
            <Button
              size="lg"
              className="w-full h-14 rounded-xl text-base"
              onClick={finish}
              disabled={advancing}
            >
              {advancing ? 'Calculating…' : "Everyone's done — see totals →"}
            </Button>
          </div>
        </div>
      )}

      {/* Guest footer */}
      {!isHost && hasJoined && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t">
          <div className="max-w-md mx-auto">
            {guestDone ? (
              <p className="text-center text-sm text-muted-foreground py-3">
                ✅ Waiting for the host to finish…
              </p>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 rounded-xl text-base"
                onClick={() => setGuestDone(true)}
              >
                I'm done claiming ✓
              </Button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
