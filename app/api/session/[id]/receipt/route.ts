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

  // Read file bytes for OCR (works regardless of blob access setting)
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  // Upload to Vercel Blob for display in the review step
  const blob = await put(`receipts/${id}-${nanoid(4)}`, file, { access: 'public' })

  // Parse with OCR using raw image data (not the URL)
  const parsed = await parseReceipt(dataUrl)

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
