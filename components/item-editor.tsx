'use client'

import { useState } from 'react'
import { ReceiptItem } from '@/types/session'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { nanoid } from 'nanoid'

interface Props {
  items: ReceiptItem[]
  onChange: (items: ReceiptItem[]) => void
}

export function ItemEditor({ items, onChange }: Props) {
  const update = (id: string, field: keyof ReceiptItem, value: string) => {
    onChange(
      items.map(item =>
        item.id === id
          ? { ...item, [field]: field === 'name' ? value : parseFloat(value) || 0 }
          : item
      )
    )
  }

  const remove = (id: string) => onChange(items.filter(i => i.id !== id))

  const add = () =>
    onChange([...items, { id: nanoid(6), name: '', price: 0, quantity: 1 }])

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_80px_64px_36px] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Item</span>
        <span>Price</span>
        <span>Qty</span>
        <span />
      </div>
      {items.map(item => (
        <div key={item.id} className="grid grid-cols-[1fr_80px_64px_36px] gap-2 items-center">
          <Input
            value={item.name}
            onChange={e => update(item.id, 'name', e.target.value)}
            placeholder="Item name"
            className="h-9"
          />
          <Input
            type="number"
            value={item.price}
            onChange={e => update(item.id, 'price', e.target.value)}
            className="h-9"
            min={0}
            step={0.01}
          />
          <Input
            type="number"
            value={item.quantity}
            onChange={e => update(item.id, 'quantity', e.target.value)}
            className="h-9"
            min={1}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
            onClick={() => remove(item.id)}
          >
            ✕
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full mt-2">
        + Add item
      </Button>
    </div>
  )
}
