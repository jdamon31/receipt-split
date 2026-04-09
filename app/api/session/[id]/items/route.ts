import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/session'
import { ReceiptItem } from '@/types/session'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { items } = await req.json() as { items: ReceiptItem[] }

  const session = await getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  session.receipt.items = items
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  session.receipt.subtotal = subtotal
  session.receipt.total = subtotal + session.receipt.tax + session.receipt.tip

  await setSession(session)
  return NextResponse.json({ receipt: session.receipt })
}
