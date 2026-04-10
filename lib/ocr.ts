import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const ReceiptSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
  })),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  tip: z.number().nullable(),
})

export type ParsedReceipt = z.infer<typeof ReceiptSchema>

export async function parseReceipt(imageData: string): Promise<ParsedReceipt> {
  const result = await generateText({
    model: openai('gpt-4o-mini'),
    output: Output.object({ schema: ReceiptSchema }),
    messages: [{
      role: 'user',
      content: [
        { type: 'image', image: imageData },
        {
          type: 'text',
          text: 'Extract every line item from this receipt. For each item return: name, the UNIT price (price for one single item, not the line total), and quantity. If an item has no explicit quantity, use 1. Also extract subtotal, tax, and tip totals if visible (return null if not present). All prices must be plain numbers in dollars with no $ sign (e.g. 12.99 not "$12.99").',
        },
      ],
    }],
  })
  return result.output
}
