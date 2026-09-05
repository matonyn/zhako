#!/usr/bin/env node
import { createHmac } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(name) {
  const path = resolve(root, name)
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

function requireSecret() {
  const secret = process.env.GALLERY_SECRET
  if (!secret || secret.length < 16) {
    console.error('Set GALLERY_SECRET in .env.local (min 16 chars)')
    process.exit(1)
  }
  return secret
}

function b64url(s) {
  return Buffer.from(s).toString('base64url')
}

function mintQrToken(expUnix, secret) {
  const payload = b64url(JSON.stringify({ exp: expUnix }))
  const sig = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

const daysArg = process.argv.find((a) => a.startsWith('--days='))
const days = Number(process.env.QR_DAYS || daysArg?.split('=')[1] || 90)
const origin = (process.env.NEXT_PUBLIC_GALLERY_URL || 'http://localhost:3000').replace(
  /\/$/,
  ''
)
const secret = requireSecret()
const exp = Math.floor(Date.now() / 1000) + Math.floor(days * 86400)
const token = mintQrToken(exp, secret)
const url = `${origin}/enter?t=${token}`
console.log(url)
console.log(`# QR token expires in ${days} day(s) at unix ${exp}`)
console.log('# Encode this URL in your printed QR. Session after scan lasts 1 hour.')
