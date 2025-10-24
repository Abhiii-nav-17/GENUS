/**
 * Red List dashboard (renamed from About.tsx)
 * - IUCN Red List themed page showing categories, species and extinct section
 * - component exported as RedList and header highlight targets /red-list
 *
 * Note: This is a direct rename of the previous About.tsx content.
 */

import { TriangleAlert } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// -------------------- Types --------------------
type IUCNStatus = 'EX' | 'EW' | 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'NE' | string;

type SpeciesBrief = {
  scientificName: string;
  commonName?: string;
  status: IUCNStatus;
  region?: string;
  taxon?: string;
  populationEstimate?: string; // human-friendly estimate or 'Unknown'
  bodyStructure?: string;
};

type WikiSummary = {
  extract?: string;
  thumbnail?: { source: string; width?: number; height?: number };
  pageUrl?: string;
};

// -------------------- Config & Seed Data --------------------
// Page-scoped red theme colors (WCAG-checked contrasts where possible)
const THEME = {
	// ...existing properties retained
	// changed: softer faded red background for About page
	background: '#ffe8e8ff',
	card: '#ffffffff',
	// darker red accent (used for text where needed)
	accent: '#b71c1c',
	mutedText: '#5a0303',
	// new: gradient versions for backgrounds and hover states (page-scoped)
	gradientAccent: 'linear-gradient(135deg,#b71c1c 0%, #8f1212 100%)',
	gradientAccentHover: 'linear-gradient(135deg,#8f1212 0%, #6e0f0f 100%)',
};

const STATUS_META: Record<IUCNStatus, { label: string; bg: string; color: string }> = {
  EX: { label: 'Extinct (EX)', bg: '#0b0b0b', color: '#fff' },
  EW: { label: 'Extinct in the Wild (EW)', bg: '#2b0b0b', color: '#fff' },
  CR: { label: 'Critically Endangered (CR)', bg: '#8b0f0f', color: '#fff' },
  EN: { label: 'Endangered (EN)', bg: '#c53030', color: '#fff' },
  VU: { label: 'Vulnerable (VU)', bg: '#f97316', color: '#000' },
  NT: { label: 'Near Threatened (NT)', bg: '#facc15', color: '#000' },
  LC: { label: 'Least Concern (LC)', bg: '#16a34a', color: '#fff' },
  NE: { label: 'Not Evaluated (NE)', bg: '#6b7280', color: '#fff' },
};

