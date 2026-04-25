import express from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, 'data', 'transactions.json')
const PORT = parseInt(process.env.PORT || '3003', 10)
const isProd = process.env.NODE_ENV === 'production'

const app = express()
app.use(express.json())

// In production, serve built static files
if (isProd) {
  const staticDir = join(__dirname, '..', 'dist')
  app.use(express.static(staticDir))
}

function readData() {
  try {
    if (!existsSync(DATA_FILE)) writeFileSync(DATA_FILE, '[]', 'utf-8')
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

app.get('/api/transactions', (req, res) => {
  res.json(readData())
})

app.post('/api/transactions/save', (req, res) => {
  if (Array.isArray(req.body)) {
    writeData(req.body)
    res.json({ success: true, count: req.body.length })
  } else {
    res.status(400).json({ error: 'body must be an array' })
  }
})

// SPA fallback: serve index.html for all non-API routes
if (isProd) {
  app.get('*', (req, res) => {
    res.sendFile(join(process.cwd(), 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (${isProd ? 'production' : 'dev'})`)
})
