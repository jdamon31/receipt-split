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
  let blobUrl: string | undefined
  try {
    const blob = await put(`receipts/${id}-${nanoid(4)}`, file, { access: 'public' })
    blobUrl = blob.url
  } catch (err) {
    console.error('Blob upload failed:', err)
    // Continue without image preview — OCR can still run
  }

  // Parse with OCR using raw image data (not the URL)
  let parsed
  try {
    parsed = await parseReceipt(dataUrl)
  } catch (err) {
    console.error('OCR failed:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `OCR failed: ${message}` }, { status: 500 })
  }

  // Compute unit price per OCR line
  const parsed_items = parsed.items.map(item => {
    const qty = Math.max(1, Math.round(item.quantity ?? 1))
    const unitPrice = Math.round((item.line_total / qty) * 100) / 100
    return { name: item.name.trim(), qty, unitPrice }
  })

  // Consolidate items with same name + same unit price into one entry
  const consolidated = new Map<string, { name: string; qty: number; unitPrice: number }>()
  for (const item of parsed_items) {
    const key = `${item.name.toLowerCase()}|${item.unitPrice.toFixed(2)}`
    if (consolidated.has(key)) {
      consolidated.get(key)!.qty += item.qty
    } else {
      consolidated.set(key, { ...item })
    }
  }

  const items = Array.from(consolidated.values()).map(item => ({
    id: nanoid(6),
    name: item.name,
    price: item.unitPrice,
    quantity: item.qty,
  }))

  const subtotal = parsed.subtotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0)

  session.receipt = {
    imageUrl: blobUrl,
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
