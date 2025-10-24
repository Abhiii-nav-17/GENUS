/**
 * Summary:
 * - Adds inline autocomplete suggestions (debounced 300ms) using a local list of scientific names.
 * - Shows up to 10 substring-matching suggestions; highlights matching text.
 * - Keyboard navigation: ArrowUp / ArrowDown / Enter / Escape for suggestions.
 * - Adds a dropdown of 10 common species (common + scientific) next to the input; selecting one auto-fills and triggers search.
 * - Ensures accessibility (ARIA roles/attributes), focus handling, and outside-click dismissal.
 * - Minimal scoped inline styles only; no global CSS changes or new dependencies.
 *
 * All changes confined to this file. Existing exports, props and handlers remain available; search logic is preserved.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Microscope,
  MapPin,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Zap,
  Eye,
  Activity
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Copy } from 'lucide-react';

// --- Local data for suggestions & dropdown ---
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

// Extended list used for substring matching suggestions (local, no external deps)
const ALL_SCIENTIFIC_NAMES: string[] = [
  ...COMMON_SPECIES.map(s => s.scientific),
  'Panthera tigris', 'Ailuropoda melanoleuca', 'Giraffa camelopardalis',
  'Hippopotamus amphibius', 'Crocodylus niloticus', 'Struthio camelus',
  'Spheniscus demersus', 'Gorilla gorilla', 'Pan troglodytes', 'Pongo pygmaeus'
];

// Simple debounced-value hook (typed)
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

interface AnimalData {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
  };
  pageimage?: string;
}

interface TraitData {
  behavioral: string[];
  physical: string[];
  ecological: string[];
  social: string[];
}

interface HealthData {
  commonDiseases: string[];
  riskFactors: string[];
  preventionMethods: string[];
}

const AnimalSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [animalData, setAnimalData] = useState<AnimalData | null>(null);
  const [traitData, setTraitData] = useState<TraitData | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // FASTA states
  const [fasta, setFasta] = useState<string | null>(null);
  const [fastaLoading, setFastaLoading] = useState(false);
  const [fastaError, setFastaError] = useState<string | null>(null);

  // Optionally clear FASTA data when search changes (non-destructive improvement)
  useEffect(() => {
    setFasta(null);
    setFastaError(null);
    setFastaLoading(false);
  }, [searchQuery]);

  // -------------------- Autocomplete & Dropdown state --------------------
  // inputValue is the live text in the input; searchQuery remains the committed term used elsewhere
  const [inputValue, setInputValue] = useState<string>('');
  const debouncedInput = useDebouncedValue<string>(inputValue, 300);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestionListRef = useRef<HTMLUListElement | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // NEW: hover state for the dynamic green-gradient search card
  const [searchCardHover, setSearchCardHover] = useState<boolean>(false);

  // keep inputValue synced when searchQuery is set by other flows
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // -------------------- searchAnimal preserved but accepts optional name --------------------
  // Keeping name optional preserves existing calls that pass nothing.
  const searchAnimal = useCallback(async (name?: string) => {
    const query = (name ?? searchQuery).trim();
    if (!query) {
      toast({
        title: 'Please enter a scientific name',
        description: 'Enter a valid animal scientific name to search.',
        variant: 'destructive'
      });
      return;
    }

    // commit the search query so other parts of the component reflect the chosen term
    setSearchQuery(query);

    setLoading(true);
    try {
      // Wikipedia API call
      const wikiResponse = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
      );

      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json();
        setAnimalData(wikiData);

        // Generate relevant traits and health data based on animal type
        const traits = generateTraitData(query, wikiData.extract || '');
        const healthInfo = generateHealthData(query, wikiData.extract || '');
        setTraitData(traits);
        setHealthData(healthInfo);

        toast({
          title: 'Animal data found!',
          description: `Successfully retrieved information for ${wikiData.title}`
        });
      } else {
        throw new Error('Animal not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search failed',
        description: 'Could not find information for this animal. Please check the scientific name.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toast]);
  // ---------------------------------------------------------------------------

  const generateTraitData = (scientificName: string, description: string): TraitData => {
    const lowerName = scientificName.toLowerCase();
    const lowerDesc = (description || '').toLowerCase();

    let behavioral: string[] = [];
    let physical: string[] = [];
    let ecological: string[] = [];
    let social: string[] = [];

    // Mammals
    if (
      lowerDesc.includes('mammal') ||
      lowerName.includes('homo') ||
      lowerName.includes('canis') ||
      lowerName.includes('felis')
    ) {
      if (lowerName.includes('homo')) {
        behavioral = [
          'Highly intelligent problem solving',
          'Tool creation and use',
          'Complex language communication',
          'Cultural learning'
        ];
        physical = ['Bipedal locomotion', 'Opposable thumbs', 'Large brain-to-body ratio', 'Reduced body hair'];
        ecological = ['Global habitat adaptation', 'Omnivorous diet', 'Agricultural development', 'Urban environment creation'];
        social = ['Complex social hierarchies', 'Cooperative breeding', 'Cultural transmission', 'Large group coordination'];
      } else if (lowerName.includes('canis')) {
        behavioral = ['Pack hunting strategies', 'Territorial marking', 'Howling communication', 'Denning behavior'];
        physical = ['Sharp canine teeth', 'Powerful jaw muscles', 'Acute hearing and smell', 'Double-layered coat'];
        ecological = ['Forest and grassland habitats', 'Apex predator role', 'Wide territory range', 'Seasonal migration'];
        social = ['Alpha-beta pack structure', 'Cooperative hunting', 'Pup rearing cooperation', 'Territorial defense'];
      } else if (lowerName.includes('felis')) {
        behavioral = ['Solitary hunting', 'Crepuscular activity', 'Territorial scent marking', 'Grooming rituals'];
        physical = ['Retractable claws', 'Flexible spine', 'Night vision adaptation', 'Sensitive whiskers'];
        ecological = ['Diverse habitat adaptation', 'Carnivorous diet', 'Efficient predator', 'Minimal water needs'];
        social = ['Primarily solitary', 'Territorial boundaries', 'Seasonal mating', 'Mother-offspring bonds'];
      } else {
        behavioral = ['Foraging patterns', 'Seasonal behaviors', 'Mating rituals', 'Parental care'];
        physical = ['Warm-blooded metabolism', 'Hair or fur covering', 'Milk production', 'Four-chambered heart'];
        ecological = ['Diverse habitat use', 'Various diet preferences', 'Temperature regulation', 'Shelter construction'];
        social = ['Variable social structures', 'Communication systems', 'Group or solitary living', 'Offspring care'];
      }
    }
    // Birds
    else if (lowerDesc.includes('bird') || lowerName.includes('aves') || lowerDesc.includes('fly')) {
      behavioral = ['Migratory patterns', 'Nest building', 'Song communication', 'Territorial displays'];
      physical = ['Hollow bones', 'Feathered wings', 'Beak adaptation', 'Excellent vision'];
      ecological = ['Aerial habitat use', 'Seed dispersal role', 'Insect control', 'Various altitude ranges'];
      social = ['Flocking behavior', 'Mating displays', 'Nest site selection', 'Parental cooperation'];
    }
    // Reptiles
    else if (lowerDesc.includes('reptile') || lowerDesc.includes('snake') || lowerDesc.includes('lizard')) {
      behavioral = ['Basking behavior', 'Hibernation/brumation', 'Territorial defense', 'Ambush hunting'];
      physical = ['Scales or scutes', 'Cold-blooded metabolism', 'Limb reduction (snakes)', 'Periodic shedding'];
      ecological = ['Temperature-dependent activity', 'Diverse habitat use', 'Carnivorous or omnivorous', 'Shelter seeking'];
      social = ['Mostly solitary', 'Seasonal aggregation', 'Territorial behaviors', 'Minimal parental care'];
    }
    // Fish/Aquatic
    else if (lowerDesc.includes('fish') || lowerDesc.includes('aquatic') || lowerDesc.includes('water')) {
      behavioral = ['Schooling behavior', 'Spawning migrations', 'Feeding patterns', 'Depth preferences'];
      physical = ['Streamlined body', 'Gills for respiration', 'Lateral line system', 'Swim bladder'];
      ecological = ['Aquatic habitat specialist', 'Water quality dependent', 'Food chain participant', 'Oxygen level sensitive'];
      social = ['School formation', 'Spawning aggregations', 'Territorial defense', 'Predator avoidance'];
    }
    // Insects
    else if (lowerDesc.includes('insect') || lowerDesc.includes('beetle') || lowerDesc.includes('butterfly')) {
      behavioral = ['Metamorphosis stages', 'Pollination activity', 'Seasonal emergence', 'Navigation patterns'];
      physical = ['Exoskeleton structure', 'Compound eyes', 'Antennae sensitivity', 'Six legs'];
      ecological = ['Plant-insect relationships', 'Decomposer role', 'Pollinator services', 'Food web base'];
      social = ['Colony organization', 'Chemical communication', 'Division of labor', 'Swarm behavior'];
    }
    // Default traits
    else {
      behavioral = ['Feeding behaviors', 'Locomotion patterns', 'Reproductive cycles', 'Adaptive responses'];
      physical = ['Species-specific anatomy', 'Sensory adaptations', 'Structural features', 'Size characteristics'];
      ecological = ['Habitat preferences', 'Environmental interactions', 'Resource utilization', 'Ecosystem role'];
      social = ['Interaction patterns', 'Communication methods', 'Group dynamics', 'Reproductive strategies'];
    }

    return { behavioral, physical, ecological, social };
  };

  const generateHealthData = (scientificName: string, description: string): HealthData => {
    const lowerName = scientificName.toLowerCase();
    const lowerDesc = (description || '').toLowerCase();

    let diseases: string[] = [];
    let risks: string[] = [];
    let prevention: string[] = [];

    // Mammals
    if (
      lowerDesc.includes('mammal') ||
      lowerName.includes('homo') ||
      lowerName.includes('canis') ||
      lowerName.includes('felis')
    ) {
      diseases = ['Parasitic infections', 'Respiratory diseases', 'Skin conditions', 'Digestive disorders'];
      risks = ['Poor nutrition', 'Environmental stress', 'Overcrowding', 'Seasonal changes'];
      prevention = ['Regular health monitoring', 'Balanced diet', 'Clean environment', 'Vaccination programs'];
    }
    // Birds
    else if (lowerDesc.includes('bird') || lowerName.includes('aves') || lowerDesc.includes('fly')) {
      diseases = ['Avian influenza', 'Parasitic worms', 'Feather disorders', 'Respiratory infections'];
      risks = ['Migration stress', 'Habitat loss', 'Climate change', 'Pollution exposure'];
      prevention = ['Habitat conservation', 'Disease surveillance', 'Reduced human interference', 'Clean water access'];
    }
    // Reptiles
    else if (lowerDesc.includes('reptile') || lowerDesc.includes('snake') || lowerDesc.includes('lizard')) {
      diseases = ['Metabolic bone disease', 'Respiratory infections', 'Parasitic diseases', 'Skin problems'];
      risks = ['Temperature fluctuation', 'Humidity changes', 'Poor diet', 'Stress from handling'];
      prevention = ['Proper thermal regulation', 'Humidity control', 'Species-appropriate diet', 'Minimal disturbance'];
    }
    // Fish/Aquatic
    else if (lowerDesc.includes('fish') || lowerDesc.includes('aquatic') || lowerDesc.includes('water')) {
      diseases = ['Bacterial infections', 'Fungal diseases', 'Parasitic infestations', 'Viral diseases'];
      risks = ['Water pollution', 'Temperature changes', 'pH imbalance', 'Overcrowding'];
      prevention = ['Water quality monitoring', 'Proper filtration', 'Temperature control', 'Regular health checks'];
    }
    // Insects
    else if (lowerDesc.includes('insect') || lowerDesc.includes('beetle') || lowerDesc.includes('butterfly')) {
      diseases = ['Fungal infections', 'Viral diseases', 'Bacterial sepsis', 'Parasitic mites'];
      risks = ['Pesticide exposure', 'Habitat destruction', 'Climate change', 'Natural predators'];
      prevention = ['Pesticide reduction', 'Habitat preservation', 'Integrated pest management', 'Biodiversity conservation'];
    }
    // Default for other animals
    else {
      diseases = ['Infectious diseases', 'Parasitic infections', 'Environmental stress disorders', 'Nutritional deficiencies'];
      risks = ['Habitat degradation', 'Climate change', 'Human interference', 'Pollution exposure'];
      prevention = ['Habitat conservation', 'Environmental monitoring', 'Research programs', 'Conservation efforts'];
    }

    return { commonDiseases: diseases, riskFactors: risks, preventionMethods: prevention };
  };

  // --- new: Hover wrapper for consistent hover/focus visuals (keyboard accessible) ---
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

  // session FASTA cache so repeated requests are avoided
  const fastaCache = useRef<Map<string, string>>(new Map()).current;

  // updated fetchFasta uses cache and sets state; respects AbortController where possible
  const fetchFasta = useCallback(async (query: string, signal?: AbortSignal) => {
    const q = (query || '').trim();
    if (!q) return;
    // if cached, reuse
    if (fastaCache.has(q)) {
      setFasta(fastaCache.get(q)!);
      setFastaError(null);
      setFastaLoading(false);
      return;
    }

    setFastaLoading(true);
    setFasta(null);
    setFastaError(null);

    try {
      // ESearch -> EFetch pattern with a timeout-friendly fetch
      const esearchRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nuccore&term=${encodeURIComponent(q)}[Organism]&retmax=1&retmode=json`, { signal });
      if (!esearchRes.ok) throw new Error('NCBI search failed');
      const esj = await esearchRes.json();
      const id = esj?.esearchresult?.idlist?.[0];
      if (!id) {
        setFastaError('No sequence found.');
        setFastaLoading(false);
        return;
      }

      const efetchRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=${id}&rettype=fasta&retmode=text`, { signal });
      if (!efetchRes.ok) throw new Error('NCBI efetch failed');
      const fastaText = await efetchRes.text();

      // cache & set
      fastaCache.set(q, fastaText);
      setFasta(fastaText);
      setFastaError(null);
    } catch (err: unknown) {
      if ((err as any)?.name === 'AbortError') {
        // request was aborted - leave state as-is
      } else {
        console.error('FASTA fetch error:', err);
        setFastaError((err as Error).message || 'Error fetching FASTA.');
      }
    } finally {
      setFastaLoading(false);
    }
  }, [fastaCache]);

  // Download helper: create a file from FASTA text and trigger browser download
  const downloadFasta = useCallback((text: string | null, filename = 'sequence.fasta') => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  // Auto-trigger FASTA fetch whenever a new searchQuery / animalData arrives, cancel stale requests
  useEffect(() => {
    if (!searchQuery) return;
    const controller = new AbortController();
    // only auto-fetch if not already cached
    if (!fastaCache.has(searchQuery)) {
      fetchFasta(searchQuery, controller.signal);
    } else {
      setFasta(fastaCache.get(searchQuery)!);
      setFastaError(null);
    }
    return () => controller.abort();
  }, [searchQuery, animalData, fetchFasta, fastaCache]);

  // -------------------- Autocomplete effect (debounced) --------------------
  useEffect(() => {
    const q = debouncedInput.trim();
    if (q.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }
    // substring matching, case-insensitive, capped at 10
    const filtered = ALL_SCIENTIFIC_NAMES
      .filter((name) => name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 10);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setActiveSuggestionIndex(-1);
  }, [debouncedInput]);

  // -------------------- Outside click dismissal --------------------
  useEffect(() => {
    const onDown = (ev: MouseEvent) => {
      const target = ev.target as Node | null;
      if (
        target &&
        !inputRef.current?.contains(target) &&
        !suggestionListRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setShowSuggestions(false);
        setDropdownOpen(false);
        setActiveSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // -------------------- Keyboard navigation and selection --------------------
  const chooseSuggestion = (name: string) => {
    // commit and run search
    setInputValue(name);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    searchAnimal(name);
    // blur to reduce accidental further key events; keeps focus accessible choice predictable
    inputRef.current?.blur();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => Math.max(prev - 1, -1));
        return;
      }
      if (e.key === 'Enter') {
        // if a suggestion is active, pick it
        if (activeSuggestionIndex >= 0) {
          e.preventDefault();
          chooseSuggestion(suggestions[activeSuggestionIndex]);
          return;
        }
        // otherwise commit a search for the current input
        e.preventDefault();
        searchAnimal(inputValue);
        setShowSuggestions(false);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        return;
      }
    } else {
      // when not showing suggestions, Enter still triggers search
      if (e.key === 'Enter') {
        e.preventDefault();
        searchAnimal(inputValue);
      }
    }
  };

  // original handler preserved (some components use it)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchAnimal(inputValue);
    }
  };

  // -------------------- Dropdown selection --------------------
  const handleDropdownSelect = (scientificName: string) => {
    setInputValue(scientificName);
    setDropdownOpen(false);
    searchAnimal(scientificName);
    inputRef.current?.blur();
  };

  // -------------------- Highlighting helper --------------------
  const highlightMatch = (text: string, q: string) => {
    const qi = q.trim().toLowerCase();
    if (!qi) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(qi);
    if (idx === -1) return <span>{text}</span>;
    return (
      <span>
        {text.slice(0, idx)}
        <mark style={{ backgroundColor: '#c0ffbfff', padding: 0 }}>{text.slice(idx, idx + qi.length)}</mark>
        {text.slice(idx + qi.length)}
      </span>
    );
  };

  // -------------------- Minimal inline styles for suggestions/dropdown --------------------
  const suggestionListStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    background: '#0e932fff',
    border: '1px solid #e6e6e6',
    borderRadius: 6,
    boxShadow: '0 6px 18px rgba(50, 50, 50, 1)',
    zIndex: 2400, // stays high so suggestions are above cards
    listStyle: 'none',
    padding: 0,
    maxHeight: 220,
    overflowY: 'auto',
  };

  const dropdownBoxStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 6,
    background: '#0e932fff',
    border: '1px solid #e6e6e6',
    borderRadius: 6,
    boxShadow: '0 6px 18px rgba(50, 50, 50, 1)',
    zIndex: 2400, // stays high so dropdown is above cards
    minWidth: 260,
    padding: '6px 0',
    // fix: ensure dropdown is not clipped and items are spaced
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  };

  // Helper: strip HTML to plain text
  const stripHtml = (html: string) => {
    if (!html) return '';
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return (doc.body.textContent || '').trim();
    } catch {
      return html.replace(/<\/?[^>]+(>|$)/g, '').trim();
    }
  };

  // Fetch a single long paragraph from Wikipedia (lead + most relevant sections)
  const fetchDetailedDescription = async (title: string) => {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(title)}`;
      const res = await fetch(url);
      if (!res.ok) return '';
      const data = await res.json();
      // collect lead + prioritized sections
      const leadText = stripHtml(data?.lead?.sections?.map((s: any) => s.text).join(' ') || data?.lead?.displaytitle || '');
      const remaining = Array.isArray(data?.remaining?.sections) ? data.remaining.sections : [];
      // prefer Description/Appearance/Taxonomy/Behavior/Ecology/Distribution sections
      const priority = ['description', 'appearance', 'anatomy', 'behavior', 'ecology', 'distribution', 'habitat', 'taxonomy', 'range', 'diet'];
      const collected: string[] = [];
      // start with lead
      if (leadText) collected.push(leadText);
      for (const p of priority) {
        const s = remaining.find((sec: any) => (sec.heading || '').toLowerCase().includes(p));
        if (s && s.text) collected.push(stripHtml(s.text));
      }
      // fallback: include first few remaining sections if still empty
      if (collected.length === 0 && remaining.length > 0) {
        collected.push(...remaining.slice(0, 3).map((s: any) => stripHtml(s.text || '')));
      }
      // join into a single long paragraph (preserve sentences)
      const joined = collected.filter(Boolean).join(' ');
      // cleanup whitespace
      return joined.replace(/\s+/g, ' ').trim();
    } catch {
      return '';
    }
  };

  // state: enriched long paragraph
  const [detailedDescription, setDetailedDescription] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    if (!animalData?.title) {
      setDetailedDescription('');
      return;
    }
    setDetailedDescription(''); // clear while fetching
    fetchDetailedDescription(animalData.title).then((txt) => {
      if (!mounted) return;
      if (txt && txt.length > 20) setDetailedDescription(txt);
      else setDetailedDescription(animalData.extract || '');
    }).catch(() => {
      if (mounted) setDetailedDescription(animalData.extract || '');
    });
    return () => { mounted = false; };
  }, [animalData?.title, animalData?.extract]);

  // Add ExpandableItem and helper to generate a longer descriptive paragraph per item
  const generateDetails = (label: string) => {
    return `${label}. ${label} in many species can be described in greater detail: this characteristic often influences ecology, behavior and interactions with other organisms. In natural history accounts ${label.toLowerCase()} is frequently associated with adaptations to local habitats, trade-offs in physiology and life-history, and relationships with predators, prey, or conspecifics. Management and conservation literature also notes how ${label.toLowerCase()} may change under anthropogenic pressure, climate variability, and in response to resource availability.`;
  };

  const ExpandableItem: React.FC<{
    title: string;
    ariaId?: string;
  }> = ({ title, ariaId }) => {
    const [hover, setHover] = useState(false);
    const [focused, setFocused] = useState(false);
    // auto-expanded when hovered or focused
    const expanded = hover || focused;

    return (
      <div
        id={ariaId}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onKeyDown={(e) => {
          // keep keyboard simple: Enter/Space do not toggle (expansion follows focus)
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
          }
        }}
        style={{
          cursor: 'pointer',
          borderRadius: 10,
          padding: 12,
          // Avoid using translateY/scale on expand to prevent overlap-driven sibling hover.
          // Expansion is handled by an inner content area that grows via maxHeight/opacity.
          background: expanded ? '#c9ffdfff' : '#d5ffdfff',
          border: '1px solid rgba(0,0,0,0.04)',
          boxShadow: expanded ? '0 8px 20px rgba(6,55,30,0.06)' : '0 2px 6px rgba(0,0,0,0.03)',
          transition: 'box-shadow 160ms ease, background 160ms ease, border 120ms ease',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontWeight: 600, color: '#04351f' }}>{title}</div>
          <div style={{ color: '#04351f', fontSize: 12 }}>{expanded ? '–' : '+'}</div>
        </div>

        {/* Inner expandable content — uses maxHeight transition so layout changes are contained */}
        <div
          aria-hidden={!expanded}
          style={{
            marginTop: 10,
            color: '#063f1f',
            lineHeight: 1.6,
            textAlign: 'justify',
            background: 'rgba(255,255,255,0.02)',
            padding: expanded ? 8 : 0,
            borderRadius: 8,
            // transition height/opacity smoothly without moving the element outwards
            maxHeight: expanded ? 220 : 0,
            opacity: expanded ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 220ms ease, opacity 180ms ease, padding 160ms ease',
          }}
        >
          {generateDetails(title)}
        </div>
      </div>
    );
  };

  // -------------------- JSX: replace only the input region (rest unchanged) --------------------
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Microscope className="h-10 w-10 text-primary" />
          Species Search Database
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Enter a "Scientific Name" to discover comprehensive information about any animal species
        </p>
      </div>

      {/* Search Section — UPDATED: green-gradient, hoverable, dynamic card (suggestions/dropdown unchanged) */}
      <Card
        className="mb-8 animate-slide-up"
        onMouseEnter={() => setSearchCardHover(true)}
        onMouseLeave={() => setSearchCardHover(false)}
        style={{
          borderRadius: 12,
          padding: 0,
          // allow popovers to escape the card's box so suggestions/dropdown are visible
          overflow: 'visible',
          // green gradient matching nav header
          background: 'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
          color: '#ffffff',
          transform: searchCardHover ? 'translateY(-6px)' : 'translateY(0)',
          boxShadow: searchCardHover ? '0 20px 50px rgba(16,185,129,0.16)' : '0 8px 24px rgba(15,23,42,0.06)',
          transition: 'transform 180ms ease, box-shadow 180ms ease, background 220ms ease',
        }}
        aria-label="Species search card"
      >
        <CardHeader style={{ padding: '18px 20px', background: 'transparent' }}>
          <CardTitle className="flex items-center gap-2" style={{ color: '#ffffff', display: 'flex', alignItems: 'center' }}>
            <Search style={{ width: 20, height: 20, color: '#fff' }} />
            <span style={{ fontWeight: 700 }}>Search Species</span>
          </CardTitle>
          <CardDescription style={{ color: 'rgba(255,255,255,0.9)' }}>
            Enter the scientific name (e.g., "Panthera leo", "Homo sapiens", "Canis lupus")
          </CardDescription>
        </CardHeader>
        <CardContent style={{ padding: 16, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00))' }}>
          <div className="flex gap-4" style={{ position: 'relative', alignItems: 'flex-start' }}>
            {/* Input + Autocomplete (behavior unchanged) */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Input
                placeholder="Enter scientific name..."
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setInputValue(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    setShowSuggestions(true);
                  } else {
                    setShowSuggestions(false);
                    setSuggestions([]);
                  }
                }}
                onKeyPress={handleKeyPress}
                onKeyDown={handleInputKeyDown}
                ref={inputRef}
                className="flex-1"
                aria-autocomplete="list"
                aria-controls="autocomplete-listbox"
                aria-expanded={showSuggestions}
                aria-activedescendant={activeSuggestionIndex >= 0 ? `suggestion-${activeSuggestionIndex}` : undefined}
                autoComplete="off"
                style={{
                  background: 'rgba(255, 255, 255, 1)',
                  color: '#191919ff',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '10px 12px',
                  borderRadius: 8,
                }}
              />
              {/* suggestions dropdown rendered unchanged */}
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  id="autocomplete-listbox"
                  role="listbox"
                  ref={suggestionListRef}
                  style={suggestionListStyle}
                  aria-label="Search suggestions"
                >
                  {suggestions.map((s, idx) => (
                    <li
                      key={s}
                      id={`suggestion-${idx}`}
                      role="option"
                      aria-selected={activeSuggestionIndex === idx}
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        chooseSuggestion(s);
                      }}
                      onMouseEnter={() => setActiveSuggestionIndex(idx)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor: activeSuggestionIndex === idx ? '#b5b7b6' : 'transparent',
                        fontWeight: activeSuggestionIndex === idx ? 600 : 400,
                      }}
                    >
                      {highlightMatch(s, debouncedInput)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Dropdown of common species (behavior unchanged) */}
            <div style={{ position: 'relative', zIndex: 2400 }} ref={dropdownRef}>
              <Button
                type="button"
                variant="outline"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                aria-controls="species-dropdown"
                onClick={() => setDropdownOpen((v) => !v)}
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
                <div id="species-dropdown" role="listbox" style={dropdownBoxStyle}>
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
                        alignItems: 'center',
                        gap: 12,
                        background: idx % 2 === 0 ? 'rgba(255,255,255,0.07)' : 'transparent',
                        borderBottom: idx < COMMON_SPECIES.length - 1 ? '1px solid #e6e6e6' : 'none',
                        fontWeight: 500,
                        color: '#fff',
                        transition: 'background 120ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#0f9d58')}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.07)' : 'transparent')}
                    >
                      <span>{sp.common}</span>
                      <span style={{ color: '#e0ffe0', fontStyle: 'italic' }}>({sp.scientific})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search button updated to match green theme */}
            <Button
              onClick={() => {
                const toSearch = inputValue.trim() || searchQuery;
                searchAnimal(toSearch);
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
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-18" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results */}
      {animalData && !loading && (
        <div className="space-y-8 animate-slide-up">
          {/* Species Information */}
          <HoverWrapper style={{
            marginBottom: 0,
            zIndex: 1,
          }}>
            <Card
              className="transition-all duration-300"
              aria-labelledby="species-card-title"
              style={{
                background: 'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
                color: '#fff',
                borderRadius: 12,
                overflow: 'visible',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
              }}
            >
              <CardHeader>
                <CardTitle id="species-card-title" className="flex items-center gap-2 text-2xl" style={{ color: '#fff' }}>
                  <MapPin className="h-6 w-6 text-white" />
                  {animalData.title}
                </CardTitle>
                <Badge variant="secondary" className="w-fit" style={{ background: '#fff', color: '#109C57' }}>
                  Scientific Name: {searchQuery}
                </Badge>
              </CardHeader>
              <CardContent>
                {(animalData.thumbnail?.source || animalData.pageimage) && (
                  <img
                    src={animalData.thumbnail?.source || animalData.pageimage}
                    alt={animalData.title}
                    className="w-50 h-48 object-cover rounded-lg mb-4 shadow-sm"
                    style={{ display: 'block', border: '2px solid #fff' }}
                  />
                )}
                <section style={{ marginBottom: 18 }}>
                  <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>Overview</h4>
                  <p style={{ color: '#eaffea', lineHeight: 1.6, textAlign: 'justify' }}>
                    {detailedDescription || animalData.extract || 'No detailed description available.'}
                  </p>
                </section>
              </CardContent>
            </Card>
          </HoverWrapper>

          {/* Traits and Health stacked as full-width cards to match species info width */}
          <div style={{ display: 'grid', gap: 12 }}>
            {/* Animal Traits — full width */}
            {traitData && (
              <HoverWrapper>
                <Card
                  className="transition-all duration-300"
                  aria-labelledby="traits-card-title"
                  style={{
                    background: 'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
                    color: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 12px 30px rgba(16,185,129,0.12)',
                    overflow: 'visible',
                  }}
                >
                  <CardHeader>
                    <CardTitle id="traits-card-title" className="flex items-center gap-2 text-2xl" style={{ color: '#fff' }}>
                      <Zap className="h-6 w-6" />
                      Species Traits
                    </CardTitle>
                    <CardDescription style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Behavioral, physical, and ecological characteristics</CardDescription>
                  </CardHeader>
                  <CardContent style={{ display: 'grid', gap: 12 }}>
                    {[
                      { title: 'Behavioral Traits', items: traitData.behavioral },
                      { title: 'Physical Traits', items: traitData.physical },
                      { title: 'Ecological Traits', items: traitData.ecological },
                      { title: 'Social Traits', items: traitData.social },
                    ].map((group) => (
                      <div key={group.title}>
                        <h4 style={{ marginBottom: 8, color: '#eaffea', fontWeight: 600 }}>{group.title}</h4>
                        {/* larger min width so tiles display well across the wider card */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                          {group.items.map((item, idx) => (
                            <ExpandableItem key={`${group.title}-${idx}`} title={item} ariaId={`${group.title}-${idx}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </HoverWrapper>
            )}

            {/* Health Information — full width */}
            {healthData && (
              <HoverWrapper>
                <Card
                  className="transition-all duration-300"
                  aria-labelledby="health-card-title"
                  style={{
                    background: 'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
                    color: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 12px 30px rgba(16,185,129,0.12)',
                    overflow: 'visible',
                  }}
                >
                  <CardHeader>
                    <CardTitle id="health-card-title" className="flex items-center gap-2 text-2xl" style={{ color: '#fff' }}>
                      <AlertTriangle className="h-6 w-6" />
                      Health Analysis
                    </CardTitle>
                    <CardDescription style={{ color: 'rgba(255,255,255,0.9)' }}>Potential health concerns and prevention strategies</CardDescription>
                  </CardHeader>
                  <CardContent style={{ display: 'grid', gap: 12 }}>
                    {[
                      { title: 'Common Diseases', items: healthData.commonDiseases },
                      { title: 'Risk Factors', items: healthData.riskFactors },
                      { title: 'Prevention Methods', items: healthData.preventionMethods },
                    ].map((group) => (
                      <div key={group.title}>
                        <h4 style={{ marginBottom: 8, color: '#eaffea', fontWeight: 600 }}>{group.title}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                          {group.items.map((item, idx) => (
                            <ExpandableItem key={`${group.title}-${idx}`} title={item} ariaId={`${group.title}-${idx}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </HoverWrapper>
            )}
          </div>

          {/* FASTA Sequence Card (auto-fetches; copy / download / explore actions) */}
          <HoverWrapper>
            <Card
              className="transition-all duration-300"
              aria-labelledby="fasta-card-title"
              style={{
                background: 'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
                color: '#fff',
                borderRadius: 12,
                boxShadow: '0 12px 30px rgba(16,185,129,0.12)',
                overflow: 'visible',
              }}
            >
              <CardHeader>
                <CardTitle id="fasta-card-title" className="flex items-center gap-2 text-2xl" style={{ color: '#fff' }}>
                  <Calendar className="h-6 w-6" />
                  DNA FASTA Sequence
                </CardTitle>
                <CardDescription style={{ color: 'rgba(255,255,255,0.9)' }}>Representative nucleotide sequence</CardDescription>
              </CardHeader>
              <CardContent>
                {fastaLoading && <div style={{ color: '#eaffea', marginBottom: 8 }}>Fetching representative sequence…</div>}
                {fastaError && <div style={{ color: '#ffdede', marginBottom: 8 }}>{fastaError}</div>}

                {fasta ? (
                  <>
                    <div className="relative mb-4">
                      <pre
                        className="p-4 rounded text-xs overflow-x-auto max-h-64"
                        style={{
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          color: '#073a20',
                          background: 'rgba(255,255,255,0.95)',
                          borderRadius: 8,
                          padding: 12,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
                        }}
                      >
                        {fasta}
                      </pre>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { navigator.clipboard.writeText(fasta); toast({ title: 'Copied!', description: 'FASTA copied to clipboard.' }); }}
                        style={{ background: '#03ae08ff', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 8 }}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => downloadFasta(fasta, `${searchQuery.replace(/\s+/g,'_')}.fasta`)}
                        style={{ background: '#03ae08ff', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 8 }}
                      >
                        Download FASTA
                      </Button>

                      <Button size="sm" style={{ background: '#03ae08ff', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 8 }} asChild>
                        <a href={`https://blast.ncbi.nlm.nih.gov/Blast.cgi?PROGRAM=blastn&BLAST_SPEC=blast2seq&QUERY=${encodeURIComponent(searchQuery)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>
                          Explore (BLAST)
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#eaffea' }}>
                    No FASTA available yet. A representative sequence will be fetched automatically when available.
                  </div>
                )}
              </CardContent>
            </Card>
          </HoverWrapper>

          {/* Taxonomy Button */}
          <div className="mt-8 text-center">
            <Button
              asChild
              style={{
                background: 'linear-gradient(90deg,#0f9d58 0%,#2e7d32 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: 8,
                boxShadow: '0 8px 20px rgba(16,185,129,0.12)',
              }}
            >
              <a
                href={`/taxonomy?species=${encodeURIComponent(searchQuery)}`}
                style={{ color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                View Taxonomy Chart
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalSearch;
