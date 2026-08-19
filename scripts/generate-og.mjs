// Generate OG social-preview cards (1200×630) — one per stop + the site card.
//
//   node scripts/generate-og.mjs
//
// Per-stop card: dark wine-sea text panel (title, Greek, summary, crew) with the
// stop's actual artwork bleeding in from the right through a gradient.
// Site card: the trireme on parchment.
//
// Text is rendered via SVG → sharp/librsvg with system fonts (Georgia), so run
// on macOS and COMMIT the PNGs in static/og/ — CI does not regenerate them.

import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { parse } from 'yaml';

const W = 1200;
const H = 630;
const ART_X = 660; // art occupies the right 540px
const OUT = 'static/og';

const stops = readdirSync('content/stops')
	.filter((f) => f.endsWith('.md'))
	.map((f) => parse(/^---\n([\s\S]*?)\n---/.exec(readFileSync(`content/stops/${f}`, 'utf8'))[1]))
	.sort((a, b) => a.seq - b.seq);

const esc = (s) =>
	String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text, max, maxLines) {
	const words = text.split(' ');
	const lines = [];
	let line = '';
	for (const word of words) {
		if ((line + ' ' + word).trim().length > max) {
			lines.push(line.trim());
			line = word;
			if (lines.length === maxLines) {
				lines[maxLines - 1] = lines[maxLines - 1].replace(/[,.;·—]?$/, '…');
				return lines;
			}
		} else {
			line = (line + ' ' + word).trim();
		}
	}
	if (line) lines.push(line);
	return lines;
}

const triremePaths = /<g[\s\S]*<\/g>/.exec(readFileSync('src/lib/map/trireme.svg', 'utf8'))[0];

function frame(stroke = '#c9a227') {
	return `
		<rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${stroke}" stroke-width="2.5" opacity="0.9"/>
		<rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="${stroke}" stroke-width="1" opacity="0.55"/>`;
}

function stopTextSvg(stop) {
	const titleLines = wrap(stop.title, 20, 2);
	const titleSpans = titleLines
		.map((l, i) => `<tspan x="56" dy="${i === 0 ? 0 : 62}">${esc(l)}</tspan>`)
		.join('');
	const titleY = 235;
	const afterTitle = titleY + (titleLines.length - 1) * 62;
	const summarySpans = wrap(stop.summary, 44, 4)
		.map((l, i) => `<tspan x="56" dy="${i === 0 ? 0 : 36}">${esc(l)}</tspan>`)
		.join('');
	const crew = stop.crew.lost_here > 0
		? `⚓ ${stop.crew.remaining} companions remain · ${stop.crew.lost_here} lost here`
		: `⚓ ${stop.crew.remaining} companions remain`;
	return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stop-color="#0c1b2e" stop-opacity="1"/>
				<stop offset="1" stop-color="#0c1b2e" stop-opacity="0"/>
			</linearGradient>
		</defs>
		<rect x="${ART_X}" y="0" width="230" height="${H}" fill="url(#fade)"/>
		${frame()}
		<text x="56" y="96" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="7" fill="#c9a227">ODYSSEY EXPLORER</text>
		<text x="56" y="146" font-family="Helvetica, Arial, sans-serif" font-size="19" letter-spacing="3" fill="#8d99a8">LANDFALL ${stop.seq} OF 17</text>
		<text x="56" y="${titleY}" font-family="Georgia, serif" font-size="56" font-weight="700" fill="#eee9db">${titleSpans}</text>
		<text x="56" y="${afterTitle + 58}" font-family="Georgia, serif" font-size="33" font-style="italic" fill="#c9a227">${esc(stop.ancient.grc)}</text>
		<text x="56" y="${afterTitle + 122}" font-family="Georgia, serif" font-size="25" fill="#b4aca0">${summarySpans}</text>
		<text x="56" y="556" font-family="Helvetica, Arial, sans-serif" font-size="19" fill="#7f8b9a">${esc(crew)}</text>
		<text x="56" y="592" font-family="Helvetica, Arial, sans-serif" font-size="18" letter-spacing="1.5" fill="#c9a227">georgemasto.com/odyssey</text>
	</svg>`);
}

async function stopCard(stop) {
	const art = stop.art?.[0];
	const base = sharp({ create: { width: W, height: H, channels: 4, background: '#0c1b2e' } });
	const layers = [];
	if (art) {
		const artBuf = await sharp(`static${art.file}`)
			.resize(W - ART_X, H, { fit: 'cover', position: 'attention' })
			.modulate({ brightness: 0.94 })
			.toBuffer();
		layers.push({ input: artBuf, left: ART_X, top: 0 });
	}
	layers.push({ input: stopTextSvg(stop), left: 0, top: 0 });
	await base.composite(layers).png({ quality: 90 }).toFile(`${OUT}/${stop.id}.png`);
}

async function siteCard() {
	// Full-bleed Turner — the most epic Odyssey painting there is — with the
	// title rising out of a dark gradient. Distinct from the stop cards.
	const turner = stops.find((s) => s.id === 'cyclopes')?.art?.[0]?.file;
	if (!turner) throw new Error('cyclopes art missing for the site card');
	const artBuf = await sharp(`static${turner}`)
		.resize(W, H, { fit: 'cover', position: 'attention' })
		.toBuffer();
	const overlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<linearGradient id="dusk" x1="0" y1="1" x2="0" y2="0">
				<stop offset="0" stop-color="#060c16" stop-opacity="0.94"/>
				<stop offset="0.42" stop-color="#060c16" stop-opacity="0.55"/>
				<stop offset="0.75" stop-color="#060c16" stop-opacity="0"/>
			</linearGradient>
		</defs>
		<rect width="${W}" height="${H}" fill="url(#dusk)"/>
		${frame()}
		<g transform="translate(1016,44) scale(2.3)">${triremePaths}</g>
		<text x="56" y="490" font-family="Georgia, serif" font-size="84" font-weight="700" fill="#f3edde">ODYSSEY EXPLORER</text>
		<text x="56" y="543" font-family="Georgia, serif" font-size="27" font-style="italic" fill="#e9c65a">Sail the ten-year voyage home — the Greek, the real places, the art</text>
		<text x="56" y="590" font-family="Helvetica, Arial, sans-serif" font-size="19" letter-spacing="2" fill="#c9a227">georgemasto.com/odyssey</text>
		<text x="1144" y="608" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#ffffff" fill-opacity="0.55">J.M.W. Turner, Ulysses Deriding Polyphemus, 1829</text>
	</svg>`);
	await sharp({ create: { width: W, height: H, channels: 4, background: '#060c16' } })
		.composite([
			{ input: artBuf, left: 0, top: 0 },
			{ input: overlay, left: 0, top: 0 }
		])
		.png({ quality: 90 })
		.toFile(`${OUT}/site.png`);
}

mkdirSync(OUT, { recursive: true });
await siteCard();
for (const stop of stops) {
	await stopCard(stop);
	process.stdout.write(`${stop.id} `);
}
console.log(`\n${stops.length + 1} cards → ${OUT}/`);
