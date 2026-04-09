'use client'

import { QRCodeSVG } from 'qrcode.react'

interface Props {
  url: string
  size?: number
}

export function QRCode({ url, size = 160 }: Props) {
  return (
    <div className="inline-block rounded-xl bg-white p-3 shadow-sm">
      <QRCodeSVG value={url} size={size} />
    </div>
  )
}
