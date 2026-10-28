// Prints an Ed25519 private key as JWK for REPORT_PRIVATE_KEY_JWK, and the public part to stderr for your records.
const { privateKey, publicKey } = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])
const priv = await crypto.subtle.exportKey('jwk', privateKey)
delete priv.alg // Node adds alg: 'Ed25519'; workerd's importKey refuses it
const pub = await crypto.subtle.exportKey('jwk', publicKey)
console.error('public key (also served at /.well-known/filesanity-report-key):', JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x }))
console.log(JSON.stringify(priv))
