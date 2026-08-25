#!/usr/bin/env node
/**
 * Codemod: replace hardcoded hex color literals with named tokens from
 * `@/lib/constants/figma-tokens` across app/, components/, and lib/.
 *
 * Exact-value mapping only — zero visual change.
 * Usage: node scripts/tokenize-colors.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TOKEN_MODULE = '@/lib/constants/figma-tokens';
const SRC_DIRS = ['app', 'components', 'lib'];
const EXCLUDE_FILES = new Set([
  'lib/constants/figma-tokens.ts',
  'constants/portal-theme.ts',
  'constants/theme.ts',
  'constants/demo-accounts.ts',
  'lib/api/seed-properties.ts',
  'hooks/use-colors.ts',
  'lib/theme-provider.tsx',
]);
const EXCLUDE_DIR_PARTS = ['mock'];

const MAP = {
  '#94A3B8': ['SLATE', '400'],
  '#F1F5F9': ['SLATE', '100'],
  '#E2E8F0': ['SLATE', '200'],
  '#CBD5E1': ['SLATE', '300'],
  '#64748B': ['SLATE', '500'],
  '#475569': ['SLATE', '600'],
  '#334155': ['SLATE', '700'],
  '#1E293B': ['SLATE', '800'],
  '#0F172A': ['SLATE', '900'],
  '#121C28': ['SLATE', '950'],
  '#F8FAFC': ['SLATE', '50'],
  '#F3F4F6': ['GRAY', '100'],
  '#E5E7EB': ['GRAY', '200'],
  '#D1D5DB': ['GRAY', '300'],
  '#9CA3AF': ['GRAY', '400'],
  '#6B7280': ['GRAY', '500'],
  '#4B5563': ['GRAY', '600'],
  '#374151': ['GRAY', '700'],
  '#111827': ['GRAY', '900'],
  '#002645': ['BRAND', 'navy'],
  '#1A3C5E': ['BRAND', 'navyLight'],
  '#16233A': ['BRAND', 'navyDark'],
  '#006687': ['BRAND', 'teal'],
  '#005D7C': ['BRAND', 'tealDark'],
  '#004D67': ['BRAND', 'tealDeep'],
  '#2E86AB': ['SRS', 'teal'],
  '#D35400': ['SRS', 'orange'],
  '#C0392B': ['SRS', 'red'],
  '#1E8449': ['SRS', 'green'],
  '#1A1C1E': ['TEXT', 'heading'],
  '#43474E': ['TEXT', 'primary'],
  '#73777F': ['TEXT', 'muted'],
  '#A7A4A4': ['TEXT', 'label'],
  '#000000': ['TEXT', 'black'],
  '#1C1B19': ['TEXT', 'ink'],
  '#FAF9FC': ['BG', 'page'],
  '#F4F3F6': ['BG', 'card'],
  '#F4F3F4': ['BG', 'card'],
  '#EEEDF1': ['BG', 'subCard'],
  '#FFFFFF': ['BG', 'white'],
  '#BEC5CD': ['BG', 'banner'],
  '#E8F4FD': ['BG', 'tealPale'],
  '#CFFAFE': ['BG', 'tealLight'],
  '#C3C6CF': ['BORDER', 'primary'],
  '#D9D9D9': ['BORDER', 'input'],
  '#E8E8EB': ['BORDER', 'inactive'],
  '#AB8D8D': ['UI', 'rememberText'],
  '#10B981': ['STATUS', 'activeGreen'],
  '#16A34A': ['STATUS', 'activeGreenDark'],
  '#15803D': ['STATUS', 'activeGreenDeep'],
  '#BA1A1A': ['STATUS', 'danger'],
  '#93000A': ['STATUS', 'dangerDark'],
  '#FFDAD6': ['STATUS', 'dangerBg'],
  '#166534': ['STATUS', 'bookingConfirmed'],
  '#F8BD00': ['STATUS', 'bookingPending'],
  '#87D6FE': ['STATUS', 'badgeBlue'],
  '#DCFCE7': ['STATUS', 'badgeGreen'],
  '#FFDDB0': ['STATUS', 'badgeOrange'],
  '#2980B9': ['STATUS_COLORS', 'occupied'],
  '#16A085': ['STATUS_COLORS', 'cleaning'],
  '#8E44AD': ['STATUS_COLORS', 'inspected'],
  '#7F8C8D': ['STATUS_COLORS', 'blocked'],
  '#CD7F32': ['STATUS_COLORS', 'bronze'],
  '#C0C0C0': ['STATUS_COLORS', 'silver'],
  '#FFD700': ['STATUS_COLORS', 'gold'],
  '#E5E4E2': ['STATUS_COLORS', 'platinum'],
  '#4285F4': ['SOCIAL', 'google'],
  '#EA4335': ['SOCIAL', 'googleRed'],
  '#1877F2': ['SOCIAL', 'facebook'],
  '#DBEAFE': ['BLUE', '100'],
  '#D9E3F4': ['BLUE_TINT', 'medium'],
  '#FEF2F2': ['RED', '50'],
  '#FEE2E2': ['RED', '100'],
  '#FECACA': ['RED', '200'],
  '#FCA5A5': ['RED', '300'],
  '#EF4444': ['RED', '500'],
  '#DC2626': ['RED', '600'],
  '#B91C1C': ['RED', '700'],
  '#991B1B': ['RED', '800'],
  '#F39C12': ['ORANGE', '400'],
  '#F97316': ['ORANGE', '500'],
  '#FFFBEB': ['AMBER', '50'],
  '#FEF3C7': ['AMBER', '100'],
  '#FDE68A': ['AMBER', '200'],
  '#F59E0B': ['AMBER', '500'],
  '#D97706': ['AMBER', '600'],
  '#B45309': ['AMBER', '700'],
  '#92400E': ['AMBER', '800'],
  '#CA8A04': ['YELLOW', '600'],
  '#F0FDF4': ['GREEN', '50'],
  '#BBF7D0': ['GREEN', '200'],
  '#86EFAC': ['GREEN', '300'],
  '#22C55E': ['GREEN', '500'],
  '#F0FFF4': ['GREEN', 'pale'],
  '#EBF6EF': ['GREEN', 'tint'],
  '#C6F6D5': ['GREEN', 'mint'],
  '#27AE60': ['GREEN', 'bright'],
  '#ECFDF5': ['EMERALD', '50'],
  '#D1FAE5': ['EMERALD', '100'],
  '#059669': ['EMERALD', '600'],
  '#065F46': ['EMERALD', '800'],
  '#0D9488': ['TEAL', '600'],
  '#F0F9FF': ['CYAN', '50'],
  '#06B6D4': ['CYAN', '500'],
  '#0891B2': ['CYAN', '600'],
  '#EFF6FF': ['BLUE', '50'],
  '#93C5FD': ['BLUE', '300'],
  '#3B82F6': ['BLUE', '500'],
  '#2563EB': ['BLUE', '600'],
  '#1D4ED8': ['BLUE', '700'],
  '#EBF5FB': ['BLUE', 'tint'],
  '#007AFF': ['BLUE', 'ios'],
  '#EEF2FF': ['INDIGO', '50'],
  '#E0E7FF': ['INDIGO', '100'],
  '#C7D2FE': ['INDIGO', '200'],
  '#6366F1': ['INDIGO', '500'],
  '#F5F3FF': ['PURPLE', '50'],
  '#F3E8FF': ['PURPLE', '100'],
  '#8B5CF6': ['PURPLE', '500'],
  '#9333EA': ['PURPLE', '600'],
  '#7C3AED': ['PURPLE', '700'],
  '#FDF2F8': ['PINK', '50'],
  '#EC4899': ['PINK', '500'],
  '#DB2777': ['PINK', '600'],
  '#FF6B6B': ['CORAL', '300'],
  '#E94560': ['CORAL', '400'],
  '#E63946': ['CORAL', '500'],
  '#D4111E': ['CORAL', '600'],
  '#FAFAFA': ['NEUTRAL', '50'],
  '#F8F9FB': ['NEUTRAL', '100'],
  '#F8F8F8': ['NEUTRAL', '200'],
  '#F5F5F5': ['NEUTRAL', '300'],
  '#F0F2F5': ['NEUTRAL', '400'],
  '#E8E8E8': ['NEUTRAL', '500'],
  '#FFFAFA': ['NEUTRAL', 'snow'],
  '#E8EEF4': ['CLOUD', 'frost'],
  '#E6EDF3': ['CLOUD', 'mist'],
  '#D1D9E6': ['CLOUD', 'haze'],
  '#C9D6E0': ['CLOUD', 'vapor'],
  '#C8D0DB': ['CLOUD', 'cloud'],
  '#C0C8D4': ['CLOUD', 'fog'],
  '#B0B8C4': ['CLOUD', 'silver'],
  '#8896A6': ['CLOUD', 'steel'],
  '#8895A7': ['CLOUD', 'slateBlue'],
  '#FAF6EE': ['WARM', 'ivory'],
  '#EFE6D2': ['WARM', 'cream'],
  '#C9C5BA': ['WARM', 'sand'],
  '#C9C2B4': ['WARM', 'taupe'],
  '#FFB088': ['WARM', 'peach'],
  '#FFD58A': ['WARM', 'apricot'],
  '#E8B84B': ['WARM', 'gold'],
  '#B8860B': ['WARM', 'bronze'],
  '#B8862E': ['WARM', 'bronzeLight'],
  '#C45B3E': ['WARM', 'terracotta'],
  '#0D1117': ['KDS', 'bg'],
  '#161B22': ['KDS', 'card'],
  '#30363D': ['KDS', 'border'],
  '#8B949E': ['KDS', 'muted'],
  '#1F6FEB': ['KDS', 'accent'],
  '#238636': ['KDS', 'success'],
  '#635BFF': ['PAYMENT', 'stripe'],
  '#0C2451': ['PAYMENT', 'stripeDark'],
  '#5C2D91': ['PAYMENT', 'razorpay'],
  '#0071C2': ['PAYMENT', 'bookingBlue'],
  '#00875A': ['PAYMENT', 'success'],
  '#F0F7FF': ['PAYMENT', 'successLight'],
  // 3-digit shorthand
  '#FFF': ['BG', 'white'],
  '#000': ['TEXT', 'black'],
};

const lookup = (hex) => MAP[hex.toUpperCase()];
const refFor = (group, member) =>
  /^[0-9]+$/.test(member) ? `${group}[${member}]` : `${group}.${member}`;

function collectFiles() {
  const files = [];
  for (const dir of SRC_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    const walk = (d) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        const rel = path.relative(ROOT, full).split(path.sep).join('/');
        if (entry.isDirectory()) {
          if (EXCLUDE_DIR_PARTS.some((p) => rel.split('/').includes(p))) continue;
          if (entry.name === 'node_modules') continue;
          walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          if (EXCLUDE_FILES.has(rel)) continue;
          files.push({ abs: full, rel });
        }
      }
    };
    walk(abs);
  }
  return files;
}

function collectBoundIdentifiers(src) {
  const bound = new Set();
  const add = (m) => { if (m) bound.add(m[1]); };
  const reImport = /import\s+(?:type\s+)?(?:(\w+)(?:\s*,\s*\{([^}]*)\})?|\{([^}]*)\}|\*\s+as\s+(\w+))\s+from\s+['"][^'"]+['"]/g;
  let m;
  while ((m = reImport.exec(src))) {
    const list = m[2] ?? m[3];
    add(m);
    if (m[4]) bound.add(m[4]);
    if (list) {
      for (const spec of list.split(',')) {
        const name = spec.trim().split(/\s+as\s+/).pop().trim();
        if (name) bound.add(name);
      }
    }
  }
  // side-effect imports with default, e.g. import tokens from '...'
  const reDefault = /import\s+(\w+)\s+from\s+['"][^'"]+['"]/g;
  while ((m = reDefault.exec(src))) bound.add(m[1]);
  // declarations
  const reDecl = /\b(?:const|let|var|function|class|enum|interface|type)\s+([A-Za-z_$][\w$]*)\b/g;
  while ((m = reDecl.exec(src))) bound.add(m[1]);
  // destructured consts
  const reDest = /\bconst\s*\{([^}]*)\}\s*=/g;
  while ((m = reDest.exec(src))) {
    for (const spec of m[1].split(',')) {
      const name = spec.trim().split(/\s*[:=]\s*/)[0].trim();
      if (name) bound.add(name);
    }
  }
  return bound;
}

