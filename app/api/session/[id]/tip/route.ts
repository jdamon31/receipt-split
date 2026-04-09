import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/session'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { tip, tax } = await req.json()

  const session = await getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (typeof tip === 'number') session.receipt.tip = tip
  if (typeof tax === 'number') session.receipt.tax = tax
  session.receipt.total =
    session.receipt.subtotal + session.receipt.tax + session.receipt.tip

  await setSession(session)
  return NextResponse.json({ receipt: session.receipt })
}
