import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession, applyClaim } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { itemId, participantId, fraction } = await req.json()

  if (!itemId || !participantId || fraction === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const session = await getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  session.claims = applyClaim(session.claims, itemId, participantId, fraction)
  await setSession(session)

  return NextResponse.json({ claims: session.claims })
}
