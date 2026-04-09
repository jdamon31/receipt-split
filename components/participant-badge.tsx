'use client'

import { Participant } from '@/types/session'

interface Props {
  participant: Participant
  size?: 'sm' | 'md'
}

export function ParticipantBadge({ participant, size = 'md' }: Props) {
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium text-white ${px}`}
      style={{ backgroundColor: participant.color }}
    >
      {participant.name}
    </span>
  )
}
