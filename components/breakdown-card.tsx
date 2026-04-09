'use client'

import { ParticipantBreakdown, Participant } from '@/types/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PaymentButtons } from './payment-button'

interface Props {
  breakdown: ParticipantBreakdown
  host: Participant
  isMe: boolean
}

export function BreakdownCard({ breakdown, host, isMe }: Props) {
  const { participant, itemsTotal, taxShare, tipShare, total } = breakdown

  return (
    <Card className={`${isMe ? 'ring-2 ring-offset-2' : ''}`} style={isMe ? { '--tw-ring-color': participant.color } as React.CSSProperties : {}}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: participant.color }}
          />
          {participant.name}
          {isMe && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Items</span>
          <span>${itemsTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax share</span>
          <span>${taxShare.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tip share</span>
          <span>${tipShare.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold text-base">
          <span>Total owed</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {!isMe && total > 0 && (
          <div className="pt-2">
            <PaymentButtons
              amount={total}
              payeeName={host.name}
              venmo={host.paymentHandles.venmo}
              cashapp={host.paymentHandles.cashapp}
              zelle={host.paymentHandles.zelle}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
