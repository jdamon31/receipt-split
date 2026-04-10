import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession, buildParticipant } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { name, hostToken } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const session = await getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const participant = buildParticipant(name, session.participants.length)
  session.participants.push(participant)

  // If this is the host joining for the first time, update hostId to their real participant id
  if (hostToken && hostToken === session.hostId) {
    session.hostId = participant.id
  }

  await setSession(session)
  return NextResponse.json({ participant })
}
