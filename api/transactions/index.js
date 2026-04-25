import { get } from '@vercel/blob'

const BLOB_KEY = 'gold_transactions.json'

export async function GET() {
  try {
    const blob = await get(BLOB_KEY)
    if (!blob) return Response.json([])
    const text = await blob.text()
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch {
    return Response.json([])
  }
}
