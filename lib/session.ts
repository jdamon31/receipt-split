import { redis } from './redis'
import { Session, Receipt, Participant, Claim } from '@/types/session'
import { nanoid } from 'nanoid'

const SESSION_TTL = 60 * 60 * 48 // 48 hours in seconds

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
]

function sessionKey(id: string) {
  return `session:${id}`
}

export async function getSession(id: string): Promise<Session | null> {
  const data = await redis.get<Session>(sessionKey(id))
  return data ?? null
}

export async function setSession(session: Session): Promise<void> {
  await redis.set(sessionKey(session.id), session, { ex: SESSION_TTL })
}

export async function createSession(): Promise<Session> {
  const id = nanoid(10)
  const hostId = nanoid(6)
  const now = Date.now()

  const session: Session = {
    id,
    createdAt: now,
    expiresAt: now + SESSION_TTL * 1000,
    status: 'scanning',
    hostId,
    receipt: {
      items: [],
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0,
    },
    participants: [],
    claims: [],
  }

  await setSession(session)
  return session
}

export function assignColor(index: number): string {
  return COLORS[index % COLORS.length]
}

export function buildParticipant(name: string, index: number): Participant {
  return {
    id: nanoid(6),
    name: name.trim(),
    color: assignColor(index),
    paymentHandles: {},
  }
}

export function applyClaim(
  claims: Claim[],
  itemId: string,
  participantId: string,
  fraction: number
): Claim[] {
  // Remove any existing claim for this participant on this item
  const filtered = claims.filter(
    c => !(c.itemId === itemId && c.participantId === participantId)
  )
  if (fraction > 0) {
    filtered.push({ itemId, participantId, fraction })
  }
  return filtered
}