// -------------------- Seed species (brief data) --------------------
const SPECIES_LIST: SpeciesBrief[] = [
	{ scientificName: 'Panthera pardus orientalis', commonName: 'Amur Leopard', status: 'CR', region: 'Russian Far East / NE China', taxon: 'Mammalia', populationEstimate: '~100', bodyStructure: 'Large spotted cat adapted to cold forests' },
	{ scientificName: 'Diceros bicornis', commonName: 'Black Rhinoceros', status: 'CR', region: 'Africa', taxon: 'Mammalia', populationEstimate: '~5,000', bodyStructure: 'Large horned browser' },
	{ scientificName: 'Pongo pygmaeus', commonName: 'Bornean Orangutan', status: 'CR', region: 'Borneo', taxon: 'Mammalia', populationEstimate: '~100,000', bodyStructure: 'Long-armed arboreal great ape' },
	{ scientificName: 'Pan troglodytes', commonName: 'Chimpanzee', status: 'EN', region: 'Africa', taxon: 'Mammalia', populationEstimate: '~300,000', bodyStructure: 'Great ape, social, omnivorous' },
	{ scientificName: 'Acinonyx jubatus', commonName: 'Cheetah', status: 'VU', region: 'Africa / Iran', taxon: 'Mammalia', populationEstimate: '~7,000', bodyStructure: 'Slim, built for speed' },
	{ scientificName: 'Cuon alpinus', commonName: 'Dhole', status: 'EN', region: 'Asia', taxon: 'Mammalia', populationEstimate: 'Unknown', bodyStructure: 'Pack-hunting canid' },
	{ scientificName: 'Gavialis gangeticus', commonName: 'Gharial', status: 'CR', region: 'Indian subcontinent', taxon: 'Reptilia', populationEstimate: '~1,000', bodyStructure: 'Long-snouted river crocodilian' },
	{ scientificName: 'Gorilla gorilla', commonName: 'Gorilla', status: 'CR', region: 'Central Africa', taxon: 'Mammalia', populationEstimate: '~100,000 (varies)', bodyStructure: 'Large ape, muscular' },
	{ scientificName: 'Ardeotis nigriceps', commonName: 'Great Indian Bustard', status: 'CR', region: 'India', taxon: 'Aves', populationEstimate: '<500', bodyStructure: 'Large grassland bird' },
	{ scientificName: 'Platanista gangetica', commonName: 'Indus River Dolphin', status: 'EN', region: 'Indus River', taxon: 'Mammalia', populationEstimate: '~1,800', bodyStructure: 'Freshwater toothed dolphin' },
	{ scientificName: 'Lynx pardinus', commonName: 'Iberian Lynx', status: 'EN', region: 'Iberian Peninsula', taxon: 'Mammalia', populationEstimate: '~100-500', bodyStructure: 'Small spotted lynx' },
	{ scientificName: 'Rhinoceros sondaicus', commonName: 'Javan Rhinoceros', status: 'CR', region: 'Java', taxon: 'Mammalia', populationEstimate: '~75', bodyStructure: 'Single-horned browser' },
	{ scientificName: 'Viverra civettina', commonName: 'Malabar Civet', status: 'CR', region: 'India (Kerala)', taxon: 'Mammalia', populationEstimate: 'Very small / uncertain', bodyStructure: 'Small civet-like carnivore' },
	{ scientificName: 'Manis spp.', commonName: 'Pangolin', status: 'CR', region: 'Africa & Asia', taxon: 'Mammalia', populationEstimate: 'Varies by species', bodyStructure: 'Scaled anteater-like' },
	{ scientificName: 'Ursus maritimus', commonName: 'Polar Bear', status: 'VU', region: 'Arctic', taxon: 'Mammalia', populationEstimate: '~26,000', bodyStructure: 'Large ursid adapted to sea ice' },
	{ scientificName: 'Pseudoryx nghetinhensis', commonName: 'Saola', status: 'CR', region: 'Annamite Range', taxon: 'Mammalia', populationEstimate: 'Very few', bodyStructure: 'Secretive bovine-like' },
	{ scientificName: 'Panthera uncia', commonName: 'Snow Leopard', status: 'VU', region: 'Central Asian mountains', taxon: 'Mammalia', populationEstimate: '~4,000-6,000', bodyStructure: 'Thick-furred mountain cat' },
	{ scientificName: 'Elephas maximus sumatranus', commonName: 'Sumatran Elephant', status: 'CR', region: 'Sumatra', taxon: 'Mammalia', populationEstimate: '~2,400', bodyStructure: 'Forest elephant' },
	{ scientificName: 'Panthera tigris', commonName: 'Tiger', status: 'EN', region: 'Asia', taxon: 'Mammalia', populationEstimate: '~3,900', bodyStructure: 'Large striped apex predator' },

	// Added Least Concern and Near Threatened examples:
	{ scientificName: 'Anas platyrhynchos', commonName: 'Mallard', status: 'LC', region: 'Worldwide', taxon: 'Aves', populationEstimate: 'Millions', bodyStructure: 'Dabbling duck, waterfowl' },
	{ scientificName: 'Passer domesticus', commonName: 'House Sparrow', status: 'LC', region: 'Worldwide', taxon: 'Aves', populationEstimate: 'Hundreds of millions', bodyStructure: 'Small seed-eating bird' },
	{ scientificName: 'Lutra lutra', commonName: 'Eurasian Otter', status: 'NT', region: 'Europe, Asia', taxon: 'Mammalia', populationEstimate: 'Recovering populations', bodyStructure: 'Semi-aquatic carnivorous mammal' },
];

/* extinct list (to be shown in extinct section) */
const EXTINCT_LIST: SpeciesBrief[] = [
  { scientificName: 'Smilodon fatalis', commonName: 'Saber-toothed Cat', status: 'EX', region: 'Americas', taxon: 'Mammalia', populationEstimate: 'Extinct' },
  { scientificName: 'Mammuthus primigenius', commonName: 'Woolly Mammoth', status: 'EX', region: 'Arctic/Steppe', taxon: 'Mammalia', populationEstimate: 'Extinct' },
  { scientificName: 'Raphus cucullatus', commonName: 'Dodo', status: 'EX', region: 'Mauritius', taxon: 'Aves', populationEstimate: 'Extinct' },
  { scientificName: 'Thylacinus cynocephalus', commonName: 'Thylacine', status: 'EX', region: 'Tasmania', taxon: 'Mammalia', populationEstimate: 'Extinct' },
  { scientificName: 'Atelopus zeteki', commonName: 'Golden Toad', status: 'EX', region: 'Costa Rica', taxon: 'Amphibia', populationEstimate: 'Extinct' },
  { scientificName: 'Titanoboa cerrejonensis', commonName: 'Titanoboa', status: 'EX', region: 'Paleocene Colombia', taxon: 'Reptilia', populationEstimate: 'Extinct' },
  { scientificName: 'Vasuki indicus', commonName: 'Vasuki Indicus', status: 'EX', region: 'South Asia', taxon: 'Reptilia', populationEstimate: 'Extinct (hypothetical)' },
];

