import { setCORS } from './_cors.js'
import { hasTokens } from './_tokens.js'

export default async function handler(req, res) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  const connected = await hasTokens()
  res.json({ connected })
}
