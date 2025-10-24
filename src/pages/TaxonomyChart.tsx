/**
 * Changelog:
 * - Added debounced (300ms) autocomplete for scientific names with keyboard + mouse support and highlighting.
 * - Added a compact dropdown of 10 common species; selecting one autofills and triggers the existing generateTaxonomy flow.
 * - Rank cards are now collapsible panels. Expanding fetches aggregated details from ITIS, GBIF and Wikipedia (parallel, with timeouts & AbortController), caches per-rank results in-memory, provides refresh per-rank, and displays source badges/links.
 *
 * Dev notes:
 * - To wire API keys (if available), export them via environment variables (e.g. process.env.ITIS_API_KEY or import.meta.env.VITE_ITIS_API_KEY). The code will read those if present.
 * - Selecting an autocomplete suggestion or dropdown species will set search state and call generateTaxonomy(...) as before.
 *
 * Non-obvious logic is commented inline (debounce, aggregation, caching, keyboard handling).
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  TreePine,
  ArrowRight,
  Microscope,
  Info
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';

// -------------------- Local suggestion & dropdown data --------------------
const COMMON_SPECIES: { scientific: string; common: string }[] = [
  { scientific: 'Panthera leo', common: 'Lion' },
  { scientific: 'Elephas maximus', common: 'Asian Elephant' },
  { scientific: 'Ursus arctos', common: 'Brown Bear' },
  { scientific: 'Canis lupus', common: 'Gray Wolf' },
  { scientific: 'Felis catus', common: 'Domestic Cat' },
  { scientific: 'Equus caballus', common: 'Horse' },
  { scientific: 'Bos taurus', common: 'Domestic Cattle' },
  { scientific: 'Sus scrofa', common: 'Wild Boar' },
  { scientific: 'Vulpes vulpes', common: 'Red Fox' },
  { scientific: 'Homo sapiens', common: 'Human' },
];

// Local list of scientific names used for suggestions (extend as needed)
const ALL_SCIENTIFIC_NAMES: string[] = [
  ...COMMON_SPECIES.map(s => s.scientific),
  'Panthera tigris', 'Ailuropoda melanoleuca', 'Giraffa camelopardalis',
  'Hippopotamus amphibius', 'Crocodylus niloticus', 'Struthio camelus',
  'Spheniscus demersus', 'Gorilla gorilla', 'Pan troglodytes', 'Pongo pygmaeus'
];

// -------------------- Types --------------------
interface TaxonomyLevel {
  rank: string;
  name: string;
  description?: string;
}

interface TaxonomyData {
  species: string;
  hierarchy: TaxonomyLevel[];
  funFact: string;
}

interface ITISResult {
  tsn?: string;
  scientificName?: string;
  commonNames?: string[];
  citation?: string;
  sourceUrl?: string;
}

interface GBIFResult {
  usageKey?: number | null;
  canonicalName?: string;
  kingdom?: string;
  distribution?: string;
  commonNames?: string[];
  sourceUrl?: string;
}

interface WikiResult {
  extract?: string;
  pageUrl?: string;
}

interface RankFetchResult {
  itis?: ITISResult | null;
  gbif?: GBIFResult | null;
  wiki?: WikiResult | null;
  combinedSummary?: string;
  fetchedAt: number;
  error?: string | null;
}

// -------------------- Utilities --------------------
// Simple typed debounce hook for values
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// Fetch wrapper with timeout using AbortController
async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// In-memory caches and throttle maps (persist for session)
const rankCache: Map<string, RankFetchResult> = new Map();
const rankLastFetchTime: Map<string, number> = new Map();
const RANK_FETCH_THROTTLE_MS = 1000; // avoid repeated immediate re-fetches

// -------------------- Component --------------------
const TaxonomyChart: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [taxonomyData, setTaxonomyData] = useState<TaxonomyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // -------------------- Autocomplete state --------------------
  const [inputValue, setInputValue] = useState<string>('');
  const debouncedInput = useDebouncedValue<string>(inputValue, 300); // 300ms debounce
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsRef = useRef<HTMLUListElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // -------------------- Rank panels state --------------------
  const [openRanks, setOpenRanks] = useState<Record<string, boolean>>({});
  const [rankLoading, setRankLoading] = useState<Record<string, boolean>>({});

  // NEW: hover state for the dynamic green-gradient search card (matches AnimalSearch theme)
  const [searchCardHover, setSearchCardHover] = useState<boolean>(false);

  // Hover wrapper (keyboard accessible) reused from AnimalSearch for consistent visuals
  const HoverWrapper: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
    const [hover, setHover] = useState(false);
    return (
      <div
        tabIndex={0}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        style={{
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          transform: hover ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
          boxShadow: hover ? '0 20px 50px rgba(16,185,129,0.12)' : '0 6px 18px rgba(0,0,0,0.06)',
          borderRadius: 12,
          willChange: 'transform, box-shadow',
          ...style,
        }}
        aria-hidden={false}
      >
        {children}
      </div>
    );
  };

  // Keep inputValue synced when searchQuery set via URL or other flows
  useEffect(() => {
    const species = searchParams.get('species');
    if (species) {
      setSearchQuery(species);
      setInputValue(species);
      generateTaxonomy(species);
    }
  }, [searchParams]);

  // -------------------- Original generateTaxonomy preserved --------------------
  const generateTaxonomy = async (scientificName: string) => {
    if (!scientificName.trim()) {
      toast({
        title: "Please enter a scientific name",
        description: "Enter a valid animal scientific name to generate taxonomy.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const taxonomy = await generateTaxonomyHierarchy(scientificName);
      setTaxonomyData(taxonomy);

      toast({
        title: "Taxonomy generated!",
        description: `Successfully created taxonomy chart for ${scientificName}`,
      });
    } catch (error) {
      console.error('Taxonomy generation error:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate taxonomy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch taxonomy from GBIF and fun fact from Wikipedia
  const generateTaxonomyHierarchy = async (scientificName: string): Promise<TaxonomyData> => {
    // GBIF species match API
    const matchRes = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}`);
    const matchJson = await matchRes.json();

    if (!matchJson.usageKey) {
      throw new Error('No taxonomy found');
    }

    // Get full classification
    const speciesRes = await fetch(`https://api.gbif.org/v1/species/${matchJson.usageKey}`);
    const speciesJson = await speciesRes.json();

    // Map GBIF ranks to your hierarchy
    const hierarchy: TaxonomyLevel[] = [
      { rank: 'Kingdom', name: speciesJson.kingdom || '', description: 'Highest rank grouping all animals.' },
      { rank: 'Phylum', name: speciesJson.phylum || '', description: 'Major lineage within the kingdom.' },
      { rank: 'Class', name: speciesJson.class || '', description: 'Group of related orders.' },
      { rank: 'Order', name: speciesJson.order || '', description: 'Group of related families.' },
      { rank: 'Family', name: speciesJson.family || '', description: 'Group of related genera.' },
      { rank: 'Genus', name: speciesJson.genus || '', description: 'Group of closely related species.' },
      { rank: 'Species', name: speciesJson.species || scientificName, description: 'Specific organism.' },
    ].filter(level => level.name);

    // Fetch fun fact from Wikipedia
    let funFact = '';
    try {
      const wikiRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`
      );
      if (wikiRes.ok) {
        const wikiJson = await wikiRes.json();
        funFact = wikiJson.extract || 'No fun fact found.';
      } else {
        funFact = 'No fun fact found.';
      }
    } catch {
      funFact = 'No fun fact found.';
    }

    return {
      species: scientificName,
      hierarchy,
      funFact,
    };
  };

  // -------------------- Autocomplete generation (debounced) --------------------
  useEffect(() => {
    const q = debouncedInput.trim();
    if (q.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }
    const lowerQ = q.toLowerCase();
    // Prioritize startsWith matches then includes matches
    const starts = ALL_SCIENTIFIC_NAMES.filter(n => n.toLowerCase().startsWith(lowerQ));
    const includes = ALL_SCIENTIFIC_NAMES.filter(n => !n.toLowerCase().startsWith(lowerQ) && n.toLowerCase().includes(lowerQ));
    const combined = [...starts, ...includes].slice(0, 10);
    setSuggestions(combined);
    setShowSuggestions(combined.length > 0);
    setActiveSuggestionIndex(-1);
  }, [debouncedInput]);

  // -------------------- Outside click dismissal --------------------
  useEffect(() => {
    function onDown(ev: MouseEvent) {
      const t = ev.target as Node | null;
      if (
        t &&
        !inputRef.current?.contains(t) &&
        !suggestionsRef.current?.contains(t) &&
        !dropdownRef.current?.contains(t)
      ) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // -------------------- Keyboard navigation for suggestions --------------------
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => Math.max(prev - 1, -1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestionIndex >= 0) {
          const chosen = suggestions[activeSuggestionIndex];
          // Autofill and trigger existing search flow
          setInputValue(chosen);
          setSearchQuery(chosen);
          generateTaxonomy(chosen); // keep behavior consistent with original handler
          setShowSuggestions(false);
          setActiveSuggestionIndex(-1);
        } else {
          const toSearch = inputValue.trim();
          if (toSearch) {
            setSearchQuery(toSearch);
            generateTaxonomy(toSearch);
            setShowSuggestions(false);
          }
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        return;
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault();
        const toSearch = inputValue.trim();
        if (toSearch) {
          setSearchQuery(toSearch);
          generateTaxonomy(toSearch);
        }
      }
    }
  }, [showSuggestions, suggestions, activeSuggestionIndex, inputValue, generateTaxonomy]);

  // Preserve existing simple keypress handler for compatibility
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const toSearch = inputValue.trim();
      if (toSearch) {
        setSearchQuery(toSearch);
        generateTaxonomy(toSearch);
      }
    }
  };

  // Suggestion click/touch selection
  const chooseSuggestion = (name: string) => {
    setInputValue(name);
    setSearchQuery(name);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    // Use existing generateTaxonomy to keep original behavior
    generateTaxonomy(name);
    // blur to reduce accidental further key events
    inputRef.current?.blur();
  };

  // Dropdown selection triggers same behavior
  const handleDropdownSelect = (scientificName: string) => {
    setInputValue(scientificName);
    setSearchQuery(scientificName);
    setDropdownOpen(false);
    generateTaxonomy(scientificName);
    inputRef.current?.blur();
  };

  // -------------------- Fetch helpers for per-rank aggregation --------------------
  // Read env API key if provided (support common bundlers)
  const ITIS_API_KEY = (typeof process !== 'undefined' && (process.env as any)?.ITIS_API_KEY) || (typeof import.meta !== 'undefined' && (import.meta as any)?.VITE_ITIS_API_KEY) || undefined;

  const fetchITIS = async (name: string, signal?: AbortSignal): Promise<ITISResult | null> => {
    try {
      // public ITIS JSON service search
      const url = `https://www.itis.gov/ITISWebService/jsonservice/searchByScientificName?srchKey=${encodeURIComponent(name)}`;
      const res = await fetchWithTimeout(url, { signal }, 5000);
      if (!res.ok) return null;
      const json = await res.json();
      const first = (json?.scientificNames && json.scientificNames[0]) || null;
      if (!first) return null;
      const tsn = first?.tsn;
      const itisUrl = tsn ? `https://itis.gov/servlet/SingleRpt/SingleRpt?search_topic=TSN&search_value=${tsn}` : undefined;
      return {
        tsn: tsn?.toString(),
        scientificName: first?.combinedName,
        commonNames: first?.commonNames ? first.commonNames.map((c: any) => c?.commonName).filter(Boolean) : undefined,
        citation: first?.authorship || undefined,
        sourceUrl: itisUrl,
      };
    } catch {
      return null;
    }
  };

  const fetchGBIF = async (name: string, signal?: AbortSignal): Promise<GBIFResult | null> => {
    try {
      const matchUrl = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`;
      const matchRes = await fetchWithTimeout(matchUrl, { signal }, 5000);
      if (!matchRes.ok) return null;
      const matchJson = await matchRes.json();
      const usageKey = matchJson?.usageKey;
      if (!usageKey) return null;
      const speciesUrl = `https://api.gbif.org/v1/species/${usageKey}`;
      const speciesRes = await fetchWithTimeout(speciesUrl, { signal }, 6000);
      if (!speciesRes.ok) return { usageKey, canonicalName: matchJson?.scientificName, sourceUrl: `https://www.gbif.org/species/${usageKey}` };
      const speciesJson = await speciesRes.json();
      const commonNames: string[] = (speciesJson?.vernacularNames || []).slice(0, 5).map((v: any) => v?.vernacularName).filter(Boolean);
      const distribution = speciesJson?.distribution || speciesJson?.distributionString || undefined;
      return {
        usageKey,
        canonicalName: speciesJson?.canonicalName || matchJson?.scientificName,
        kingdom: speciesJson?.kingdom,
        distribution,
        commonNames,
        sourceUrl: `https://www.gbif.org/species/${usageKey}`,
      };
    } catch {
      return null;
    }
  };

  const fetchWiki = async (name: string, signal?: AbortSignal): Promise<WikiResult | null> => {
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
      const res = await fetchWithTimeout(wikiUrl, { signal }, 6000);
      if (!res.ok) return null;
      const json = await res.json();
      const pageUrl = json?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`;
      return { extract: json?.extract || undefined, pageUrl };
    } catch {
      return null;
    }
  };

  // Aggregate per-rank data with prioritization and caching
  // Faster aggregate: only fetch Wikipedia content for ranks (GBIF/ITIS removed)
  const aggregateRankData = useCallback(async (levelName: string): Promise<RankFetchResult> => {
    const key = levelName.toLowerCase();
    const now = Date.now();
    const last = rankLastFetchTime.get(key) || 0;
    // throttle repeated calls within short window, return cache if fresh
    if (now - last < RANK_FETCH_THROTTLE_MS && rankCache.has(key)) {
      return rankCache.get(key)!;
    }
    rankLastFetchTime.set(key, now);

    const controller = new AbortController();
    const signal = controller.signal;

    try {
      // Only fetch Wikipedia now for performance and to match UI requirements
      const wiki = await fetchWiki(levelName, signal);

      const result: RankFetchResult = {
        itis: null,
        gbif: null,
        wiki: wiki || null,
        combinedSummary: undefined,
        fetchedAt: Date.now(),
        error: null,
      };
      rankCache.set(key, result);
      return result;
    } catch (err) {
      const fallback: RankFetchResult = {
        itis: null,
        gbif: null,
        wiki: null,
        combinedSummary: 'Failed to retrieve remote data. Showing fallback content.',
        fetchedAt: Date.now(),
        error: err instanceof Error ? err.message : String(err),
      };
      rankCache.set(key, fallback);
      return fallback;
    } finally {
      controller.abort();
    }
  }, []);

  // Refresh a rank: clear cache and re-fetch
  const refreshRank = useCallback(async (levelName: string) => {
    const key = levelName.toLowerCase();
    rankCache.delete(key);
    rankLastFetchTime.delete(key);
    setRankLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await aggregateRankData(levelName);
      setRankLoading(prev => ({ ...prev, [key]: false }));
      // open panel to show refreshed data
      setOpenRanks(prev => ({ ...prev, [key]: true }));
      return res;
    } catch {
      setRankLoading(prev => ({ ...prev, [key]: false }));
      return null;
    }
  }, [aggregateRankData]);

  // Toggle a rank: fetch when opening and not cached
  const toggleRank = useCallback(async (level: TaxonomyLevel) => {
    const key = level.name.toLowerCase();
    const currentlyOpen = !!openRanks[key];
    if (currentlyOpen) {
      setOpenRanks(prev => ({ ...prev, [key]: false }));
      return;
    }
    // Open: fetch if not cached
    setOpenRanks(prev => ({ ...prev, [key]: true }));
    if (!rankCache.has(key)) {
      setRankLoading(prev => ({ ...prev, [key]: true }));
      try {
        await aggregateRankData(level.name);
      } finally {
        setRankLoading(prev => ({ ...prev, [key]: false }));
      }
    }
  }, [openRanks, aggregateRankData]);

  // -------------------- Highlight helper --------------------
  const highlightMatch = (text: string, q: string) => {
    const qi = q.trim().toLowerCase();
    if (!qi) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(qi);
    if (idx === -1) return <span>{text}</span>;
    return (
      <span>
        {text.slice(0, idx)}
        {/* match color aligned with AnimalSearch */}
        <mark style={{ backgroundColor: '#c0ffbfff', padding: 0 }}>{text.slice(idx, idx + qi.length)}</mark>
        {text.slice(idx + qi.length)}
      </span>
    );
  };

  // -------------------- Inline scoped styles --------------------
  const suggestionListStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    background: '#0e932fff', // green card-style background
    border: '1px solid #e6e6e6',
    borderRadius: 6,
    boxShadow: '0 6px 18px rgba(50, 50, 50, 1)',
    zIndex: 2400,
    listStyle: 'none',
    padding: 0,
    maxHeight: 240,
    overflowY: 'auto',
  };

  const dropdownBoxStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 6,
    background: '#0e932fff', // green dropdown background to match search card
    border: '1px solid #e6e6e6',
    borderRadius: 6,
    boxShadow: '0 6px 18px rgba(50, 50, 50, 1)',
    zIndex: 2400,
    minWidth: 260,
    padding: '6px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  };

  const rankPanelStyle: React.CSSProperties = {
    transition: 'max-height 260ms ease, opacity 220ms ease',
    overflow: 'hidden',
  };

  // color map for ranks (kingdom -> species) — used for the small rank badges
  const rankColors: Record<string, string> = {
    kingdom: '#6a1b9a',
    phylum:  '#1e88e5',
    class:   '#00897b',
    order:   '#43a047',
    family:  '#f4511e',
    genus:   '#8e24aa',
    species: '#d81b60',
  };

  // -------------------- Render (only search input and rank-card sections changed; rest preserved) ----------------  >
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <TreePine className="h-10 w-10 text-primary" />
          Taxonomic Classification
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore the hierarchical classification and evolutionary relationships of animal species
        </p>
      </div>

      {/* Search Section — UPDATED: green-gradient, hoverable, dynamic card (autocomplete + dropdown) */}
      <Card
        className="mb-8 animate-slide-up"
        onMouseEnter={() => setSearchCardHover(true)}
        onMouseLeave={() => setSearchCardHover(false)}
        style={{
          borderRadius: 12,
          padding: 0,
          overflow: 'visible',
          background: 'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
          color: '#ffffff',
          transform: searchCardHover ? 'translateY(-6px)' : 'translateY(0)',
          boxShadow: searchCardHover ? '0 20px 50px rgba(16,185,129,0.16)' : '0 8px 24px rgba(15,23,42,0.06)',
          transition: 'transform 180ms ease, box-shadow 180ms ease, background 220ms ease',
        }}
        aria-label="Taxonomy search card"
      >
        <CardHeader style={{ padding: '18px 20px', background: 'transparent' }}>
          <CardTitle className="flex items-center gap-2" style={{ color: '#ffffff', display: 'flex', alignItems: 'center' }}>
            <Search style={{ width: 20, height: 20, color: '#fff' }} />
            <span style={{ fontWeight: 700 }}>Generate Taxonomy Chart</span>
          </CardTitle>
          <CardDescription style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Enter the scientific name (e.g., "Panthera leo", "Homo sapiens", "Canis lupus")
          </CardDescription>
        </CardHeader>
        <CardContent style={{ padding: 16, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00))' }}>
          <div className="flex gap-4" style={{ position: 'relative', alignItems: 'flex-start' }}>
            {/* Input + Autocomplete */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Input
                placeholder="Enter scientific name..."
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const v = e.target.value;
                  setInputValue(v);
                  if (v.trim().length > 0) setShowSuggestions(true);
                  else {
                    setShowSuggestions(false);
                    setSuggestions([]);
                    setActiveSuggestionIndex(-1);
                  }
                }}
                onKeyDown={handleInputKeyDown}
                onKeyPress={handleKeyPress}
                ref={inputRef}
                aria-autocomplete="list"
                aria-controls="taxonomy-autocomplete-list"
                aria-expanded={showSuggestions}
                aria-activedescendant={activeSuggestionIndex >= 0 ? `suggestion-${activeSuggestionIndex}` : undefined}
                autoComplete="off"
                className="flex-1"
                style={{
                  background: 'rgba(255, 255, 255, 1)',
                  color: '#191919ff',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '10px 12px',
                  borderRadius: 8,
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  id="taxonomy-autocomplete-list"
                  role="listbox"
                  ref={suggestionsRef}
                  style={suggestionListStyle}
                  aria-label="Scientific name suggestions"
                >
                  {suggestions.map((s, i) => (
                    <li
                      key={s}
                      id={`suggestion-${i}`}
                      role="option"
                      aria-selected={activeSuggestionIndex === i}
                      onMouseDown={(ev) => {
                        ev.preventDefault(); // prevent blur before handling click
                        chooseSuggestion(s);
                      }}
                      onMouseEnter={() => setActiveSuggestionIndex(i)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor: activeSuggestionIndex === i ? '#b5b7b6' : 'transparent',
                        fontWeight: activeSuggestionIndex === i ? 600 : 400,
                        color: '#fff',
                      }}
                    >
                      {highlightMatch(s, debouncedInput)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Dropdown of common species */}
            <div style={{ position: 'relative', zIndex: 2400 }} ref={dropdownRef}>
              <Button
                type="button"
                variant="outline"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                aria-controls="taxonomy-common-dropdown"
                onClick={() => setDropdownOpen(v => !v)}
                style={{
                  minWidth: 44,
                  padding: '0 0.5rem',
                  background: 'rgba(0, 164, 41, 1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.08)',
                  zIndex: 2401,
                }}
              >
                ▼
              </Button>
              {dropdownOpen && (
                <div id="taxonomy-common-dropdown" role="listbox" style={dropdownBoxStyle}>
                  {COMMON_SPECIES.map((sp, idx) => (
                    <div
                      key={sp.scientific}
                      role="option"
                      tabIndex={0}
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        handleDropdownSelect(sp.scientific);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleDropdownSelect(sp.scientific);
                        }
                      }}
                      style={{
                        padding: '10px 18px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        background: idx % 2 === 0 ? 'rgba(255,255,255,0.07)' : 'transparent',
                        borderBottom: idx < COMMON_SPECIES.length - 1 ? '1px solid #e6e6e6' : 'none',
                        fontWeight: 500,
                        color: '#fff',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#0f9d58')}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.07)' : 'transparent')}
                    >
                      <span style={{ fontWeight: 500 }}>{sp.common}</span>
                      <span style={{ color: '#e0ffe0', fontStyle: 'italic' }}>({sp.scientific})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generate button (green theme) */}
            <Button
              onClick={() => {
                const toSearch = inputValue.trim() || searchQuery;
                setSearchQuery(toSearch);
                generateTaxonomy(toSearch);
              }}
              disabled={loading}
              variant="hero"
              className="px-8"
              style={{
                background: '#03ae08ff',
                color: '#fff',
                border: 'none',
                padding: '10px 35px',
                borderRadius: 8,
                boxShadow: searchCardHover ? '0 8px 18px rgba(0, 0, 0, 0.23)' : 'none',
              }}
            >
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Taxonomy Chart with collapsible rank panels (card uses page green gradient theme) */}
      {taxonomyData && !loading && (
        <div className="space-y-8 animate-slide-up">
          {/* Hierarchy Tree (green gradient card background; panels remain bg-muted) */}
          <Card
            className="transition-all duration-300"
            aria-labelledby="taxonomy-card-title"
            style={{
              background: 'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
              color: '#0b0b0bff',
              borderRadius: 12,
              overflow: 'visible',
              boxShadow: '0 12px 30px rgba(16,185,129,0.12)',
            }}
          >
            <CardHeader style={{ color: '#f4f4f4ff', paddingBottom: 8 }}>
              <CardTitle id="taxonomy-card-title" className="flex items-center gap-2 text-2xl" style={{ color: '#fff' }}>
                <TreePine className="h-6 w-6 text-white" />
                Taxonomic Hierarchy: {taxonomyData.species}
              </CardTitle>
              <CardDescription style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Complete classification from Kingdom to Species. <span className="font-semibold">Hover any rank to reveal details.</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taxonomyData.hierarchy.map((level, index) => {
                  const key = level.name.toLowerCase();
                  const isOpen = !!openRanks[key];
                  const cached = rankCache.get(key);
                  const loadingRank = !!rankLoading[key];
                  const badgeColor = rankColors[(level.rank || '').toLowerCase()] || '#109C57';
                  return (
                    <div
                      key={key}
                      className="bg-muted rounded-lg"
                      onMouseEnter={() => {
                        setOpenRanks(prev => ({ ...prev, [key]: true }));
                        // fetch when entering if not cached
                        if (!rankCache.has(key)) {
                          setRankLoading(prev => ({ ...prev, [key]: true }));
                          aggregateRankData(level.name).finally(() => setRankLoading(prev => ({ ...prev, [key]: false })));
                        }
                      }}
                      onMouseLeave={() => setOpenRanks(prev => ({ ...prev, [key]: false }))}
                    >
                      <div
                        aria-expanded={isOpen}
                        aria-controls={`rank-panel-${index}`}
                        className="w-full flex items-center justify-between p-4 bg-transparent"
                        style={{ textAlign: 'left' }}
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <Badge
                            className="min-w-fit"
                            style={{ background: badgeColor, color: '#ffffffff', border: 'none' }}
                          >
                            {level.rank}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-lg">{level.name}</h4>
                            {level.description && <p className="text-sm text-muted-foreground">{level.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); refreshRank(level.name); }}
                            aria-label={`Refresh ${level.rank} info`}
                          >
                            ↻
                          </Button>
                          <ArrowRight
                            className="h-5 w-5 text-muted-foreground"
                            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }}
                          />
                        </div>
                      </div>

                      {/* Collapsible content (wiki-only) */}
                      <div
                        id={`rank-panel-${index}`}
                        role="region"
                        aria-hidden={!isOpen}
                        style={{
                          ...rankPanelStyle,
                          maxHeight: isOpen ? 600 : 0,
                          opacity: isOpen ? 1 : 0,
                          padding: isOpen ? '12px 16px' : '0 16px',
                        }}
                      >
                        {isOpen && (
                          <div>
                            {loadingRank && (
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-2/3" />
                                <Skeleton className="h-24 w-full" />
                              </div>
                            )}

                            {!loadingRank && cached && cached.wiki && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">Wikipedia</Badge>
                                  <span className="text-sm text-muted-foreground">Updated {new Date(cached.fetchedAt).toLocaleString()}</span>
                                </div>

                                <div>
                                  <h5 className="font-semibold">Wikipedia Summary</h5>
                                  <p className="text-sm">{cached.wiki.extract || 'No summary available.'}</p>
                                  {cached.wiki.pageUrl && <a href={cached.wiki.pageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary">View Article</a>}
                                </div>
                              </div>
                            )}

                            {!loadingRank && (!cached || !cached.wiki) && (
                              <div>
                                <p className="text-sm text-muted-foreground">No Wikipedia data available for this rank.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                   );
                 })}
              </div>
            </CardContent>
          </Card>

          {/* Fun Fact Card */}
          <Card
            className="transition-all duration-300"
            aria-labelledby="fun-fact-card-title"
            style={{
              background: 'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
              color: '#000000ff',
              borderRadius: 12,
              overflow: 'visible',
              boxShadow: '0 12px 30px rgba(16,185,129,0.12)',
            }}
          >
            <CardHeader style={{ paddingBottom: 8 }}>
              <CardTitle id="fun-fact-card-title" className="flex items-center gap-2" style={{ color: '#fff' }}>
                <Info className="h-5 w-5" style={{ color: '#fff' }} />
                Fun Fact
              </CardTitle>
              <CardDescription style={{ color: 'rgba(255,255,255,0.9)' }}>
                Did you know?
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* inner content preserved (no color change per request) */}
              <div className="p-4 bg-secondary rounded-lg text-base">
                {taxonomyData.funFact}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && (
        <Card className="animate-fade-in">
          <CardContent className="p-8 text-center">
            <TreePine className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
            <p className="text-lg">Generating taxonomic hierarchy...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaxonomyChart;