# Receipt Split

Split restaurant receipts with friends instantly — no account needed. Scan the receipt, share a link, everyone taps what they ordered, and each person sees exactly what they owe with a one-tap payment link to settle up.

## How it works

1. **Host scans** — take a photo or upload the receipt. GPT-4o reads every item automatically.
2. **Review** — fix any OCR errors, adjust tax and tip.
3. **Share** — send the link or QR code. Everyone joins from their own phone.
4. **Claim** — each person taps the items they ordered. The board updates live.
5. **Settle** — everyone sees their exact total (items + proportional tax/tip share) and a one-tap Venmo/Cash App/Zelle payment link.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Storage | Upstash Redis (Vercel Marketplace) — sessions expire after 48 hours |
| Receipt OCR | OpenAI GPT-4o via AI SDK v6 |
| Image storage | Vercel Blob |
| Real-time | SWR polling every 2 seconds |
| Deploy | Vercel |

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `receiptsplit_KV_REST_API_URL` | Vercel dashboard → Storage → your Upstash KV store |
| `receiptsplit_KV_REST_API_TOKEN` | same as above |
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard → Storage → your Blob store |

Pull all Vercel env vars locally with:
```bash
vercel env pull .env.local
```

## Project structure

```
app/
  page.tsx                        # Landing page — create session CTA
  session/[id]/
    page.tsx                      # Orchestrator — redirects based on session status
    scan/page.tsx                 # Step 1: upload receipt photo
    review/page.tsx               # Step 2: edit OCR items, set tax/tip
    claim/page.tsx                # Step 3: tap to claim items (live polling)
    breakdown/page.tsx            # Step 4: per-person totals + payment links
    join/page.tsx                 # Guest join — enter your name
  api/session/
    create/route.ts               # POST: create a new session
    [id]/route.ts                 # GET: fetch full session state
    [id]/join/route.ts            # POST: add a participant
    [id]/receipt/route.ts         # POST: upload image → Blob → OCR → save items
    [id]/items/route.ts           # PUT: update items after review
    [id]/claim/route.ts           # POST: claim or unclaim an item
    [id]/assign/route.ts          # POST: host assigns unclaimed items
    [id]/tip/route.ts             # PUT: set tax/tip amounts
    [id]/advance/route.ts         # POST: advance session to next status

components/
  claim-board.tsx                 # Color-coded interactive item claiming grid
  breakdown-card.tsx              # Per-person cost card with itemized line items
  unclaimed-items.tsx             # Host assigns leftover items
  item-editor.tsx                 # Editable item list on the review page
  participant-badge.tsx           # Colored name chip
  share-banner.tsx                # Copy link + Web Share API + QR code
  payment-button.tsx              # Venmo/Cash App/Zelle deep link buttons

lib/
  redis.ts                        # Upstash client
  session.ts                      # getSession, setSession, createSession, applyClaim
  ocr.ts                          # GPT-4o receipt parsing with auto-retry
  calculate.ts                    # Proportional tax/tip split math
  payment-links.ts                # Deep link URL builders

hooks/
  use-session.ts                  # SWR polling hook (2s interval)

types/
  session.ts                      # All shared TypeScript types
```

## Split math

Each person pays:
- **Items total** = sum of (item price × quantity × claimed fraction)
- **Tax share** = (their items total / total claimed subtotal) × receipt tax
- **Tip share** = (their items total / total claimed subtotal) × receipt tip
- **Total owed** = items total + tax share + tip share

Unclaimed items don't affect anyone's total until they're assigned or claimed.

## OCR accuracy

Receipt parsing uses a three-layer approach:

1. **Detailed prompt** — GPT-4o is given explicit rules: only include ordered items, read `line_total` as the right-side printed amount for that line (not unit price), exclude tax/tip/fee/discount lines.
2. **Auto-retry** — after parsing, item line totals are summed and compared to the printed subtotal. If they differ by more than 8%, GPT-4o is called again with a corrective hint pointing out the exact gap.
3. **Code filtering** — items with price ≤ 0 or names matching tax/tip/fee/discount/surcharge patterns are dropped before saving.

## Guest flow

Guests open the shared link, enter their name, and land on the claim board. When the host presses "Everyone's done", all guests are automatically redirected to the breakdown page. Guests can still claim any unclaimed items from the breakdown page, and their total updates live.

## Payment deep links

| Provider | Format |
|---|---|
| Venmo | `venmo://paycharge?txn=pay&recipients={handle}&amount={amount}&note=Receipt+Split` |
| Cash App | `https://cash.app/${handle}/{amount}` |
| Zelle | No universal deep link — shows phone/email with copy button |

## Deployment

Push to `main` → Vercel auto-deploys. Requires Upstash KV and Vercel Blob stores connected in the Vercel dashboard with environment variables set.
