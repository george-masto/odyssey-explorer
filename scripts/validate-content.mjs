// Content validator — the design doc's citation checker, runnable locally and in CI.
//
//   node scripts/validate-content.mjs
//
// Checks every content/stops/*.md:
//   1. YAML frontmatter parses; base fields present.
//   2. excerpt: lines present; cite parses as "Od. B.X–Y"; every Greek line is
//      byte-identical (modulo whitespace) to the vendored Perseus text for that
//      line number — Greek can never drift from the source.
//   3. interlinear (marquee stops): word tokens rejoin to the excerpt lines.
//   4. tidbits: every one has text + source.
//   5. art: full attribution fields; the image file exists; licence is PD/CC (never NC/ND).
// Exits 1 with a report if anything fails.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parse } from 'yaml';

const errors = [];
const warn = [];
const norm = (s) => s.replace(/\s+/g, ' ').trim();

const greekCache = new Map();
function perseusLines(book, from, to) {
	const key = `${book}:${from}-${to}`;
	if (!greekCache.has(key)) {
		const out = execFileSync('node', ['scripts/perseus.mjs', 'grc', String(book), String(from), String(to)], {
			encoding: 'utf8'
		});
		const map = new Map();
		for (const row of out.trim().split('\n')) {
			const [n, ...rest] = row.split('\t');
			map.set(Number(n), norm(rest.join('\t')));
		}
		greekCache.set(key, map);
	}
	return greekCache.get(key);
}

const files = readdirSync('content/stops').filter((f) => f.endsWith('.md')).sort();
let deepCount = 0;
let interlinearCount = 0;

for (const f of files) {
	const src = readFileSync(`content/stops/${f}`, 'utf8');
	const m = /^---\n([\s\S]*?)\n---/.exec(src);
	if (!m) {
		errors.push(`${f}: missing frontmatter`);
		continue;
	}
	let y;
	try {
		y = parse(m[1]);
	} catch (e) {
		errors.push(`${f}: YAML parse error — ${e.message.split('\n')[0]}`);
		continue;
	}

	for (const field of ['id', 'seq', 'title', 'coords', 'camera', 'certainty', 'ancient', 'modern', 'crew', 'summary', 'book_refs'])
		if (y[field] === undefined) errors.push(`${f}: missing base field '${field}'`);

	// excerpt + Greek fidelity
	if (!y.excerpt) {
		errors.push(`${f}: no excerpt (deep content required)`);
	} else {
		deepCount++;
		const cite = /Od\. (\d+)\.(\d+)[–-](\d+)/.exec(y.excerpt.cite ?? '');
		if (!cite) {
			errors.push(`${f}: excerpt.cite doesn't parse as "Od. B.X–Y": '${y.excerpt.cite}'`);
		} else {
			const [, book, from, to] = cite.map(Number);
			try {
				const canonical = perseusLines(book, from, to);
				for (const line of y.excerpt.lines ?? []) {
					const want = canonical.get(line.n);
					if (want === undefined) errors.push(`${f}: line ${line.n} outside cited range ${book}.${from}–${to}`);
					else if (norm(line.grc) !== want)
						errors.push(`${f}: Greek drift at ${book}.${line.n}\n    have: ${norm(line.grc)}\n    want: ${want}`);
				}
			} catch (e) {
				errors.push(`${f}: perseus extraction failed — ${e.message}`);
			}
		}
		if (!y.excerpt.en?.length) errors.push(`${f}: excerpt.en empty`);
	}

	// interlinear rejoin
	if (y.interlinear) {
		interlinearCount++;
		const byLine = new Map((y.excerpt?.lines ?? []).map((l) => [l.n, norm(l.grc)]));
		for (const il of y.interlinear) {
			const joined = norm(il.words.map((w) => w.w).join(' '));
			const target = byLine.get(il.line);
			if (target === undefined) errors.push(`${f}: interlinear line ${il.line} not in excerpt`);
			else if (joined !== target)
				errors.push(`${f}: interlinear rejoin mismatch at line ${il.line}\n    join: ${joined}\n    line: ${target}`);
			for (const w of il.words) if (!w.gloss) errors.push(`${f}: word '${w.w}' (line ${il.line}) missing gloss`);
		}
	} else if (y.marquee_passage) {
		errors.push(`${f}: marquee stop without interlinear`);
	}

	// tidbits
	if (!y.tidbits?.length || y.tidbits.length < 3) errors.push(`${f}: needs >=3 tidbits (has ${y.tidbits?.length ?? 0})`);
	for (const t of y.tidbits ?? []) if (!t.text || !t.source) errors.push(`${f}: tidbit missing text/source`);

	// art
	if (!y.art?.length) errors.push(`${f}: no art`);
	for (const a of y.art ?? []) {
		for (const field of ['file', 'title', 'artist', 'year', 'license', 'source_url'])
			if (!a[field]) errors.push(`${f}: art missing '${field}'`);
		if (a.file && !existsSync(`static${a.file}`)) errors.push(`${f}: art file missing on disk: static${a.file}`);
		if (a.license && /(NC|ND)/i.test(a.license) && !/licen/i.test('')) {
			if (/\bNC\b|\bND\b|NonCommercial|NoDeriv/i.test(a.license))
				errors.push(`${f}: art licence not allowed: '${a.license}'`);
		}
	}
	if (!y.now_today && y.certainty !== 'mythic') warn.push(`${f}: no now_today`);
}

console.log(`${files.length} stops · ${deepCount} deep · ${interlinearCount} with interlinear`);
if (warn.length) console.log('\nWarnings:\n' + warn.map((w) => '  ~ ' + w).join('\n'));
if (errors.length) {
	console.error('\nFAILURES:\n' + errors.map((e) => '  ✗ ' + e).join('\n'));
	process.exit(1);
}
console.log('\nAll content checks passed.');
