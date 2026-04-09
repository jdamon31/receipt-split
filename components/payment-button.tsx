'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { venmoLink, venmoWebLink, cashAppLink } from '@/lib/payment-links'

interface Props {
  amount: number
  payeeName: string
  venmo?: string
  cashapp?: string
  zelle?: string
}

export function PaymentButtons({ amount, payeeName, venmo, cashapp, zelle }: Props) {
  const [zelleCopied, setZelleCopied] = useState(false)

  const copyZelle = async () => {
    if (!zelle) return
    await navigator.clipboard.writeText(zelle)
    setZelleCopied(true)
    setTimeout(() => setZelleCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {venmo && (
        <a
          href={venmoLink(venmo, amount)}
          onClick={e => {
            // Fall back to web if app not installed
            setTimeout(() => { window.location.href = venmoWebLink(venmo) }, 1500)
          }}
        >
          <Button size="sm" className="bg-[#008CFF] hover:bg-[#0070CC] text-white gap-2">
            Pay via Venmo · ${amount.toFixed(2)}
          </Button>
        </a>
      )}
      {cashapp && (
        <a href={cashAppLink(cashapp, amount)} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="bg-[#00D632] hover:bg-[#00B82B] text-black gap-2">
            Pay via Cash App · ${amount.toFixed(2)}
          </Button>
        </a>
      )}
      {zelle && (
        <Button size="sm" variant="outline" onClick={copyZelle} className="gap-2">
          {zelleCopied ? `Copied ${zelle}!` : `Zelle · ${zelle}`}
        </Button>
      )}
      {!venmo && !cashapp && !zelle && (
        <p className="text-sm text-muted-foreground">
          You owe <strong>{payeeName}</strong>{' '}
          <strong>${amount.toFixed(2)}</strong> — ask them how they'd like to be paid.
        </p>
      )}
    </div>
  )
}
