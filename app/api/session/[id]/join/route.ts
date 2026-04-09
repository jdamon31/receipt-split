import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession, buildParticipant } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { name } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const session = await getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const participant = buildParticipant(name, session.participants.length)
  session.participants.push(participant)
  await setSession(session)

  return NextResponse.json({ participant })
}
