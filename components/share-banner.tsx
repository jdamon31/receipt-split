'use client'

import { useState } from 'react'
import { QRCode } from './qr-code'
import { Button } from '@/components/ui/button'

interface Props {
  sessionId: string
}

export function ShareBanner({ sessionId }: Props) {
  const [copied, setCopied] = useState(false)
  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/session/${sessionId}/join`
      : ''

  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  const share = async () => {
    try {
      await navigator.share({
        title: 'Split this receipt with me',
        text: 'Tap to claim your items and see what you owe.',
        url: joinUrl,
      })
    } catch {
      // User cancelled or share failed — silently ignore
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">
        Share this link so friends can join
      </p>
      <QRCode url={joinUrl} />
      <div className="flex w-full max-w-xs flex-col gap-2">
        {canShare && (
          <Button className="w-full gap-2" onClick={share}>
            📤 Share to Messages / Group Chat
          </Button>
        )}
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={joinUrl}
            className="flex-1 truncate rounded-lg border bg-background px-3 py-2 text-xs"
          />
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>
    </div>
  )
}
