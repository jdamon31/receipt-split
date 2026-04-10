import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const ReceiptSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    price: z.number(),
    quantity: z.number().default(1),
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
          text: 'Extract every line item with name and price from this receipt. Also extract subtotal, tax, and tip if visible. Return null for values not present. Prices should be numbers in dollars (e.g. 12.99 not "$12.99").',
        },
      ],
    }],
  })
  return result.output
}
