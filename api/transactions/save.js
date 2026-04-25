import { put } from '@vercel/blob'

const BLOB_KEY = 'gold_transactions.json'

export async function POST(request) {
  try {
    const data = await request.json()
    if (!Array.isArray(data)) {
      return Response.json({ error: 'body must be an array' }, { status: 400 })
    }
    const blob = await put(BLOB_KEY, JSON.stringify(data), {
      contentType: 'application/json',
      access: 'public'
    })
    return Response.json({ success: true, count: data.length, url: blob.url })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