// -------------------- Networking Utilities --------------------
const WIKI_CACHE = new Map<string, WikiSummary>();
async function fetchWikiSummary(titleOrName: string, signal?: AbortSignal): Promise<WikiSummary | null> {
  const key = titleOrName.toLowerCase();
  if (WIKI_CACHE.has(key)) return WIKI_CACHE.get(key)!;
  const controller = new AbortController();
  if (signal) signal.addEventListener('abort', () => controller.abort());
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titleOrName)}`;
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'force-cache' });
    if (!res.ok) return null;
    const json = await res.json();
    const out: WikiSummary = {
      extract: json.extract,
      thumbnail: json.thumbnail ? { source: json.thumbnail.source, width: json.thumbnail.width, height: json.thumbnail.height } : undefined,
      pageUrl: json?.content_urls?.desktop?.page || undefined,
    };
    WIKI_CACHE.set(key, out);
    return out;
  } catch {
    return null;
  }
}

// -------------------- UI Helpers --------------------
const styles = {
	container: { background: THEME.background, minHeight: '100vh', padding: 24, color: THEME.mutedText as string, fontFamily: 'Inter, system-ui, sans-serif' },
	// headerCard: changed to soft white panel with subtle border/shadow for better contrast
	headerCard: { background: 'rgba(255,255,255,0.96)', borderRadius: 12, padding: 18, marginBottom: 18, color: THEME.accent, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 8px 22px rgba(15,23,42,0.04)' },
	sectionTitle: { color: THEME.accent, fontSize: 20, margin: '8px 0' },
	grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 12 },
	speciesCard: { background: THEME.card, borderRadius: 10, padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start' },
	imageBox: { width: 160, minWidth: 120, height: 110, borderRadius: 8, overflow: 'hidden', background: '#fff1f1' },
	badge: (bg: string, color: string) => ({ background: bg, color, padding: '6px 10px', borderRadius: 999, fontWeight: 700 }),
	legendRow: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
	ctaBox: { background: THEME.gradientAccent, color: '#fff', padding: 18, borderRadius: 10, textAlign: 'center' },

	// Override/mutate stat block style to be wider red blocks with white centered text
	// styles adjustments: statBlock updated for card-like hover effects
	// stat blocks laid out in one row with horizontal scrolling
	statsGrid: { display: 'flex', gap: 12, flexWrap: 'nowrap' as const, justifyContent: 'center', marginTop: 12, overflowX: 'auto', padding: '8px 4px' },
	statBlock: {
		width: 240,
		height: 170,
		// use gradient for the block background (falls back to solid accent where appropriate)
		background: THEME.gradientAccent,
		color: '#fff',
		borderRadius: 12,
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: 800,
		textAlign: 'center' as const,
		padding: 12,
		boxSizing: 'border-box' as const,
		transition: 'transform 200ms ease, box-shadow 200ms ease, background 200ms ease',
		// added subtle default shadow so blocks look like cards even when not hovered
		boxShadow: '0 8px 18px rgba(183,28,28,0.08)',
	},
	// card grid: rectangular collapsible cards
	speciesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(520px,1fr))', gap: 12 },
	cardRect: { background: THEME.card, borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column' as const, gap: 8 },
	cardHeaderRow: { display: 'flex', gap: 12, alignItems: 'center' },
	cardMetaRow: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 },

	// changed: remove fixed minHeight so extinct cards size like other cards
	// new grid for extinct section: exactly two cards per row on wider viewports
	extinctGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
	// larger/taller extinct card rectangle — removed minHeight so it matches other cards
	extinctCardRect: { background: '#373737ff', color: '#fff', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column' as const, gap: 10 },
};

/* ---------------------------
   Image component with robust fallback
   --------------------------- */
const RobustImage: React.FC<{ src?: string; alt: string; style?: React.CSSProperties }> = ({ src, alt, style }) => {
	const [errored, setErrored] = useState(false);
	const [loaded, setLoaded] = useState(false);
	// When image fails, show SVG placeholder with name
	const placeholder = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='360'><rect fill='${THEME.background}' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='${THEME.accent}' font-family='Arial' font-size='20'>${alt}</text></svg>`)}`;
	if (!src || errored) {
		return <img src={placeholder} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />;
	}
	return (
		<img
			src={src}
			alt={alt}
			loading="lazy"
			onLoad={() => setLoaded(true)}
			onError={() => setErrored(true)}
			style={{ width: '100%', height: '100%', objectFit: 'cover', display: loaded ? 'block' : 'none', ...style }}
		/>
	);
};

/* ---------------------------
   Components: CategoryLegend, ThreatStats, SpeciesCard, ExtinctSection
   --------------------------- */

// -------------------- Category cards: expandable, hover-to-expand --------------------

// utility: darken a hex color by a fraction (simple, safe)
function darkenHex(hex: string, amount = 0.2) {
	// support short and full hex
	const h = hex.replace('#', '');
	const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
	const num = parseInt(full, 16);
	let r = (num >> 16) & 0xff;
	let g = (num >> 8) & 0xff;
	let b = num & 0xff;
	const clamp = (v: number) => Math.max(0, Math.min(255, Math.floor(v * (1 - amount))));
	r = clamp(r); g = clamp(g); b = clamp(b);
	const toHex = (v: number) => v.toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ordered categories as requested
const CATEGORY_ORDER: IUCNStatus[] = ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'NE'];

// human-friendly details per category (short)
const CATEGORY_DETAILS: Record<IUCNStatus, { title: string; description: string; examples: string[] }> = {
	EX: {
		title: '',
		description: 'No reasonable doubt that the last individual has died. Known from historical or fossil record.',
		examples: ['Dodo', 'Thylacine', 'Woolly Mammoth'],
	},
	EW: {
		title: '',
		description: 'Known only to survive in cultivation, captivity or as a naturalized population outside its historic range.',
		examples: ['Spix\'s Macaw (in captive breeding programs)'],
	},
	CR: {
		title: '',
		description: 'Extremely high risk of extinction in the wild — very small population, rapid declines, or very restricted range.',
		examples: ['Amur Leopard', 'Javan Rhinoceros'],
	},
	EN: {
		title: '',
		description: 'High risk of extinction in the wild — substantial declines or restricted populations.',
		examples: ['Tiger', 'Chimpanzee'],
	},
	VU: {
		title: '',
		description: 'High risk of endangerment in the medium term — declining population or limited area of occupancy.',
		examples: ['Cheetah', 'Polar Bear'],
	},
	NT: {
		title: '',
		description: 'Close to qualifying for a threatened category in the near future — requires monitoring and potential action.',
		examples: ['Eurasian Otter'],
	},
	LC: {
		title: '',
		description: 'Widespread and abundant after assessment — low immediate risk of extinction.',
		examples: ['Mallard', 'House Sparrow'],
	},
	NE: {
		title: '',
		description: 'Species not yet evaluated against the IUCN criteria — data gap; potential priority for assessment.',
		examples: ['Many invertebrates & poorly-known taxa'],
	},
};

// CategoryCard: expands on hover/focus, collapses on leave/blur; converts to gradient when expanded
const CategoryCard: React.FC<{ status: IUCNStatus }> = ({ status }) => {
	const meta = STATUS_META[status] || { label: status, bg: '#777', color: '#fff' };
	const details = CATEGORY_DETAILS[status] || { title: status, description: '', examples: [] };

	const [expanded, setExpanded] = useState(false);
	const [hover, setHover] = useState(false);

	// gradient using meta.bg and a darker stop
	const dark = darkenHex(meta.bg, 0.18);
	const gradient = `linear-gradient(135deg, ${meta.bg} 0%, ${dark} 100%)`;

	const baseStyle: React.CSSProperties = {
		borderRadius: 10,
		padding: 12,
		minHeight: 96,
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		transition: 'transform 180ms ease, box-shadow 180ms ease, background 220ms ease',
		boxShadow: hover ? '0 18px 40px rgba(0,0,0,0.18)' : '0 6px 18px rgba(0,0,0,0.06)',
		transform: hover ? 'translateY(-6px)' : 'translateY(0)',
		cursor: 'pointer',
		background: expanded ? gradient : '#fff',
		color: expanded ? meta.color : THEME.mutedText,
		border: expanded ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
		overflow: 'hidden',
	};

	const titleStyle: React.CSSProperties = { fontWeight: 800, fontSize: 15, margin: 0, color: expanded ? '#fff' : THEME.accent };
	const badgeStyle: React.CSSProperties = { padding: '6px 8px', borderRadius: 999, fontWeight: 700, background: meta.bg, color: meta.color };

	return (
		<article
			role="group"
			aria-labelledby={`cat-${status}`}
			onMouseEnter={() => { setHover(true); setExpanded(true); }}
			onMouseLeave={() => { setHover(false); setExpanded(false); }}
			onFocus={() => { setHover(true); setExpanded(true); }}
			onBlur={() => { setHover(false); setExpanded(false); }}
			tabIndex={0}
			style={baseStyle}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
				<span style={badgeStyle}>{meta.label}</span>
				<h3 id={`cat-${status}`} style={titleStyle}>{details.title}</h3>
				<div style={{ marginLeft: 'auto', fontWeight: 800, color: expanded ? '#fff' : THEME.mutedText }}>{status}</div>
			</div>

			{expanded && (
				<div style={{ marginTop: 10, lineHeight: 1.3 }}>
					<p style={{ margin: '6px 0', color: expanded ? 'rgba(255,255,255,0.95)' : THEME.mutedText }}>{details.description}</p>
					{details.examples.length > 0 && (
						<div style={{ marginTop: 8 }}>
							<strong style={{ color: expanded ? '#fff' : THEME.mutedText }}>Examples: </strong>
							<span style={{ color: expanded ? 'rgba(255,255,255,0.95)' : THEME.mutedText }}>{details.examples.join(', ')}</span>
						</div>
					)}
				</div>
			)}
		</article>
	);
};

// CategoryLegend now renders the ordered, expandable cards in a responsive grid
const CategoryLegend: React.FC = () => {
	return (
		<div role="list" aria-label="IUCN categories" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
			{CATEGORY_ORDER.map(s => (
				<div key={s} role="listitem">
					<CategoryCard status={s} />
				</div>
			))}
		</div>
	);
};

// Replace ThreatStats component with hoverable, centered blocks
// ThreatStats: dynamic hover style now uses gradient hover
const ThreatStats: React.FC = () => {
	const stats = useMemo(
		() => [
			{ label: 'Amphibians threatened', pct: '41%' },
			{ label: 'Conifers threatened', pct: '54%' },
			{ label: 'Sharks & rays threatened', pct: '37%' },
			{ label: 'Reef corals threatened', pct: '33%' },
			{ label: 'Mammals threatened', pct: '25%' },
			{ label: 'Birds threatened', pct: '14%' },
			{ label: 'Cycads threatened', pct: '60%' },
		],
		[]
	);

	const [hovered, setHovered] = useState<number | null>(null);

	return (
		<div style={styles.statsGrid} role="list" aria-hidden>
			{stats.map((s, i) => {
				const isHovered = hovered === i;
				const dynamicStyle: React.CSSProperties = {
					...styles.statBlock,
					background: isHovered ? THEME.gradientAccentHover : THEME.gradientAccent,
					transform: isHovered ? 'translateY(-10px) scale(1.06)' : 'translateY(0) scale(1)',
					boxShadow: isHovered ? '0 28px 60px rgba(183,28,28,0.22)' : styles.statBlock.boxShadow,
					cursor: 'pointer',
				};
				return (
					<div
						key={s.label}
						role="listitem"
						style={dynamicStyle}
						onMouseEnter={() => setHovered(i)}
						onMouseLeave={() => setHovered(null)}
					>
						<div style={{ fontSize: 28, lineHeight: 1 }}>{s.pct}</div>
						<div style={{ fontSize: 13, marginTop: 8 }}>{s.label}</div>
					</div>
				);
			})}
		</div>
	);
};

// Replace SpeciesCard component with hover + button-hover + expanded styles
const SpeciesCard: React.FC<{ brief: SpeciesBrief }> = ({ brief }) => {
  const [wiki, setWiki] = useState<WikiSummary | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchWikiSummary(brief.scientificName).then(r => { if (mounted) setWiki(r); }).catch(() => {}).finally(() => { mounted = false; });
  }, [brief.scientificName]);

  const imgSrc = wiki?.thumbnail?.source;
  const statusMeta = STATUS_META[brief.status] || { label: brief.status, bg: '#777', color: '#fff' };

  const cardStyle: React.CSSProperties = {
    ...styles.cardRect,
    boxShadow: hover ? '0 12px 30px rgba(127,29,29,0.12)' : '0 2px 6px rgba(0,0,0,0.04)',
    transform: hover ? 'translateY(-6px)' : 'translateY(0)',
    transition: 'transform 180ms ease, box-shadow 180ms ease',
    cursor: 'pointer',
  };

  // viewBtnStyle declaration inside SpeciesCard with:
  const viewBtnStyle: React.CSSProperties = {
	padding: '8px 12px',
	borderRadius: 8,
	border: 'none',
	// hover color changed to a darker related red
	background: btnHover ? '#b71c1c' : THEME.accent,
	color: '#fff',
	transition: 'background 140ms ease, transform 120ms ease, box-shadow 120ms ease',
	transform: btnHover ? 'translateY(-2px)' : 'none',
	boxShadow: btnHover ? '0 6px 14px rgba(183,28,28,0.24)' : 'none',
};

  return (
    <article
      style={cardStyle}
      aria-labelledby={`title-${brief.scientificName}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setBtnHover(false); }}
    >
      {/* Header row: image + basic info */}
      <div style={styles.cardHeaderRow}>
        <div style={styles.imageBox}><RobustImage src={imgSrc} alt={brief.commonName ?? brief.scientificName} style={{ width: '100%', height: '100%' }} /></div>

        <div style={{ flex: 1 }}>
          <h3 id={`title-${brief.scientificName}`} style={{ margin: 0, color: THEME.accent }}>{brief.commonName}</h3>
          <div style={{ fontSize: 13, fontStyle: 'italic', color: THEME.mutedText }}>{brief.scientificName}</div>

          <div style={styles.cardMetaRow}>
            <span style={styles.badge(statusMeta.bg, statusMeta.color)}>{statusMeta.label}</span>
            <div style={{ color: THEME.mutedText }}>{brief.region ?? 'Global'}</div>
            <div style={{ marginLeft: 'auto', color: THEME.mutedText, fontWeight: 700 }}>{brief.populationEstimate ?? 'Unknown'}</div>
          </div>
        </div>
      </div>

      {/* Collapsed details button */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setExpanded(x => !x)}
          aria-expanded={expanded}
          style={viewBtnStyle}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
        >
          {expanded ? 'Hide details' : 'View details'}
        </button>

        {wiki?.pageUrl && (
          <a
            href={wiki.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', color: THEME.mutedText, textDecoration: 'none', alignSelf: 'center' }}
          >
            Wikipedia
          </a>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div id={`panel-${brief.scientificName}`} role="region" aria-hidden={!expanded} style={{ marginTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12 }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: THEME.accent }}>Overview</h4>
              <p style={{ marginTop: 0 }}>{wiki?.extract ?? 'Summary unavailable. Threats and population estimates are approximations from public sources.'}</p>

              <h4 style={{ marginTop: 10, color: THEME.accent }}>Major threats</h4>
              <ul>
                <li>Habitat loss and degradation</li>
                <li>Illegal hunting / trade where applicable</li>
                <li>Human-wildlife conflict and infrastructure</li>
              </ul>

              <h4 style={{ marginTop: 10, color: THEME.accent }}>Conservation steps</h4>
              <ol>
                <li>Protect and restore habitat (protected areas, corridors).</li>
                <li>Strengthen anti-poaching and law enforcement.</li>
                <li>Support community-based conservation and sustainable livelihoods.</li>
                <li>Monitor populations and fund species recovery programs.</li>
              </ol>
            </div>

            <aside>
              <div style={{ background: '#fff7f7', padding: 8, borderRadius: 8 }}>
                <div style={{ fontWeight: 800, color: THEME.accent }}>Location & Topography</div>
                <div style={{ marginTop: 6 }}>{brief.region ?? 'Various'}</div>
                <div style={{ marginTop: 8, fontWeight: 700 }}>Population</div>
                <div style={{ marginTop: 6 }}>{brief.populationEstimate ?? 'Unknown'}</div>
                <div style={{ marginTop: 10 }}>
                  <strong>Body structure</strong>
                  <div style={{ marginTop: 6 }}>{brief.bodyStructure ?? '—'}</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </article>
  );
};

