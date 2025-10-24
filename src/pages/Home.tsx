import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, BarChart3, Microscope, Leaf, Shield, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/IMG-20250914-WA0002.jpg';
import { useState as useReactState } from 'react';

// Page theme variables (lighter button/text theme for the whole page)
const PAGE_THEME = {
  root: {
    // CSS custom properties (cast for TS)
    // these are intentionally lightweight, used by inline styles below
    ['--page-text' as any]: '#0b6f46',
    ['--page-muted' as any]: '#2b8a57',
    ['--btn-light-bg' as any]: 'linear-gradient(90deg,#d8fcdfff 100%,#d8fcdfff 100%)',
    ['--btn-light-text' as any]: '#005f2eff',
  } as React.CSSProperties,
};

// Example species map data
const SPECIES_MAP_DATA = [
	{
		name: 'Amur Leopard',
		status: 'Critically Endangered',
		region: 'Asia',
		lat: 45.0,
		lng: 133.0,
		img: 'https://earth.org/wp-content/uploads/2022/11/9g51xqtsf1_amur_leopard_99144569.jpg',
		desc: 'Far East Russia, <1% of historic range remains.',
	},
	{
		name: 'Polar Bear',
		status: 'Vulnerable',
		region: 'Arctic',
		lat: 78.0,
		lng: -50.0,
		img: 'https://bloximages.newyork1.vip.townnews.com/valpotorch.com/content/tncms/assets/v3/editorial/3/4b/34b39260-c783-11ec-9097-f3d860fdf9c7/626b82e91b1c1.image.jpg?resize=1200%2C755',
		desc: 'Circumpolar Arctic, threatened by melting ice.',
	},
	{
		name: 'African Lion',
		status: 'Near Threatened',
		region: 'Africa',
		lat: -2.0,
		lng: 34.0,
		img: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg',
		desc: 'Sub-Saharan Africa, declining populations.',
	},
	{
		name: 'Giant Panda',
		status: 'Vulnerable',
		region: 'Asia',
		lat: 31.0,
		lng: 104.0,
		img: 'https://i.natgeofe.com/k/6f2282df-1c6a-474a-9216-ed97b3dce858/Panda-Bamboo_Panda-Quiz_KIDS_1021.jpg?wp=1&w=1084.125&h=721.875',
		desc: 'China, mountain forests.',
	},
	{
		name: 'Green Sea Turtle',
		status: 'Vulnerable',
		region: 'Global Oceans',
		lat: 0.0,
		lng: -30.0,
		img: 'https://animalfactguide.com/wp-content/uploads/2025/03/green-turtle-close.jpg',
		desc: 'Tropical/subtropical oceans worldwide.',
	},
	{
		name: 'Sumatran Orangutan',
		status: 'Critically Endangered',
		region: 'Asia',
		lat: 2.0,
		lng: 98.0,
		img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLWIMk2iWjSG1hwxSOM9fo8rtz1yXQzb-URQ&s',
		desc: 'Sumatra, Indonesia.',
	},
];

const MAP_STATUS_COLORS: Record<string, string> = {
	'Critically Endangered': '#a50000',
	'Endangered': '#ff1212',
	'Vulnerable': '#fb7f2d',
	'Near Threatened': '#E2B813',
};

const MAP_REGIONS: Record<string, string> = {
	Asia: '#1e88e5',
	Africa: '#43a047',
	Arctic: '#00bcd4',
	'Global Oceans': '#1976d2',
};

function getPinColor(species: any, mode: string) {
	if (mode === 'status') return MAP_STATUS_COLORS[species.status] || '#757575';
	if (mode === 'region') return MAP_REGIONS[species.region] || '#757575';
	return '#757575';
}

