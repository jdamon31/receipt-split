import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const ReceiptSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    line_total: z.number(), // the total printed on the receipt for this line (qty × unit price)
  })),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  tip: z.number().nullable(),
})

export type ParsedReceipt = z.infer<typeof ReceiptSchema>

export async function parseReceipt(imageData: string): Promise<ParsedReceipt> {
  const result = await generateText({
    model: openai('gpt-4o'),
    output: Output.object({ schema: ReceiptSchema }),
    messages: [{
      role: 'user',
      content: [
        { type: 'image', image: imageData },
        {
          type: 'text',
          text: `You are a receipt parser. Extract every food/drink line item from this receipt.

For each item return:
- name: the item name
- quantity: how many were ordered (integer, default 1 if not shown)
- line_total: the TOTAL price printed on the receipt for that line (e.g. if 2x Burger at $13 each, line_total is 26.00)

Also return:
- subtotal: the pre-tax subtotal if shown (null if not visible)
- tax: the tax amount if shown (null if not visible)
- tip: the tip amount if shown (null if not visible)

Rules:
- line_total is always the number printed at the right side of that line on the receipt
- Do NOT include tax, tip, subtotal, or total lines as items
- All numbers are plain dollars with no $ sign (e.g. 12.99 not "$12.99")`,
        },
      ],
    }],
  })
  return result.output
}
