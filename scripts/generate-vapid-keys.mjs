// Creates the key pair browsers use to trust Kampala Cars' push notifications (VAPID).
// Run once: node scripts/generate-vapid-keys.mjs
// NEXT_PUBLIC_VAPID_PUBLIC_KEY goes in .env; VAPID_PRIVATE_KEY is a secret for the
// Cloudflare dashboard (and .dev.vars locally). Changing the keys later means every
// browser has to turn notifications on again.
import { generateKeyPairSync } from 'node:crypto'

const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const jwk = privateKey.export({ format: 'jwk' })
const publicKey = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]).toString('base64url')

console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${jwk.d}`)
