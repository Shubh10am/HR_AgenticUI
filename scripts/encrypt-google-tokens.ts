/**
 * One-time migration: encrypt Google OAuth tokens that were stored in plain
 * text before token encryption was introduced. Safe to run more than once —
 * already-encrypted tokens are skipped.
 *
 * Usage:
 *   npx tsx scripts/encrypt-google-tokens.ts --dry-run   # report only
 *   npx tsx scripts/encrypt-google-tokens.ts             # encrypt
 *
 * Reads MONGODB_URI and ENCRYPTION_KEY from .env.local. Never prints tokens.
 */
import { config } from 'dotenv';

config({ path: '.env.local' });

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const mongoose = (await import('mongoose')).default;
  const { isSealedToken, openToken, sealToken } = await import('../src/services/google-token-crypto');

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set.');
  await mongoose.connect(process.env.MONGODB_URI);
  const collection = mongoose.connection.db!.collection('googleapicredentials');

  let encrypted = 0;
  let skipped = 0;
  for await (const doc of collection.find({}, { projection: { accessToken: 1, refreshToken: 1 } })) {
    const update: Record<string, string> = {};
    if (doc.accessToken && !isSealedToken(doc.accessToken)) update.accessToken = sealToken(doc.accessToken)!;
    if (doc.refreshToken && !isSealedToken(doc.refreshToken)) update.refreshToken = sealToken(doc.refreshToken)!;
    if (Object.keys(update).length === 0) { skipped++; continue; }

    // Prove the new value decrypts to the original before replacing anything.
    if (update.accessToken && openToken(update.accessToken) !== doc.accessToken) throw new Error(`Round-trip check failed for ${doc._id}`);
    if (update.refreshToken && openToken(update.refreshToken) !== doc.refreshToken) throw new Error(`Round-trip check failed for ${doc._id}`);

    if (!isDryRun) await collection.updateOne({ _id: doc._id }, { $set: update });
    encrypted++;
  }

  console.log(`${isDryRun ? '[dry run] would encrypt' : 'Encrypted'} ${encrypted} credential(s); ${skipped} already encrypted.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Migration failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
