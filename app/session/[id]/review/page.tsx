'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/hooks/use-session'
import { ReceiptItem } from '@/types/session'
import { ItemEditor } from '@/components/item-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useSession(id)
  const router = useRouter()

  const [items, setItems] = useState<ReceiptItem[]>([])
  const [tax, setTax] = useState(0)
  const [tip, setTip] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session) {
      setItems(session.receipt.items)
      setTax(session.receipt.tax)
      setTip(session.receipt.tip)
    }
  }, [session?.id]) // only on first load

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const total = subtotal + tax + tip

  const save = async () => {
    setSaving(true)
    await fetch(`/api/session/${id}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    await fetch(`/api/session/${id}/tip`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tax, tip }),
    })
    await fetch(`/api/session/${id}/advance`, { method: 'POST' })
    router.push(`/session/${id}/claim`)
  }

  if (!session) return <div className="p-6 text-muted-foreground">Loading…</div>

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Review Items</h1>
        <p className="text-muted-foreground text-sm">
          Fix any errors from the scan before everyone claims.
        </p>
      </div>

      {session.receipt.imageUrl && (
        <img
          src={session.receipt.imageUrl}
          alt="Receipt"
          className="w-full max-h-48 object-contain rounded-xl border"
        />
      )}

      <ItemEditor items={items} onChange={setItems} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="tax">Tax ($)</Label>
          <Input
            id="tax"
            type="number"
            min={0}
            step={0.01}
            value={tax}
            onChange={e => setTax(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tip">Tip ($)</Label>
          <Input
            id="tip"
            type="number"
            min={0}
            step={0.01}
            value={tip}
            onChange={e => setTip(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="rounded-xl bg-muted p-4 space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax</span><span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tip</span><span>${tip.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base pt-1 border-t">
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full h-14 rounded-xl text-base"
        onClick={save}
        disabled={saving || items.length === 0}
      >
        {saving ? 'Saving…' : 'Start Claiming →'}
      </Button>
    </main>
  )
}
