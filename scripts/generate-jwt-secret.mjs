#!/usr/bin/env node
/**
 * Generates a secure JWT secret you can set in BOTH:
 * 1. Supabase Dashboard → Project Settings → API → Change Legacy Secret → Create my own secret
 * 2. Supabase Dashboard → Edge Functions → Secrets → JWT_SECRET
 *
 * Run: node scripts/generate-jwt-secret.mjs
 * Then paste the printed value in both places (no need to copy from the dashboard).
 */

import crypto from 'node:crypto';

const secret = crypto.randomBytes(32).toString('base64url');

console.log('\nUse this value as your JWT secret in BOTH places:\n');
console.log(secret);
console.log('\n1. Supabase Dashboard → Project Settings → API');
console.log('   → Click "Change Legacy Secret" → "Create my own secret"');
console.log('   → Paste the value above and confirm.\n');
console.log('2. Supabase Dashboard → Edge Functions → Secrets');
console.log('   → Add or edit JWT_SECRET with the same value.\n');
console.log('Then redeploy: supabase functions deploy login --no-verify-jwt');
console.log('Log out and log in again in the app.\n');
