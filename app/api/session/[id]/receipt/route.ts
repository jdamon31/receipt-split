import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/session'
import { parseReceipt } from '@/lib/ocr'
import { put } from '@vercel/blob'
import { nanoid } from 'nanoid'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  // Upload to Vercel Blob
  const blob = await put(`receipts/${id}-${nanoid(4)}`, file, { access: 'public' })

  // Parse with OCR
  const parsed = await parseReceipt(blob.url)

  // Build receipt items
  const items = parsed.items.map(item => ({
    id: nanoid(6),
    name: item.name,
    price: item.price,
    quantity: item.quantity ?? 1,
  }))

  const subtotal = parsed.subtotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0)

  session.receipt = {
    imageUrl: blob.url,
    items,
    subtotal,
    tax: parsed.tax ?? 0,
    tip: parsed.tip ?? 0,
    total: subtotal + (parsed.tax ?? 0) + (parsed.tip ?? 0),
  }
  session.status = 'reviewing'
  await setSession(session)

  return NextResponse.json({ receipt: session.receipt })
}