const Home = () => {
	return (
		<div className="animate-fade-in" style={PAGE_THEME.root}>
			{/* Hero Section */}
			<section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
				{/* Video background: autoplay, muted, loop, playsInline.
            Use heroImage as poster fallback. Public sample MP4 used so no new local asset is required. */}
				<video
					className="absolute inset-0 w-full h-full object-cover"
					style={{ zIndex: 0 }}
					autoPlay
					muted
					loop
					playsInline
					poster={heroImage}
					aria-hidden="true"
				>
					{/* Public sample video — replace with a project asset if you add one locally */}
					<source
						src="https://videos.pexels.com/video-files/18553643/18553643-hd_1920_1080_24fps.mp4"
						type="video/mp4"
					/>
				</video>
				{/* subtle color overlay so text remains readable */}
				<div
					aria-hidden="true"
					style={{
						position: 'absolute',
						inset: 0,
						background:
							'linear-gradient(180deg, rgba(2,6,23,0.28), rgba(2,6,23,0.38))',
						zIndex: 1,
						backdropFilter: 'blur(0.6px)',
					}}
				/>
				<div className="relative z-10 text-center text-primary-foreground px-4 max-w-4xl mx-auto">
					<div className="animate-slide-up">
						<h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
							Discover the Living World
						</h1>
						<p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
							Explore the traits, taxonomy, and unique biological insights of any
							species, with structured data that connects scientific classification
							to ecological and evolutionary context.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button
								variant="hero"
								size="lg"
								asChild
								className="text-lg px-8 py-6"
								style={{
									background: (PAGE_THEME.root as any)['--btn-light-bg'],
									color: (PAGE_THEME.root as any)['--btn-light-text'],
									fontWeight: 700,
								}}
							>
								<Link to="/search" style={{ textDecoration: 'none', color: 'black' }}>
									<Search className="mr-2 h-5 w-5" />
									Search Species
								</Link>
							</Button>
							<Button
								variant="nature"
								size="lg"
								asChild
								className="text-lg px-8 py-6"
								style={{
									background: (PAGE_THEME.root as any)['--btn-light-bg'],
									color: (PAGE_THEME.root as any)['--btn-light-text'],
									fontWeight: 700,
								}}
							>
								<Link to="/taxonomy" style={{ textDecoration: 'none', color: 'black' }}>
									<BarChart3 className="mr-2 h-5 w-5" />
									Explore Taxonomy
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 px-4">
				<div className="container mx-auto max-w-6xl">
					<div className="text-center mb-16 animate-slide-up">
						<h2 className="text-4xl font-bold mb-4">Genomic Discovery Engine</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Access real-time data from multiple scientific databases and APIs
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						<Card className="hover:shadow-nature transition-all duration-300 hover:scale-105 bg-card/80 backdrop-blur-sm">
							<CardHeader className="text-center">
								<div className="mx-auto w-16 h-16 bg-gradient-forest rounded-full flex items-center justify-center mb-4">
									<Microscope className="h-8 w-8 text-primary-foreground" />
								</div>
								<CardTitle className="text-2xl">Species Information</CardTitle>
								<CardDescription className="text-base">
									Get comprehensive data from Wikipedia and scientific databases
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3 text-sm text-muted-foreground">
									<li className="flex items-center">
										<div className="w-2 h-2 bg-primary rounded-full mr-3" />
										Scientific classification
									</li>
									<li className="flex items-center">
										<div className="w-2 h-2 bg-primary rounded-full mr-3" />
										Physical characteristics
									</li>
									<li className="flex items-center">
										<div className="w-2 h-2 bg-primary rounded-full mr-3" />
										Habitat and distribution
									</li>
									<li className="flex items-center">
										<div className="w-2 h-2 bg-primary rounded-full mr-3" />
										Behavioral traits
									</li>
								</ul>
							</CardContent>
						</Card>

						<Card className="hover:shadow-nature transition-all duration-300 hover:scale-105 bg-card/80 backdrop-blur-sm">
							<CardHeader className="text-center">
								<div className="mx-auto w-16 h-16 bg-gradient-forest rounded-full flex items-center justify-center mb-4">
									<Shield className="h-8 w-8 text-primary-foreground" />
								</div>
								<CardTitle className="text-2xl">Health Analysis</CardTitle>
								<CardDescription className="text-base">
									Analyze potential diseases and health concerns
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3 text-sm text-muted-foreground">
									<li className="flex items-center">
										<div className="w-2 h-2 bg-accent rounded-full mr-3" />
										Common diseases
									</li>
									<li className="flex items-center">
										<div className="w-2 h-2 bg-accent rounded-full mr-3" />
										Prevention strategies
									</li>
									<li className="flex items-center">
										<div className="w-2 h-2 bg-accent rounded-full mr-3" />
										Risk assessments
									</li>
									<li className="flex items-center">
										<div className="w-2 h-2 bg-accent rounded-full mr-3" />
										Health monitoring
									</li>
								</ul>
							</CardContent>
						</Card>

						<Card className="hover:shadow-nature transition-all duration-300 hover:scale-105 bg-card/80 backdrop-blur-sm">
							<CardHeader className="text-center">
								<div className="mx-auto w-16 h-16 bg-gradient-forest rounded-full flex items-center justify-center mb-4">
									<TrendingUp className="h-8 w-8 text-primary-foreground" />
								</div>
								<CardTitle className="text-2xl">Taxonomy Charts</CardTitle>
								<CardDescription className="text-base">
									Interactive visualization of taxonomic hierarchy
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3 text-sm text-muted-foreground">
									<li className="flex items-center">
										<div className="w-2 h-2 bg-primary-glow rounded-full mr-3" />
										Kingdom to species
									</li>
									<li className="flex items-center">
										<div className="w-2 h-2 bg-primary-glow rounded-full mr-3" />
										Interactive tree view
									</li>
									<li className="flex items-center">
										<div className="w-2 h-2 bg-primary-glow rounded-full mr-3" />
										Related species
									</li>
									<li className="flex items-center">
										<div className="w-2 h-2 bg-primary-glow rounded-full mr-3" />
										Evolutionary relationships
									</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Sliding Animal Carousel (new) */}
			<section className="py-12 px-4">
				<div className="container mx-auto max-w-6xl">
					<div className="text-center mb-8">
						<h3 className="text-3xl font-semibold">Featured Species Carousel</h3>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Hover to pause. Click arrows to navigate. Each card shows a photo and
							key characteristics.
						</p>
					</div>

					{/* Carousel implementation (no external deps) */}
					<div
						style={{ position: 'relative', overflow: 'hidden' }}
						aria-roledescription="carousel"
						aria-label="Featured species carousel"
					>
						<Carousel />
					</div>
				</div>
			</section>

			{/* Biodiversity Insights (Data Dashboard) */}
			<section className="py-16 px-4">
				<div className="container mx-auto max-w-7xl">
					<div className="text-center mb-14 animate-fade-in">
						<h2 className="text-4xl font-bold mb-3 flex items-center justify-center gap-2">
							<span role="img" aria-label="chart">
								📈
							</span>{' '}
							Biodiversity Insights
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up">
							Explore global species trends through visual data
						</p>
					</div>
					<div className="grid md:grid-cols-3 gap-8">
						<ChartCard
							title="Species by Kingdom / Phylum / Class"
							description="Distribution of known species across major biological groups."
							hoverDetail={
								<div>
									<p className="text-sm mb-2">
										Hover bars for details. Animalia and Plantae dominate global
										species counts, with Fungi and Protista also significant.
									</p>
									<ul className="text-xs text-muted-foreground">
										<li>Animalia: ~1.2M species</li>
										<li>Plantae: ~390K species</li>
										<li>Fungi: ~144K species</li>
										<li>Protista: ~70K species</li>
										<li>
											Others:{' '}
											<span className="text-muted-foreground">
												smaller groups
											</span>
										</li>
									</ul>
								</div>
							}
						>
							<SpeciesBarChart />
						</ChartCard>
						<ChartCard
							title="Most Endangered Families Globally"
							description="Top families facing critical threats, with conservation status."
							hoverDetail={
								<div>
									<p className="text-sm mb-2">
										Red bars indicate critically endangered families. Conservation
										efforts are urgent for these groups.
									</p>
									<ul className="text-xs text-muted-foreground">
										<li>Rhinocerotidae (Rhinos)</li>
										<li>Felidae (Big Cats)</li>
										<li>Psittacidae (Parrots)</li>
										<li>Testudinidae (Tortoises)</li>
										<li>Cyprinidae (Carps)</li>
									</ul>
								</div>
							}
						>
							<EndangeredFamiliesChart />
						</ChartCard>
						<ChartCard
							title="Species Discovery Timeline (Last 10 Years)"
							description="Annual count of newly described species worldwide."
							hoverDetail={
								<div>
									<p className="text-sm mb-2">
										Biodiversity continues to grow as new species are discovered
										each year. Peaks often reflect major expeditions.
									</p>
									<ul className="text-xs text-muted-foreground">
										<li>2023: 18,000+</li>
										<li>2020: COVID dip</li>
										<li>2015: 20,000+ spike</li>
									</ul>
								</div>
							}
						>
							<DiscoveryTimelineChart />
						</ChartCard>
					</div>
				</div>
			</section>

			{/* ❤️ Conservation Focus Section */}
			<section className="py-16 px-4">
				<div className="container mx-auto max-w-7xl">
					<div className="text-center mb-12 animate-fade-in">
						<h2 className="text-4xl font-bold mb-3 flex items-center justify-center gap-2">
							<span role="img" aria-label="heart">
								❤️
							</span>{' '}
							Conservation Focus
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up">
							Highlighting endangered species and global efforts to protect
							biodiversity.
						</p>
					</div>
					<div className="grid md:grid-cols-4 gap-8 mb-10">
						{CONSERVATION_SPECIES.map((sp, idx) => (
							<div
								key={sp.name}
								className="rounded-xl shadow-lg transition-all duration-300"
								style={{
									background: IUCN_COLORS[sp.status].bg,
									color: IUCN_COLORS[sp.status].text,
									boxShadow: '0 8px 24px rgba(16,185,129,0.10)',
									border: `2px solid ${IUCN_COLORS[sp.status].border}`,
									padding: 0,
									overflow: 'hidden',
									minHeight: 320,
									display: 'flex',
									flexDirection: 'column',
									position: 'relative',
								}}
							>
								<div
									style={{
										padding: '20px 20px 0 20px',
										flex: 1,
									}}
								>
									<div className="flex items-center gap-3 mb-2">
										<span
											style={{
												background: IUCN_COLORS[sp.status].badge,
												color: IUCN_COLORS[sp.status].badgeText,
												borderRadius: 8,
												padding: '4px 12px',
												fontWeight: 700,
												fontSize: 13,
												letterSpacing: 0.5,
												boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
											}}
										>
											{sp.status}
										</span>
										<span className="font-bold text-lg">{sp.name}</span>
									</div>
									<div className="italic text-base mb-2">
										{sp.scientific}
									</div>
									<img
										src={sp.img}
										alt={sp.name}
										style={{
											width: '100%',
											height: 120,
											objectFit: 'cover',
											borderRadius: 10,
											marginBottom: 10,
											boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
										}}
									/>
									<div className="text-sm mb-3">{sp.desc}</div>
								</div>
								<div className="flex gap-2 px-4 pb-4">
									<a
										href={sp.ctaUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="font-semibold rounded px-3 py-2 transition-all"
										style={{
											background: IUCN_COLORS[sp.status].ctaBg,
											color: IUCN_COLORS[sp.status].ctaText,
											boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
										}}
									>
										{sp.cta}
									</a>
									<a
										href={sp.learnUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="font-semibold rounded px-3 py-2 transition-all"
										style={{
											background: '#fff',
											color: IUCN_COLORS[sp.status].border,
											border: `1px solid ${IUCN_COLORS[sp.status].border}`,
										}}
									>
										Learn More
									</a>
								</div>
							</div>
						))}
					</div>
					{/* Conservation News Tiles */}
					<div className="grid md:grid-cols-3 gap-6">
						{CONSERVATION_NEWS.map((news, idx) => (
							<a
								key={news.title}
								href={news.url}
								target="_blank"
								rel="noopener noreferrer"
								className="rounded-lg shadow-md transition-all duration-200 hover:scale-105"
								style={{
									background:
										'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
									color: '#fff',
									padding: '18px 22px',
									display: 'flex',
									flexDirection: 'column',
									minHeight: 90,
									justifyContent: 'center',
								}}
							>
								<div className="font-bold text-lg mb-1">{news.title}</div>
								<div className="text-sm opacity-90">{news.desc}</div>
							</a>
						))}
					</div>
				</div>
			</section>

			{/* Trusted Data Partners Section */}
			<section className="py-12 px-4">
				<div className="container mx-auto max-w-5xl">
					<div className="text-center mb-8">
						<h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
							<span role="img" aria-label="database">🧬</span> Trusted Data Partners
						</h2>
					</div>
					<div
						style={{
							display: 'flex',
							overflowX: 'auto',
							gap: 36,
							padding: '12px 0 18px 0',
							alignItems: 'center',
							justifyContent: 'center',
							scrollSnapType: 'x mandatory',
						}}
					>
						{PARTNER_LIST.map((p) => (
							<a
								key={p.name}
								href={p.url}
								target="_blank"
								rel="noopener noreferrer"
								title={p.name}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									background: '#fff',
									borderRadius: 14,
									boxShadow: '0 4px 18px rgba(16,185,129,0.10)',
									padding: '18px 32px',
									minWidth: 120,
									height: 80,
									margin: '0 2px',
									transition: 'transform 180ms, box-shadow 180ms',
									scrollSnapAlign: 'center',
								}}
								onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.07)')}
								onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1.0)')}
							>
								<img
									src={p.logo}
									alt={p.name}
									style={{
										maxHeight: 48,
										maxWidth: 120,
										objectFit: 'contain',
										marginRight: 0,
										filter: 'grayscale(0%)',
									}}
								/>
							</a>
						))}
					</div>
					<div className="text-center mt-2 text-lg text-muted-foreground font-medium">
						GENUS sources data from trusted scientific repositories worldwide.
					</div>
				</div>
			</section>

			{/* Quote + CTA Footer — stronger green gradient background, lighter buttons/text for contrast */}
			<section className="py-20 px-4" aria-labelledby="genus-quote-title">
				<div className="container mx-auto max-w-5xl text-center">
					<div
						className="animate-slide-up"
						style={{
							// stronger green gradient for CTA background (page-local)
							background: 'linear-gradient(90deg,#0ea35a 0%,#057a48 100%)',
							borderRadius: 16,
							padding: '36px 28px',
							boxShadow: '0 20px 60px rgba(4,100,50,0.12)',
							color: '#000000ff',
						}}
					>
						<div style={{ maxWidth: 900, margin: '0 auto' }}>
							<blockquote style={{ margin: 0, padding: 0 }}>
								<p
									id="genus-quote-title"
									style={{
										fontSize: 28,
										fontWeight: 700,
										color: '#e6fff3',
										marginBottom: 12,
										lineHeight: 1.25,
									}}
								>
									“To understand life, we must explore every form of it.”
								</p>
								<cite
									style={{
										display: 'block',
										fontSize: 15,
										color: '#d8ffea',
										marginBottom: 18,
									}}
								>
									— GENUS Team
								</cite>
							</blockquote>

							<p style={{ color: '#d8ffea', opacity: 0.95, marginBottom: 22 }}>
								GENUS connects research-grade data with intuitive tools — dive deeper into taxonomy, genomics,
								and conservation resources curated from trusted scientific partners.
							</p>

							{/* CTA buttons use the lighter button theme (distinct from background) */}
							<div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
								<Button
									variant="ghost"
									size="lg"
									asChild
									className="text-md"
									style={{
										borderRadius: 10,
										padding: '10px 18px',
										minWidth: 200,
										background: (PAGE_THEME.root as any)['--btn-light-bg'],
										color: (PAGE_THEME.root as any)['--btn-light-text'],
										fontWeight: 700,
										boxShadow: '0 8px 24px rgba(6,95,70,0.06)',
										transition: 'transform 180ms ease, box-shadow 180ms ease',
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.02)';
										(e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(6,95,70,0.14)';
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLElement).style.transform = 'none';
										(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(6,95,70,0.06)';
									}}
								>
									<Link to="/taxonomy" aria-label="Explore Taxonomy Tree" style={{ textDecoration: 'none', color: 'inherit' }}>
										Explore Taxonomy Tree
									</Link>
								</Button>

								<Button
									variant="ghost"
									size="lg"
									asChild
									className="text-md"
									style={{
										borderRadius: 10,
										padding: '10px 18px',
										minWidth: 200,
										background: (PAGE_THEME.root as any)['--btn-light-bg'],
										color: (PAGE_THEME.root as any)['--btn-light-text'],
										fontWeight: 700,
										boxShadow: '0 8px 24px rgba(6,95,70,0.06)',
										transition: 'transform 180ms ease, box-shadow 180ms ease',
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.02)';
										(e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(6,95,70,0.14)';
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLElement).style.transform = 'none';
										(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(6,95,70,0.06)';
									}}
								>
									<Link to="/taxonomy" aria-label="Learn Genomics" style={{ textDecoration: 'none', color: 'inherit' }}>
										Learn Taxonomy
									</Link>
								</Button>

								<Button
									variant="ghost"
									size="lg"
									asChild
									className="text-md"
									style={{
										borderRadius: 10,
										padding: '10px 18px',
										minWidth: 200,
										background: (PAGE_THEME.root as any)['--btn-light-bg'],
										color: (PAGE_THEME.root as any)['--btn-light-text'],
										fontWeight: 700,
										boxShadow: '0 8px 24px rgba(6,95,70,0.06)',
										transition: 'transform 180ms ease, box-shadow 180ms ease',
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.02)';
										(e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(6,95,70,0.14)';
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLElement).style.transform = 'none';
										(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(6,95,70,0.06)';
									}}
								>
									<Link to="/red-list" aria-label="View Red List" style={{ textDecoration: 'none', color: 'inherit' }}>
										View Red List
									</Link>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default Home;

