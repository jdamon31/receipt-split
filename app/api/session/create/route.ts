import { NextResponse } from 'next/server'
import { createSession } from '@/lib/session'

export async function POST() {
  const session = await createSession()
  return NextResponse.json({ id: session.id, hostId: session.hostId })
}