const HEX_RE = /(["'`])#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})(["'`])/g;

function findMatches(src) {
  const out = [];
  let m;
  HEX_RE.lastIndex = 0;
  while ((m = HEX_RE.exec(src))) {
    if (m[1] === '`') continue; // only simple quoted literals
    const hex = '#' + m[2];
    const t = lookup(hex);
    if (!t) continue;
    const start = m.index;
    const q = m[1];
    const end = start + q.length + hex.length + q.length;
    out.push({ start, end, hex: hex.toUpperCase(), q });
  }
  return out;
}

function isJsxAttribute(src, start, q) {
  let i = start - 1;
  if (src[i - 1] === '=') return false; // e.g. x == "..."
  // scan back over whitespace then expect '=' followed by word char
  let j = start;
  while (j > 0 && /\s/.test(src[j - 1])) j--;
  if (j === 0 || src[j - 1] !== '=') return false;
  const beforeEq = j - 2;
  if (beforeEq < 0 || !/[A-Za-z0-9_$-]/.test(src[beforeEq])) return false;
  // must look like a JSX attribute: inside a tag, not after : or ;
  const back = src.slice(0, j - 1);
  const lastDelim = Math.max(back.lastIndexOf('<'), back.lastIndexOf('{'), back.lastIndexOf('('), back.lastIndexOf(';'));
  return lastDelim !== -1 && back[lastDelim] === '<';
}

function buildReplacements(src, matches) {
  const out = [];
  for (const mt of matches) {
    const t = lookup(mt.hex);
    let ref = refFor(t[0], t[1]);
    const jsx = isJsxAttribute(src, mt.start, mt.q);
    out.push({ ...mt, ref, jsx });
  }
  return out;
}

function upsertTokenImport(src, names) {
  const specifier = `import { ${names.join(', ')} } from '${TOKEN_MODULE}';`;
  const lines = src.split('\n');
  const reLine = /^\s*import\s*\{[^}]*\}\s*from\s*['"]@\/lib\/constants\/figma-tokens['"];?\s*$/;
  const existingIdx = lines.findIndex((l) => reLine.test(l));
  if (existingIdx !== -1) {
    const cur = /\{([^}]*)\}/.exec(lines[existingIdx])[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...cur, ...names])).sort();
    lines[existingIdx] = `import { ${merged.join(', ')} } from '${TOKEN_MODULE}';`;
    return lines.join('\n');
  }
  let insertAt = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\b/.test(lines[i])) insertAt = i;
  }
  lines.splice(insertAt + 1, 0, specifier);
  return lines.join('\n');
}