// Inserted component implementation (replaced the previous carousel)
// - slides now each take 100% width of the viewport
// - track translates by -index * 100% so slides align correctly
// - lazy prefetch preserved
// - card background uses green gradient; images are rounded rectangles; nav controls adjusted for contrast
const CARDS: {
	title: string;
	scientific: string;
	img: string;
	traits: string[];
}[] = [
	// Wikimedia Commons images (stable and clearly depict the species)
	{
		title: 'Lion',
		scientific: 'Panthera leo',
		img: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg',
		traits: ['Apex predator', 'Social prides', 'Savanna specialist'],
	},
	{
		title: 'Tiger',
		scientific: 'Panthera tigris',
		img: 'https://www.abhibus.com/blog/wp-content/uploads/2023/09/Tiger-Reserves-in-India.jpg',
		traits: ['Solitary ambush hunter', 'Striped camouflage', 'Forest habitats'],
	},
	{
		title: 'Giant Panda',
		scientific: 'Ailuropoda melanoleuca',
		img: 'https://i.natgeofe.com/k/6f2282df-1c6a-474a-9216-ed97b3dce858/Panda-Bamboo_Panda-Quiz_KIDS_1021.jpg?wp=1&w=1084.125&h=721.875',
		traits: ['Bamboo specialist', 'Low metabolic rate', 'Conservation icon'],
	},
	{
		title: 'African Elephant',
		scientific: 'Loxodonta africana',
		img: 'https://khwaiexpeditionscamp.com/wp-content/uploads/2024/06/The-African-Elephant.jpg',
		traits: ['Large social matriarchal herds', 'Ecosystem engineers', 'Long-lived'],
	},
	{
		title: 'Red Fox',
		scientific: 'Vulpes vulpes',
		img: 'https://static1.squarespace.com/static/569ec99b841abaccb7c7e74c/56cb938d60b5e9383c0eb3a8/64af131baa980a3163c7f839/1749060193711/Red+Fox_Ray+Hennessy_2017-11-20.jpg?format=1500w',
		traits: ['Omnivorous', 'Highly adaptable', 'Clever forager'],
	},
	{
		title: 'Bald Eagle',
		scientific: 'Haliaeetus leucocephalus',
		img: 'https://cdn.britannica.com/92/152292-050-EAF28A45/Bald-eagle.jpg',
		traits: ['Powerful vision', 'Fish specialist', 'Territorial'],
	},
	{
		title: 'Green Sea Turtle',
		scientific: 'Chelonia mydas',
		img: 'https://animalfactguide.com/wp-content/uploads/2025/03/green-turtle-close.jpg',
		traits: [
			'Marine herbivore',
			'Long migrations',
			'Endangered in many regions',
		],
	},
	{
		title: 'Emperor Penguin',
		scientific: 'Aptenodytes forsteri',
		img: 'https://i.natgeofe.com/n/365cab4b-7c9f-487a-a76d-0ec4cb6d433a/emperor-penguin_thumb_16x9.jpg?w=1200',
		traits: ['Antarctic breeder', 'Deep divers', 'Huddling social behavior'],
	},
	{
		title: 'Koala',
		scientific: 'Phascolarctos cinereus',
		img: 'https://media.istockphoto.com/id/519731334/photo/young-koala.jpg?s=612x612&w=0&k=20&c=Po_L33-L7izPCCE0tYVqZFA1aSMJqJuFqQZD9LIz4JU=',
		traits: ['Eucalyptus specialist', 'Low-energy diet', 'Mostly sedentary'],
	},
	{
		title: 'Blue Whale',
		scientific: 'Balaenoptera musculus',
		img: 'https://www.jervisbaywild.com.au/wp-content/uploads/2022/03/jervis-bay-wild_blue-whale-calf.jpeg',
		traits: ['Largest animal', 'Krill filter-feeder', 'Long-distance migrations'],
	},
];

