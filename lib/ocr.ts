import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const ReceiptSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    line_total: z.number(),
  })),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  tip: z.number().nullable(),
})

export type ParsedReceipt = z.infer<typeof ReceiptSchema>

const SYSTEM_PROMPT = `You are an expert receipt parser. Your job is to extract every ordered item from a receipt photo.

WHAT TO INCLUDE:
- Food and drink items that were ordered
- Each line that has a price on the right side

WHAT TO EXCLUDE (very important — do NOT list these as items):
- Tax lines (sales tax, VAT, GST, etc.)
- Tip or gratuity lines
- Service charge, delivery fee, platform fee, convenience fee
- Subtotal, total, balance due lines
- Discount lines (negative amounts like "-$2.00 PROMO")
- Void or comped items (price of $0.00)
- Modifier lines with no price (e.g. "NO ONIONS", "EXTRA SAUCE")

HOW TO READ EACH ITEM LINE:
- name: the item name, cleaned up (remove leading numbers/codes)
- quantity: look for patterns like "2x BURGER", "BURGER x2", "2 BURGER". Default to 1.
- line_total: the dollar amount printed at the RIGHT of that line — this is the TOTAL for that line
  - Example: "Burger x2    $26.00" → quantity=2, line_total=26.00 (NOT 13.00)
  - Example: "Coke          $3.50" → quantity=1, line_total=3.50
  - Example: "3 Tacos       $9.00" → quantity=3, line_total=9.00

MODIFIERS WITH A PRICE (e.g. "Add Avocado +$1.50"):
- Include these as their own item with the price shown

Return all numbers as plain decimals without $ signs (e.g. 12.99 not "$12.99").`

const RETRY_PROMPT_SUFFIX = (itemsSum: number, subtotal: number) =>
  `\n\nIMPORTANT: Your previous parse gave items summing to $${itemsSum.toFixed(2)} but the receipt shows a subtotal of $${subtotal.toFixed(2)}. The difference is $${Math.abs(subtotal - itemsSum).toFixed(2)}. Please look again carefully — you likely missed an item or got a quantity or line_total wrong. Re-examine every line on the receipt.`

async function callOCR(imageData: string, extraHint = ''): Promise<ParsedReceipt> {
  const result = await generateText({
    model: openai('gpt-4o'),
    output: Output.object({ schema: ReceiptSchema }),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', image: imageData },
          { type: 'text', text: SYSTEM_PROMPT + extraHint },
        ],
      },
    ],
  })
  return result.output
}

export async function parseReceipt(imageData: string): Promise<ParsedReceipt> {
  const parsed = await callOCR(imageData)

  // Sanity check: if the receipt shows a subtotal, verify our items sum matches it
  if (parsed.subtotal && parsed.subtotal > 0) {
    const itemsSum = parsed.items.reduce((s, i) => s + i.line_total, 0)
    const discrepancy = Math.abs(itemsSum - parsed.subtotal)
    const pct = discrepancy / parsed.subtotal

    if (pct > 0.08) {
      // Off by more than 8% — retry with a corrective hint
      console.log(`OCR retry: items sum $${itemsSum.toFixed(2)} vs subtotal $${parsed.subtotal.toFixed(2)} (${(pct * 100).toFixed(1)}% off)`)
      const retried = await callOCR(imageData, RETRY_PROMPT_SUFFIX(itemsSum, parsed.subtotal))

      // Use whichever parse is closer to the subtotal
      const retriedSum = retried.items.reduce((s, i) => s + i.line_total, 0)
      const retriedPct = Math.abs(retriedSum - parsed.subtotal) / parsed.subtotal
      return retriedPct < pct ? retried : parsed
    }
  }

  return parsed
}