// Replace ExtinctCard with collapsible dark-themed rectangular card (no population shown)
// (This replaces the previous ExtinctCard definition.)
const ExtinctCard: React.FC<{ brief: SpeciesBrief }> = ({ brief }) => {
  const [wiki, setWiki] = useState<WikiSummary | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hover, setHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchWikiSummary(brief.scientificName).then(r => { if (mounted) setWiki(r); }).catch(() => {}).finally(() => { mounted = false; });
  }, [brief.scientificName]);

  const imgSrc = wiki?.thumbnail?.source;

  // base card style with hover lift (consistent with living cards), but use the larger extinctCardRect
  const cardStyle: React.CSSProperties = {
    ...styles.extinctCardRect,
    boxShadow: hover ? '0 18px 36px rgba(0,0,0,0.45)' : '0 3px 8px rgba(0,0,0,0.08)',
    transform: hover ? 'translateY(-8px)' : 'translateY(0)',
    transition: 'transform 180ms ease, box-shadow 180ms ease',
    cursor: 'pointer',
  };

  const viewBtnStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    background: btnHover ? '#333' : '#000',
    color: '#fff',
    transition: 'background 120ms ease, transform 120ms ease',
    transform: btnHover ? 'translateY(-2px)' : 'none',
  };

  return (
    <article
      style={cardStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setBtnHover(false); }}
      aria-labelledby={`ex-${brief.scientificName}`}
    >
      <div style={styles.cardHeaderRow}>
        <div style={{ ...styles.imageBox, background: '#000000ff' }}>
          <RobustImage src={imgSrc} alt={brief.commonName ?? brief.scientificName} style={{ width: '100%', height: '100%' }} />
        </div>

        <div style={{ flex: 1 }}>
          <h3 id={`ex-${brief.scientificName}`} style={{ margin: 0 }}>{brief.commonName}</h3>
          <div style={{ fontSize: 13, fontStyle: 'italic', marginBottom: 8, color: '#ddd' }}>{brief.scientificName}</div>
          <div style={styles.cardMetaRow}>
            <span style={{ background: '#000', color: '#fff', padding: '6px 10px', borderRadius: 999, fontWeight: 700 }}>Extinct (EX)</span>
            <div style={{ color: '#fff' }}>{brief.region}</div>
            {/* Population intentionally removed for extinct cards per request */}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => setExpanded(x => !x)}
          aria-expanded={expanded}
          style={viewBtnStyle}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
        >
          {expanded ? 'Hide details' : 'View details'}
        </button>

        {wiki?.pageUrl && <a href={wiki.pageUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', borderRadius: 8, background: '#222', color: '#fff', textDecoration: 'none' }}>Wikipedia</a>}
      </div>

      {expanded && (
        <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 12 }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#fff' }}>Why extinct</h4>
              <p style={{ marginTop: 0, color: '#ffdede' }}>{wiki?.extract ?? 'Causes vary: climate change, human hunting, invasive species, habitat loss.'}</p>
              <h4 style={{ marginTop: 10, color: '#fff' }}>Context</h4>
              <p style={{ color: '#ffdede' }}>Fossil reconstructions and historical records document the species' past distribution and likely drivers of extinction.</p>
            </div>

            <aside>
              <div style={{ background: '#000', padding: 10, borderRadius: 8 }}>
                <div style={{ fontWeight: 800, color: '#ffdede' }}>Topography & Location</div>
                <div style={{ marginTop: 6, color: '#fff' }}>{brief.region}</div>
                {/* Removed population lines entirely here as requested */}
                <div style={{ marginTop: 10 }}>
                  <strong style={{ color: '#ffdede' }}>Notes</strong>
                  <div style={{ marginTop: 6, color: '#fff' }}>{brief.bodyStructure ?? '—'}</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </article>
  );
};

/* ---------------------------
   Page layout (Introduction -> Categories -> Species -> Extinct -> CTA)
   --------------------------- */

const RedList: React.FC = () => {
	// Add page-scoped styling for the top navigation "Red List" button while this page is mounted
	useEffect(() => {
		// target common link form used in Layout.tsx
		const redListLink = document.querySelector('a[href="/red-list"]') as HTMLElement | null;
		if (!redListLink) return;

		const original = {
			background: redListLink.style.backgroundColor || '',
			color: redListLink.style.color || '',
			padding: redListLink.style.padding || '',
			borderRadius: redListLink.style.borderRadius || '',
			transition: redListLink.style.transition || '',
			transform: redListLink.style.transform || '',
		};

		const base = THEME.accent;        // soft red (page theme)
		const hover = '#eb0000ff';       // slightly darker hover shade

		redListLink.style.backgroundColor = base;
		redListLink.style.color = '#fff';
		redListLink.style.padding = redListLink.style.padding || '6px 10px';
		redListLink.style.borderRadius = '12px';
		redListLink.style.transition = 'background 180ms ease, transform 140ms ease, box-shadow 140ms ease';
		redListLink.style.transform = 'none';

		const onEnter = () => {
			redListLink.style.backgroundColor = hover;
			redListLink.style.transform = 'translateY(-2px)';
			redListLink.style.boxShadow = '0 10px 24px rgba(143,18,18,0.16)';
		};
		const onLeave = () => {
			redListLink.style.backgroundColor = base;
			redListLink.style.transform = 'none';
			redListLink.style.boxShadow = 'none';
		};

		redListLink.addEventListener('mouseenter', onEnter);
		redListLink.addEventListener('mouseleave', onLeave);

		// -------------------------
		// Footer: apply page-local red theme overrides while on Red-List page
		// -------------------------
		const footer = document.querySelector('footer[aria-label="Site footer"]') as HTMLElement | null;

		// storage for original inline styles so we can restore on cleanup
		const anchorOriginals = new Map<HTMLElement, string>();
		const buttonOriginals = new Map<HTMLElement, { background: string; color: string }>();
		const selectOriginals = new Map<HTMLElement, { background: string; color: string }>();
		let footerOriginalBackground = '';

		if (footer) {
			footerOriginalBackground = footer.style.background || '';

			// anchors: skip partner logo links (contain <img>)
			const anchors = Array.from(footer.querySelectorAll<HTMLAnchorElement>('a'));
			anchors.forEach((a) => {
				anchorOriginals.set(a, a.style.color || '');
				if (!a.querySelector('img')) {
					// text links -> red accent
					a.style.color = THEME.accent;
				}
			});

			// buttons -> apply red gradient for primary controls (newsletter subscribe etc.)
			const buttons = Array.from(footer.querySelectorAll<HTMLButtonElement>('button'));
			buttons.forEach((b) => {
				buttonOriginals.set(b, { background: b.style.background || '', color: b.style.color || '' });
				// apply red gradient and white text
				b.style.background = THEME.gradientAccent;
				b.style.color = '#fff';
			});

			// selects (language) - subtle red tint
			const selects = Array.from(footer.querySelectorAll<HTMLSelectElement>('select'));
			selects.forEach((s) => {
				selectOriginals.set(s, { background: s.style.background || '', color: s.style.color || '' });
				s.style.background = 'linear-gradient(90deg,#fdecea,#ffdede)';
				s.style.color = THEME.accent;
			});

			// optionally adjust footer background tint if needed (light red wash)
			footer.style.background = 'linear-gradient(180deg,#fff4f4,#fff0f0)';
		}

		return () => {
			// restore nav link
			redListLink.removeEventListener('mouseenter', onEnter);
			redListLink.removeEventListener('mouseleave', onLeave);
			redListLink.style.backgroundColor = original.background;
			redListLink.style.color = original.color;
			redListLink.style.padding = original.padding;
			redListLink.style.borderRadius = original.borderRadius;
			redListLink.style.transition = original.transition;
			redListLink.style.transform = original.transform;
			redListLink.style.boxShadow = '';

			// restore footer inline styles
			if (footer) {
				footer.style.background = footerOriginalBackground;
				anchorOriginals.forEach((color, el) => {
					el.style.color = color || '';
				});
				buttonOriginals.forEach((orig, el) => {
					el.style.background = orig.background || '';
					el.style.color = orig.color || '';
				});
				selectOriginals.forEach((orig, el) => {
					el.style.background = orig.background || '';
					el.style.color = orig.color || '';
				});
			}
		};
	}, []);

	return (
		<main style={styles.container}>
			<div style={styles.headerCard} aria-labelledby="intro-title">
      
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          {/* changed: use THEME.accent for the icon color and explicit size */}
          <TriangleAlert size={40} color={THEME.accent} />
          <strong color={THEME.accent}>Red List — Threatened Species</strong>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto" style={{ marginTop: 8, color: THEME.mutedText, textAlign: 'center' }}>
          The IUCN Red List assesses the conservation status of species worldwide.
					Over <strong>47,000+</strong> species are threatened (≈ <strong>28%</strong> of assessed species).
        </p>
      </div>

				

				{/* Red square data blocks */}
				<div style={styles.statsGrid} aria-hidden>
					<div style={styles.statBlock}><div style={{ fontSize: 40 }}>41%</div><div style={{ fontSize: 12, marginTop: 6 }}>Amphibians threatened</div></div>
					<div style={styles.statBlock}><div style={{ fontSize: 40 }}>54%</div><div style={{ fontSize: 12, marginTop: 6 }}>Conifers threatened</div></div>
					<div style={styles.statBlock}><div style={{ fontSize: 40 }}>37%</div><div style={{ fontSize: 12, marginTop: 6 }}>Sharks & rays threatened</div></div>
					<div style={styles.statBlock}><div style={{ fontSize: 40 }}>33%</div><div style={{ fontSize: 12, marginTop: 6 }}>Reef corals threatened</div></div>
					<div style={styles.statBlock}><div style={{ fontSize: 40 }}>25%</div><div style={{ fontSize: 12, marginTop: 6 }}>Mammals threatened</div></div>
					<div style={styles.statBlock}><div style={{ fontSize: 40 }}>14%</div><div style={{ fontSize: 12, marginTop: 6 }}>Birds threatened</div></div>
					<div style={styles.statBlock}><div style={{ fontSize: 40 }}>60%</div><div style={{ fontSize: 12, marginTop: 6 }}>Cycads threatened</div></div>
				</div>
			</div>

			<section aria-labelledby="categories-title" style={{ marginBottom: 18 }}>
				<h2 id="categories-title" style={styles.sectionTitle}>Species Categories</h2>
				<CategoryLegend />
			</section>

			<section aria-labelledby="species-title" style={{ marginBottom: 18 }}>
				<h2 id="species-title" style={styles.sectionTitle}>Species Details</h2>
				<div style={styles.speciesGrid} role="list">
					{SPECIES_LIST.map((s) => (
						<div role="listitem" key={s.scientificName}>
							<SpeciesCard brief={s} />
						</div>
					))}
				</div>
			</section>

			<section aria-labelledby="extinct-title" style={{ marginBottom: 18 }}>
				<h2 id="extinct-title" style={{ ...styles.sectionTitle, color: '#000' }}>Extinct Species (EX)</h2>
				<div style={styles.extinctGrid}>
					{EXTINCT_LIST.map(e => (
						<div key={e.scientificName}><ExtinctCard brief={e} /></div>
					))}
				</div>
			</section>

			<section aria-labelledby="action-title">
				<div style={styles.ctaBox}>
					<h3 id="action-title" style={{ marginTop: 0 }}>Take Action</h3>
					<p style={{ maxWidth: 720, margin: '0 auto 12px' }}>
						You can help: support conservation organizations, reduce habitat impact, advocate for protected areas, report wildlife crime, and support sustainable policies. Small actions add up.
					</p>
					<div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
						<a href="https://www.iucn.org/" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 16px', background: '#fff', color: THEME.accent, borderRadius: 8, textDecoration: 'none' }}>Learn about IUCN</a>
						<a href="https://www.worldwildlife.org/" target="_blank" rel="noopener noreferrer" style={{ padding: '10px 16px', background: '#fff', color: THEME.accent, borderRadius: 8, textDecoration: 'none' }}>Support Conservation</a>
					</div>
				</div>
			</section>
		</main>
	);
};

/* ---------------------------
   Utility: debounced hook
   --------------------------- */
function useDebounce<T>(value: T, delay = 300) {
	const [v, setV] = useState<T>(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return v;
}

export default RedList;