function Carousel() {
	const [index, setIndex] = useState(0);
	const [paused, setPaused] = useState(false);
	const [loaded, setLoaded] = useState<number[]>([]);
	const [hovered, setHovered] = useState<number | null>(null); // NEW: track hovered slide
	const [containerHovered, setContainerHovered] = useState(false); // NEW: track overall carousel hover
	const total = CARDS.length;
	const intervalRef = useRef<number | null>(null);

	const markLoaded = (i: number) => {
		setLoaded((prev) => (prev.includes(i) ? prev : [...prev, i]));
	};

	const prefetchImage = (url: string, idx: number) => {
		const img = new Image();
		img.decoding = 'async';
		img.loading = 'lazy';
		img.src = url;
		img.onload = () => markLoaded(idx);
		img.onerror = () => markLoaded(idx);
	};

	useEffect(() => {
		const toLoad = [
			index,
			(index - 1 + total) % total,
			(index + 1) % total,
		];
		toLoad.forEach((i) => {
			if (!loaded.includes(i)) prefetchImage(CARDS[i].img, i);
		});
		const nextNext = (index + 2) % total;
		if (!loaded.includes(nextNext))
			prefetchImage(CARDS[nextNext].img, nextNext);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [index, total]);

	useEffect(() => {
		markLoaded(0);
		markLoaded(1 % total);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (paused) return;
		intervalRef.current = window.setInterval(
			() => setIndex((i) => (i + 1) % total),
			4000
		);
		return () => {
			if (intervalRef.current) window.clearInterval(intervalRef.current);
		};
	}, [paused, total]);

	const prev = () => setIndex((i) => (i - 1 + total) % total);
	const next = () => setIndex((i) => (i + 1) % total);

	return (
		<div
			onMouseEnter={() => {
				setPaused(true);
				setContainerHovered(true);
			}} /* pause + container hover */
			onMouseLeave={() => {
				setPaused(false);
				setContainerHovered(false);
			}} /* unpause + clear container hover */
			onFocus={() => setPaused(true)}
			onBlur={() => setPaused(false)}
			style={{
				position: 'relative',
				// container scale effect (grow/shrink) when hovered
				transform: containerHovered ? 'scale(1.03)' : 'scale(1)',
				transformOrigin: 'center center',
				transition: 'transform 220ms cubic-bezier(.2,.8,.2,1)',
			}}
		>
			{/* track: translate by full 100% steps; each slide is 100% wide */}
			<div
				role="list"
				aria-live="polite"
				style={{
					display: 'flex',
					transition: 'transform 480ms ease',
					transform: `translateX(-${index * 100}%)`,
					width: '100%',
				}}
			>
				{CARDS.map((c, i) => {
					const isLoaded = loaded.includes(i);
					const isHovered = hovered === i;
					return (
						<div
							key={c.scientific}
							role="listitem"
							style={{
								width: '100%',
								flex: '0 0 100%',
								padding: 12,
								boxSizing: 'border-box',
								display: 'flex',
								justifyContent: 'center',
							}}
							onMouseEnter={() => setHovered(i)} // per-slide hover
							onMouseLeave={() => setHovered(null)}
						>
							<article
								style={{
									width: '100%',
									maxWidth: 980,
									display: 'flex',
									gap: 12,
									alignItems: 'stretch',
									// green gradient theme for the whole card
									background: 'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
									borderRadius: 12,
									overflow: 'hidden',
									// dynamic transform/box-shadow on hover for a smooth transition
									transform: isHovered
										? 'translateY(-10px) scale(1.025)'
										: 'translateY(0) scale(1)',
									boxShadow: isHovered
										? '0 24px 48px rgba(16,185,129,0.2)'
										: '0 12px 30px rgba(16,185,129,0.12)',
									transition:
										'transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease',
									willChange: 'transform, box-shadow',
									color: '#ffffff', // ensure text contrast on gradient
								}}
							>
								{/* image: rounded rectangle */}
								<div
									style={{
										flex: '0 0 40%',
										minWidth: 220,
										height: 220,
										overflow: 'hidden',
										background: '#e6f6ea',
										borderRadius: 10,
										margin: 12,
										boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.06)',
									}}
								>
									{isLoaded ? (
										<img
											src={c.img}
											alt={`${c.title} (${c.scientific})`}
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'cover',
												display: 'block',
												borderRadius: 8,
											}}
											decoding="async"
											loading="lazy"
										/>
									) : (
										<div
											style={{
												width: '100%',
												height: '100%',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												color: '#cfeedd',
											}}
										>
											Loading image…
										</div>
									)}
								</div>

								{/* content area: keep white-ish inner box for readability while card maintains gradient */}
								<div
									style={{
										padding: 16,
										flex: '1 1 60%',
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'space-between',
									}}
								>
									<div
										style={{
											background: 'rgba(255,255,255,0.06)',
											padding: 12,
											borderRadius: 8,
										}}
									>
										<h4
											style={{
												margin: 0,
												fontSize: 20,
												color: '#ffffff',
												fontWeight: 700,
											}}
										>
											{c.title}
										</h4>
										<div
											style={{
												color: '#e8ffeb',
												fontStyle: 'italic',
												marginTop: 6,
											}}
										>
											{c.scientific}
										</div>
										<ul
											style={{
												marginTop: 12,
												paddingLeft: 18,
												color: '#eaffea',
											}}
										>
											{c.traits.map((t, idx) => (
												<li key={idx} style={{ marginBottom: 6 }}>
													{t}
												</li>
											))}
										</ul>
									</div>

									<div
										style={{
											display: 'flex',
											gap: 8,
											alignItems: 'center',
											marginTop: 8,
										}}
									>
										<button
											onClick={prev}
											aria-label="Previous"
											style={{
												background: '#ffffff',
												color: '#0f9d58',
												borderRadius: 8,
												border: 'none',
												padding: '6px 10px',
												fontSize: 18,
												cursor: 'pointer',
												boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
											}}
										>
											‹
										</button>

										<button
											onClick={next}
											aria-label="Next"
											style={{
												background: '#ffffff',
												color: '#0f9d58',
												borderRadius: 8,
												border: 'none',
												padding: '6px 10px',
												fontSize: 18,
												cursor: 'pointer',
												boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
											}}
										>
											›
										</button>

										<div
											style={{
												marginLeft: 'auto',
												fontSize: 12,
												color: 'rgba(255,255,255,0.9)',
											}}
										>
											{index + 1} / {total}
										</div>
									</div>
								</div>
							</article>
						</div>
					);
				})}
			</div>

			<div
				style={{
					display: 'flex',
					gap: 8,
					justifyContent: 'center',
					marginTop: 12,
				}}
			>
				{CARDS.map((_, i) => (
					<button
						key={i}
						onClick={() => setIndex(i)}
						aria-label={`Go to slide ${i + 1}`}
						style={{
							width: 10,
							height: 10,
							borderRadius: 10,
							background:
								i === index
									? '#ffffff'
									: 'rgba(255,255,255,0.26)',
							border: 'none',
						}}
					/>
				))}
			</div>
		</div>
	);
}

