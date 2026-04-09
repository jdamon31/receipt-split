export function venmoLink(handle: string, amount: number, note = 'Dinner Split'): string {
  const encoded = encodeURIComponent(note)
  return `venmo://paycharge?txn=pay&recipients=${handle}&amount=${amount.toFixed(2)}&note=${encoded}`
}

export function venmoWebLink(handle: string): string {
  return `https://venmo.com/${handle}`
}

export function cashAppLink(handle: string, amount: number): string {
  // Cash App handle may or may not include $
  const cleanHandle = handle.startsWith('$') ? handle.slice(1) : handle
  return `https://cash.app/$${cleanHandle}/${amount.toFixed(2)}`
}

export function zelleInfo(contact: string): { display: string; copyValue: string } {
  return {
    display: contact,
    copyValue: contact,
  }
}