function processFile(file) {
  const src = fs.readFileSync(file.abs, 'utf8');
  const matches = findMatches(src);
  if (matches.length === 0) return null;
  const bound = collectBoundIdentifiers(src);
  const repl = buildReplacements(src, matches);
  const needed = new Map(); // group -> set of {name, alias}
  for (const r of repl) {
    const [g] = lookup(r.hex);
    if (!needed.has(g)) needed.set(g, new Set());
    needed.get(g).add(g);
  }
  // decide aliases
  const aliases = new Map();
  const usedAlias = new Set();
  for (const g of needed.keys()) {
    if (bound.has(g)) {
      let alias = `${g}Tokens`;
      while (bound.has(alias) || usedAlias.has(alias)) alias += '_';
      aliases.set(g, alias);
      usedAlias.add(alias);
    }
  }
  // build refs respecting aliases
  const byIndex = [...repl].sort((a, b) => b.start - a.start);
  let next = src;
  for (const r of byIndex) {
    const [g, member] = lookup(r.hex);
    const group = aliases.get(g) ?? g;
    let ref = refFor(group, member);
    if (r.jsx) ref = `{${ref}}`;
    next = next.slice(0, r.start) + ref + next.slice(r.end);
  }
  // import names
  const importSpecs = [];
  for (const g of needed.keys()) {
    if (aliases.has(g)) importSpecs.push(`${g} as ${aliases.get(g)}`);
    else if (!bound.has(g)) importSpecs.push(g);
  }
  if (importSpecs.length > 0) {
    next = upsertTokenImport(next, importSpecs);
  }
  fs.writeFileSync(file.abs, next);
  return { file: file.rel, replaced: repl.length, groups: Array.from(needed.keys()).sort().join(','), aliases: aliases.size };
}

const files = collectFiles();
const results = [];
let total = 0;
for (const f of files) {
  const r = processFile(f);
  if (r) {
    results.push(r);
    total += r.replaced;
  }
}
console.log(`Files changed: ${results.length}`);
console.log(`Hex literals replaced: ${total}`);
const aliased = results.filter((r) => r.aliases > 0);
if (aliased.length) {
  console.log('\nAliased groups (collision with local identifier):');
  for (const r of aliased) console.log(`  ${r.file} (${r.groups})`);
}
console.log('\nGroups used per file:');
for (const r of results) console.log(`  ${r.file}: ${r.groups}`);
