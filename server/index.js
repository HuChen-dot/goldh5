import express from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, 'data', 'transactions.json')
const PORT = 3003

const app = express()
app.use(express.json())

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
