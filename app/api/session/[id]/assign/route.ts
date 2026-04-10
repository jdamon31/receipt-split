import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession, buildParticipant, applyClaim } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { itemId, participantId, name } = await req.json()

  if (!itemId || (!participantId && !name)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const session = await getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let pid = participantId

  // Create new participant if a name was provided
  if (!pid && name) {
    const existing = session.participants.find(
      p => p.name.toLowerCase() === name.trim().toLowerCase()
    )
    if (existing) {
      pid = existing.id
    } else {
      const participant = buildParticipant(name, session.participants.length)
      session.participants.push(participant)
      pid = participant.id
    }
  }

  session.claims = applyClaim(session.claims, itemId, pid, 1)
  await setSession(session)

  return NextResponse.json({ session })
}
