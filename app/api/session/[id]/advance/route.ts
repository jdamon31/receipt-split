import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/session'
import { Session } from '@/types/session'

const STATUS_ORDER: Session['status'][] = ['scanning', 'reviewing', 'claiming', 'settled']

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const current = STATUS_ORDER.indexOf(session.status)
  if (current < STATUS_ORDER.length - 1) {
    session.status = STATUS_ORDER[current + 1]
    await setSession(session)
  }

  return NextResponse.json({ status: session.status })
}
