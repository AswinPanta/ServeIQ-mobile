#!/usr/bin/env node
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode");

const url = process.argv[2];

if (!url) {
  console.error('Usage: node scripts/generate_qr.mjs "exps://..."');
  process.exit(1);
}

await QRCode.toFile("expo-qr-code.png", url, { width: 512 });
console.log(`✅ QR code saved to expo-qr-code.png`);
