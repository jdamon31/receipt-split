import { Session, ParticipantBreakdown, Claim } from '@/types/session'

export function calculateBreakdowns(session: Session): ParticipantBreakdown[] {
  const { receipt, participants, claims } = session
  const { items, subtotal, tax, tip } = receipt

  if (participants.length === 0) return []

  return participants.map(participant => {
    // Sum claimed items for this participant
    let itemsTotal = 0
    for (const item of items) {
      const claim = claims.find(
        c => c.itemId === item.id && c.participantId === participant.id
      )
      if (claim) {
        itemsTotal += item.price * item.quantity * claim.fraction
      }
    }

    // Handle unclaimed items — split equally
    const unclaimedItems = items.filter(item => {
      const totalClaimed = claims
        .filter(c => c.itemId === item.id)
        .reduce((sum, c) => sum + c.fraction, 0)
      return totalClaimed < 0.99
    })
    for (const item of unclaimedItems) {
      const totalClaimed = claims
        .filter(c => c.itemId === item.id)
        .reduce((sum, c) => sum + c.fraction, 0)
      const unclaimed = 1 - totalClaimed
      itemsTotal += (item.price * item.quantity * unclaimed) / participants.length
    }

    const subtotalShare = subtotal > 0 ? itemsTotal / subtotal : 1 / participants.length
    const taxShare = subtotalShare * tax
    const tipShare = subtotalShare * tip
    const total = itemsTotal + taxShare + tipShare

    return {
      participant,
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
