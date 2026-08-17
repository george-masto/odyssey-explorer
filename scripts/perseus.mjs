// Extract exact text from the vendored Perseus TEI editions (sources/perseus/).
//
//   node scripts/perseus.mjs grc <book> <from> [to]     Greek lines (perseus-grc2, Murray's 1919 Loeb text)
//   node scripts/perseus.mjs eng <book> <line>          Murray 1919 English card containing that line (perseus-eng3)
//   node scripts/perseus.mjs butler <book> <line>       Butler card (perseus-eng4)
//
// This is the single source of truth for every Greek excerpt in content/stops/
// — never type Greek from memory. (Perseus texts: CC BY-SA 4.0, credited in the colophon.)

import { readFileSync } from 'node:fs';

const [mode, bookArg, fromArg, toArg] = process.argv.slice(2);
const book = Number(bookArg);
const from = Number(fromArg);
const to = toArg ? Number(toArg) : from;

if (!mode || !book || !from) {
	console.error('usage: perseus.mjs grc|eng|butler <book> <from> [to]');
	process.exit(1);
}

const FILES = {
	grc: 'sources/perseus/perseus-grc2.xml',
	eng: 'sources/perseus/perseus-eng3.xml',
	butler: 'sources/perseus/perseus-eng4.xml'
};

function bookSlice(xml, n) {
	// Attribute order varies between editions — match any div that carries
	// subtype="book" and n="<book>" in either order.
	const open = new RegExp(
		`<div(?=[^>]*subtype="book")(?=[^>]*n="${n}")[^>]*>`
	).exec(xml);
	if (!open) throw new Error(`book ${n} not found`);
	const start = open.index;
	const nextRe = new RegExp(`<div(?=[^>]*subtype="book")[^>]*>`, 'g');
	nextRe.lastIndex = start + open[0].length;
	const next = nextRe.exec(xml);
	return xml.slice(start, next ? next.index : undefined);
}

function clean(s) {
	return s
		.replace(/<note[^>]*>[\s\S]*?<\/note>/g, '')
		.replace(/<[^>]+>/g, '')
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();
}

const xml = readFileSync(FILES[mode], 'utf8');
const slice = bookSlice(xml, book);

if (mode === 'grc') {
	const re = /<l n="(\d+)"[^>]*>([\s\S]*?)(?=<l n="|<\/div>)/g;
	let m;
	const lines = new Map();
	while ((m = re.exec(slice))) lines.set(Number(m[1]), clean(m[2]));
	for (let n = from; n <= to; n++) {
		if (!lines.has(n)) throw new Error(`line ${book}.${n} not found`);
		console.log(`${n}\t${lines.get(n)}`);
	}
} else {
	// English prose is chunked into cards keyed by starting line; print the card
	// covering the requested line plus the next card boundary for context.
	const re = /<div type="textpart" subtype="card" n="(\d+)">([\s\S]*?)(?=<div type="textpart" subtype="card" n="|<\/div>\s*<\/div>)/g;
	let m;
	const cards = [];
	while ((m = re.exec(slice))) cards.push({ n: Number(m[1]), text: clean(m[2]) });
	cards.sort((a, b) => a.n - b.n);
	const idx = cards.findIndex((c, i) => c.n <= from && (i === cards.length - 1 || cards[i + 1].n > from));
	if (idx === -1) throw new Error(`no card covering ${book}.${from}`);
	console.log(`[card ${cards[idx].n}] ${cards[idx].text}`);
}
