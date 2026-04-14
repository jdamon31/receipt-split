import { Session, ParticipantBreakdown, ReceiptItem, ClaimedLineItem } from '@/types/session'

export function getUnclaimedItems(session: Session): ReceiptItem[] {
  return session.receipt.items.filter(item => {
    const totalClaimed = session.claims
      .filter(c => c.itemId === item.id)
      .reduce((sum, c) => sum + c.fraction, 0)
    return totalClaimed < 0.99
  })
}

export function calculateBreakdowns(session: Session): ParticipantBreakdown[] {
  const { receipt, participants, claims } = session
  const { items, subtotal, tax, tip } = receipt

  if (participants.length === 0) return []

  // Precompute total claimed subtotal across all participants (for proportional tax/tip)
  const claimedSubtotal = participants.reduce((sum, p) => {
    for (const item of items) {
      const c = claims.find(cl => cl.itemId === item.id && cl.participantId === p.id)
      if (c) sum += item.price * item.quantity * c.fraction
    }
    return sum
  }, 0)

  // Only count claimed items — unclaimed are handled separately
  return participants.map(participant => {
    const claimedItems: ClaimedLineItem[] = []
    let itemsTotal = 0

    for (const item of items) {
      const claim = claims.find(
        c => c.itemId === item.id && c.participantId === participant.id
      )
      if (claim && claim.fraction > 0) {
        const lineSubtotal = item.price * item.quantity * claim.fraction
        itemsTotal += lineSubtotal
        claimedItems.push({ item, fraction: claim.fraction, subtotal: lineSubtotal })
      }
    }

    const subtotalShare = claimedSubtotal > 0 ? itemsTotal / claimedSubtotal : subtotal > 0 ? itemsTotal / subtotal : 0
    const taxShare = subtotalShare * tax
    const tipShare = subtotalShare * tip
    const total = itemsTotal + taxShare + tipShare

    return {
      participant,
      claimedItems,
      itemsTotal: round(itemsTotal),
      taxShare: round(taxShare),
      tipShare: round(tipShare),
      total: round(total),
    }
  })
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
