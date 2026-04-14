export interface Session {
  id: string
  createdAt: number
  expiresAt: number
  status: 'scanning' | 'reviewing' | 'claiming' | 'settled'
  hostId: string
  receipt: Receipt
  participants: Participant[]
  claims: Claim[]
}

export interface Receipt {
  imageUrl?: string
  items: ReceiptItem[]
  subtotal: number
  tax: number
  tip: number
  total: number
}

export interface ReceiptItem {
  id: string
  name: string
  price: number
  quantity: number
}

export interface Participant {
  id: string
  name: string
  color: string
  paymentHandles: {
    venmo?: string
    cashapp?: string
    zelle?: string
  }
}

export interface Claim {
  itemId: string
  participantId: string
  fraction: number
}

export interface ClaimedLineItem {
  item: ReceiptItem
  fraction: number    // how much of the item this person claimed
  subtotal: number    // price × quantity × fraction
}

export interface ParticipantBreakdown {
  participant: Participant
  claimedItems: ClaimedLineItem[]
  itemsTotal: number
  taxShare: number
  tipShare: number
  total: number
}