// ChartCard: reusable card with hover/focus effect for dashboard charts
function ChartCard({
	title,
	description,
	hoverDetail,
	children,
}: {
	title: string;
	description: string;
	hoverDetail: React.ReactNode;
	children: React.ReactNode;
}) {
	const [hover, setHover] = useState(false);
	return (
		<div
			tabIndex={0}
			className="rounded-xl shadow-lg transition-all duration-300"
			style={{
				padding: 0,
				overflow: 'hidden',
				// green gradient theme matching page cards
				background: 'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
				boxShadow: hover
					? '0 16px 48px rgba(16,185,129,0.18)'
					: '0 8px 24px rgba(16,185,129,0.10)',
				transform: hover ? 'scale(1.025)' : 'scale(1)',
				transition:
					'transform 180ms cubic-bezier(.2,.8,.2,1), box-shadow 180ms',
				minHeight: 340,
				display: 'flex',
				flexDirection: 'column',
			}}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			onFocus={() => setHover(true)}
			onBlur={() => setHover(false)}
		>
			<div style={{ padding: '24px 24px 0 24px', color: '#fff' }}>
				<h3 className="text-xl font-bold mb-2" style={{ color: '#fff' }}>
					{title}
				</h3>
				<p
					className="text-base mb-4"
					style={{ color: 'rgba(255,255,255,0.92)' }}
				>
					{description}
				</p>
			</div>
			<div
				style={{
					padding: '0 24px 24px 24px',
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{children}
			</div>
			{hover && (
				<div
					className="absolute left-0 right-0 bottom-0 bg-white/90 text-[#0f9d58] px-6 py-4 rounded-b-xl shadow-lg animate-fade-in"
					style={{
						fontSize: 15,
						zIndex: 10,
						boxShadow: '0 -2px 24px rgba(16,185,129,0.10)',
					}}
				>
					{hoverDetail}
				</div>
			)}
		</div>
	);
}

// Chart 1: Species by Kingdom / Phylum / Class (stacked bar chart)
function SpeciesBarChart() {
	// Example data
	const data = [
		{ label: 'Animalia', value: 1200000, color: '#1499ffff' },
		{ label: 'Plantae', value: 390000, color: '#99ff13ff' },
		{ label: 'Fungi', value: 144000, color: '#ff9d14ff' },
		{ label: 'Protista', value: 70000, color: '#fbf42dff' },
		{ label: 'Others', value: 18000, color: '#bbb3b3ff' },
	];
	const max = Math.max(...data.map((d) => d.value));
	return (
		<svg
			width="100%"
			height="120"
			viewBox="0 0 340 120"
			style={{ width: '100%', maxWidth: 320 }}
		>
			{data.map((d, i) => (
				<g key={d.label}>
					<rect
						x={20}
						y={20 + i * 18}
						width={220 * (d.value / max)}
						height={14}
						rx={7}
						fill={d.color}
						style={{ transition: 'width 220ms' }}
					/>
					<text
						x={250}
						y={32 + i * 18}
						fontSize={14}
						fill="#fff"
						fontWeight="bold"
					>
						{d.label}
					</text>
					<text
						x={20 + 220 * (d.value / max) + 8}
						y={32 + i * 18}
						fontSize={12}
						fill="#eaffea"
					>
						{d.value.toLocaleString()}
					</text>
				</g>
			))}
		</svg>
	);
}

// Chart 2: Most Endangered Families Globally (bar chart with status)
function EndangeredFamiliesChart() {
	// Example data
	const data = [
		{ label: 'Rhinocerotidae', value: 5, status: 'CR', color: '#a50000ff' },
		{ label: 'Felidae', value: 14, status: 'EN', color: '#ff1212ff' },
		{ label: 'Psittacidae', value: 17, status: 'EN', color: '#ff1212ff' },
		{ label: 'Testudinidae', value: 11, status: 'CR', color: '#a50000ff' },
		{ label: 'Cyprinidae', value: 22, status: 'VU', color: '#fb7f2dff' },
	];
	const max = Math.max(...data.map((d) => d.value));
	return (
		<svg
			width="100%"
			height="120"
			viewBox="0 0 340 120"
			style={{ width: '100%', maxWidth: 320 }}
		>
			{data.map((d, i) => (
				<g key={d.label}>
					<rect
						x={20}
						y={20 + i * 18}
						width={220 * (d.value / max)}
						height={14}
						rx={7}
						fill={d.color}
						style={{ transition: 'width 220ms' }}
					/>
					<text
						x={250}
						y={32 + i * 18}
						fontSize={14}
						fill="#fff"
						fontWeight="bold"
					>
						{d.label}
					</text>
					<text
						x={20 + 220 * (d.value / max) + 8}
						y={32 + i * 18}
						fontSize={12}
						fill={
							d.status === 'Critical'
								? '#a50000ff'
								: d.status === 'Endangered'
								? '#ff1212ff'
								: '#424140ff'
						}
						fontWeight="bold"
					>
						{d.status}
					</text>
				</g>
			))}
		</svg>
	);
}

// Chart 3: Species Discovery Timeline (Last 10 Years) (line chart)
function DiscoveryTimelineChart() {
	// Example data
	const years = Array.from({ length: 10 }, (_, i) => 2014 + i);
	const values = [
		15000, 17000, 20000, 18500, 16000, 14000, 15500, 17000, 18000, 19000,
	];
	const max = Math.max(...values);
	const min = Math.min(...values);
	const chartW = 320,
		chartH = 100,
		pad = 28;
	// Map values to points
	const points = values.map((v, i) => {
		const x = pad + ((chartW - 2 * pad) * i) / (values.length - 1);
		const y =
			chartH - pad - ((chartH - 2 * pad) * (v - min)) / (max - min + 1);
		return [x, y];
	});
	const linePath = points
		.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
		.join(' ');
	return (
		<svg
			width="100%"
			height={chartH}
			viewBox={`0 0 ${chartW} ${chartH}`}
			style={{ width: '100%', maxWidth: 320 }}
		>
			{/* Axis */}
			<line
				x1={pad}
				y1={chartH - pad}
				x2={chartW - pad}
				y2={chartH - pad}
				stroke="#eaffea"
				strokeWidth={2}
			/>
			<line
				x1={pad}
				y1={pad}
				x2={pad}
				y2={chartH - pad}
				stroke="#eaffea"
				strokeWidth={2}
			/>
			{/* Line */}
			<path d={linePath} stroke="#43a047" strokeWidth={3} fill="none" />
			{/* Points */}
			{points.map(([x, y], i) => (
				<circle
					key={i}
					cx={x}
					cy={y}
					r={5}
					fill="#1e88e5"
					stroke="#fff"
					strokeWidth={2}
				/>
			))}
			{/* Year labels */}
			{years.map((year, i) => (
				<text
					key={year}
					x={points[i][0]}
					y={chartH - pad + 16}
					fontSize={11}
					fill="#fff"
					textAnchor="middle"
				>
					{year}
				</text>
			))}
			{/* Value labels */}
			{values.map((v, i) => (
				<text
					key={i}
					x={points[i][0]}
					y={points[i][1] - 10}
					fontSize={11}
					fill="#eaffea"
					textAnchor="middle"
				>
					{v}
				</text>
			))}
		</svg>
	);
}

// IUCN color theme map
const IUCN_COLORS: Record<
	string,
	{
		bg: string;
		text: string;
		border: string;
		badge: string;
		badgeText: string;
		ctaBg: string;
		ctaText: string;
	}
> = {
	'Critically Endangered': {
		bg: '#fff5f5',
		text: '#a50000',
		border: '#a50000',
		badge: '#a50000',
		badgeText: '#fff',
		ctaBg: '#a50000',
		ctaText: '#fff',
	},
	Endangered: {
		bg: '#fff8f2',
		text: '#ff1212',
		border: '#ff1212',
		badge: '#ff1212',
		badgeText: '#fff',
		ctaBg: '#ff1212',
		ctaText: '#fff',
	},
	Vulnerable: {
		bg: '#fffbe6',
		text: '#fb7f2d',
		border: '#fb7f2d',
		badge: '#fb7f2d',
		badgeText: '#fff',
		ctaBg: '#fb7f2d',
		ctaText: '#fff',
	},
	'Near Threatened': {
		bg: '#f6fff6',
		text: '#E2B813',
		border: '#E2B813',
		badge: '#E2B813',
		badgeText: '#fff',
		ctaBg: '#E2B813',
		ctaText: '#fff',
	},
};

// Example endangered species data (IUCN Red List)
const CONSERVATION_SPECIES = [
	{
		name: 'Amur Leopard',
		scientific: 'Panthera pardus orientalis',
		status: 'Critically Endangered',
		img: 'https://earth.org/wp-content/uploads/2022/11/9g51xqtsf1_amur_leopard_99144569.jpg',
		desc: 'Fewer than 100 remain in the wild. Threatened by habitat loss and poaching.',
		cta: 'Adopt a Species',
		ctaUrl: 'https://support.worldwildlife.org/site/SPageServer?pagename=donate_species_leopard',
		learnUrl: 'https://www.iucnredlist.org/species/15954/50659951',
	},
	{
		name: 'Sumatran Orangutan',
		scientific: 'Pongo abelii',
		status: 'Critically Endangered',
		img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLWIMk2iWjSG1hwxSOM9fo8rtz1yXQzb-URQ&s',
		desc: 'Population declining due to deforestation and illegal hunting.',
		cta: 'Support Conservation',
		ctaUrl: 'https://www.orangutans-sos.org/take-action/',
		learnUrl: 'https://www.iucnredlist.org/species/39945/17966347',
	},
	{
		name: 'Asian Elephant',
		scientific: 'Elephas maximus',
		status: 'Endangered',
		img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuLJjGBPLQp49w4Yjibvd-nh1QhT_8p2H7xg&s',
		desc: 'Threatened by habitat fragmentation and human-wildlife conflict.',
		cta: 'Adopt a Species',
		ctaUrl: 'https://support.worldwildlife.org/site/SPageServer?pagename=donate_species_elephant',
		learnUrl: 'https://www.iucnredlist.org/species/7140/12828813',
	},
	{
		name: 'Green Sea Turtle',
		scientific: 'Chelonia mydas',
		status: 'Vulnerable',
		img: 'https://animalfactguide.com/wp-content/uploads/2025/03/green-turtle-close.jpg',
		desc: 'Threatened by fishing, pollution, and climate change.',
		cta: 'Support Conservation',
		ctaUrl: 'https://www.seeturtles.org/green-sea-turtle',
		learnUrl: 'https://www.iucnredlist.org/species/4615/11085780',
	},
	{
		name: 'Snow Leopard',
		scientific: 'Panthera uncia',
		status: 'Vulnerable',
		img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPFO2CfFjumW-hcSIM_B7Kna0rwkusCbuaBg&s',
		desc: 'Threatened by poaching and habitat loss in mountain regions.',
		cta: 'Adopt a Species',
		ctaUrl: 'https://support.worldwildlife.org/site/SPageServer?pagename=donate_species_snowleopard',
		learnUrl: 'https://www.iucnredlist.org/species/22732/50664030',
	},
	{
		name: 'Polar Bear',
		scientific: 'Ursus maritimus',
		status: 'Vulnerable',
		img: 'https://bloximages.newyork1.vip.townnews.com/valpotorch.com/content/tncms/assets/v3/editorial/3/4b/34b39260-c783-11ec-9097-f3d860fdf9c7/626b82e91b1c1.image.jpg?resize=1200%2C755',
		desc: 'Threatened by melting sea ice due to climate change.',
		cta: 'Support Conservation',
		ctaUrl: 'https://support.worldwildlife.org/site/SPageServer?pagename=donate_species_polarbear',
		learnUrl: 'https://www.iucnredlist.org/species/22823/14871490',
	},
	{
		name: 'African Lion',
		scientific: 'Panthera leo',
		status: 'Near Threatened',
		img: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg',
		desc: 'Population decreasing due to habitat loss and conflict with humans.',
		cta: 'Adopt a Species',
		ctaUrl: 'https://support.worldwildlife.org/site/SPageServer?pagename=donate_species_lion',
		learnUrl: 'https://www.iucnredlist.org/species/15951/115130419',
	},
	{
		name: 'Giant Panda',
		scientific: 'Ailuropoda melanoleuca',
		status: 'Vulnerable',
		img: 'https://i.natgeofe.com/k/6f2282df-1c6a-474a-9216-ed97b3dce858/Panda-Bamboo_Panda-Quiz_KIDS_1021.jpg?wp=1&w=1084.125&h=721.875',
		desc: 'Conservation efforts have improved status, but threats remain.',
		cta: 'Support Conservation',
		ctaUrl: 'https://support.worldwildlife.org/site/SPageServer?pagename=donate_species_panda',
		learnUrl: 'https://www.iucnredlist.org/species/712/121745669',
	},
];

// Example conservation news/initiatives
const CONSERVATION_NEWS = [
	{
		title: 'UN Biodiversity Treaty Ratified',
		desc: 'Global agreement to protect 30% of Earth’s land and oceans by 2030.',
		url: 'https://www.unep.org/news-and-stories/story/un-biodiversity-conference-ends-historic-agreement',
	},
	{
		title: 'WWF Launches New Species Recovery Program',
		desc: 'Major initiative to restore populations of critically endangered animals.',
		url: 'https://www.worldwildlife.org/initiatives/wildlife-conservation',
	},
	{
		title: 'IUCN Red List Update',
		desc: 'Thousands of species reassessed for conservation status in latest release.',
		url: 'https://www.iucnredlist.org/news',
	},
];

// Partner database list (logo URLs are public domain or official branding)
const PARTNER_LIST = [
	{
		name: 'NCBI',
		url: 'https://www.ncbi.nlm.nih.gov/',
		logo: 'https://wildbrine.com/wp-content/uploads/2017/08/ncbi.png',
	},
	{
		name: 'ITIS',
		url: 'https://www.itis.gov/',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/ITIS_logo.svg',
	},
	{
		name: 'IUCN',
		url: 'https://www.iucnredlist.org/',
		logo: 'https://aws.cause.clickandpledge.com/accounts/28975/connect/images/638647635878904431_logo-iucn-red-list-1_1.png',
	},
	{
		name: 'GBIF',
		url: 'https://www.gbif.org/',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/GBIF-2015-full-stacked.png',
	},
	{
		name: 'Wikidata',
		url: 'https://www.wikidata.org/',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Wikidata-logo-en.svg',
	},
	{
		name: 'Wikipedia',
		url: 'https://en.wikipedia.org/',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png',
	},
];