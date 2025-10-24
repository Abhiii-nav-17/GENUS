import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
} from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './AnimalSearch.css';

interface AnimalSearchProps {
  initialSearchTerm?: string;
}

const AnimalSearch: React.FC<AnimalSearchProps> = ({ initialSearchTerm = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1); // -1 means no suggestion is selected
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // List of common species with scientific names
  const commonSpecies = [
    { scientificName: 'Panthera leo', commonName: 'Lion' },
    { scientificName: 'Elephas maximus', commonName: 'Asian Elephant' },
    { scientificName: 'Ursus arctos', commonName: 'Brown Bear' },
    { scientificName: 'Canis lupus', commonName: 'Gray Wolf' },
    { scientificName: 'Felis catus', commonName: 'Domestic Cat' },
    { scientificName: 'Equus caballus', commonName: 'Horse' },
    { scientificName: 'Bos taurus', commonName: 'Domestic Cattle' },
    { scientificName: 'Sus scrofa', commonName: 'Wild Boar' },
    { scientificName: 'Vulpes vulpes', commonName: 'Red Fox' },
    { scientificName: 'Homo sapiens', commonName: 'Human' },
  ];

  // All scientific names for autocomplete
  const allScientificNames = [
    'Panthera leo', 'Elephas maximus', 'Ursus arctos', 'Canis lupus',
    'Felis catus', 'Equus caballus', 'Bos taurus', 'Sus scrofa',
    'Vulpes vulpes', 'Homo sapiens', 'Panthera tigris', 'Ailuropoda melanoleuca',
    'Giraffa camelopardalis', 'Hippopotamus amphibius', 'Crocodylus niloticus',
    'Struthio camelus', 'Spheniscus demersus', 'Gorilla gorilla', 'Pan troglodytes',
    'Pongo pygmaeus', 'Acinonyx jubatus', 'Loxodonta africana', 'Rangifer tarandus', 'Odobenus rosmarus',
    'Delphinus delphis', 'Balaenoptera musculus', 'Orcinus orca', 'Physeter macrocephalus',
    'Eschrichtius robustus', 'Tursiops truncatus', 'Phascolarctos cinereus', 'Macropus rufus',
    'Sarcophilus harrisii', 'Didelphis virginiana', 'Cervus elaphus', 'Alces alces',
    'Capra aegagrus hircus', 'Ovis aries', 'Camelus dromedarius', 'Camelus bactrianus',
    'Tapirus terrestris', 'Manis javanica', 'Erinaceus europaeus', 'Talpa europaea',
    'Lutra lutra', 'Mustela putorius furo', 'Enhydra lutris', 'Neofelis nebulosa',
    'Prionailurus bengalensis', 'Caracal caracal', 'Lynx lynx', 'Herpestes ichneumon',
    'Meles meles', 'Taxidea taxus', 'Procyon lotor', 'Nasua nasua',
    'Alligator mississippiensis', 'Gavialis gangeticus', 'Chelonia mydas', 'Dermochelys coriacea',
    'Testudo graeca', 'Iguana iguana', 'Varanus komodoensis', 'Chamaeleo calyptratus',
    'Python bivittatus', 'Eunectes murinus', 'Crotalus adamanteus', 'Naja naja',
    'Dendrobates tinctorius', 'Ambystoma mexicanum', 'Bufo bufo', 'Rana temporaria',
    'Aquila chrysaetos', 'Haliaeetus leucocephalus', 'Buteo buteo', 'Tyto alba',
    'Strix aluco', 'Corvus corax', 'Pica pica', 'Cyanocitta cristata',
    'Psittacus erithacus', 'Ara macao', 'Cacatua galerita', 'Melopsittacus undulatus',
    'Columba livia', 'Zenaida macroura', 'Apus apus', 'Trochilidae trochilus',
    'Phoenicopterus roseus', 'Anas platyrhynchos', 'Cygnus olor', 'Branta canadensis',
    'Aptenodytes forsteri', 'Eudyptula minor', 'Diomedea exulans', 'Sterna paradisaea',
    'Falco peregrinus', 'Falco tinnunculus', 'Accipiter gentilis', 'Milvus milvus',
    'Carcharodon carcharias', 'Galeocerdo cuvier', 'Sphyrna mokarran', 'Rhincodon typus',
    'Selachimorpha pristis', 'Mobula birostris', 'Dasyatis pastinaca', 'Pristis pristis',
    'Hippocampus hippocampus', 'Syngnathus acus', 'Salmo salar', 'Oncorhynchus mykiss',
    'Anguilla anguilla', 'Clupea harengus', 'Thunnus thynnus', 'Xiphias gladius',
    'Ictalurus punctatus', 'Silurus glanis', 'Pangasianodon hypophthalmus', 'Electrophorus electricus'

  ];

  // Debounce function
  const debounce = (func: (value: string) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return function (value: string) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(value);
      }, delay);
    };
  };

  // Function to handle search logic
  const handleSearch = (term: string) => {
    setSearchParams({ query: term });
    navigate(`/?query=${encodeURIComponent(term)}`);
  };

  // Debounced set search term
  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSetSearchTerm(value);
    setSuggestionIndex(-1); // Reset suggestion index
  };

  // Update suggestions based on searchTerm
  useEffect(() => {
    if (searchTerm) {
      const filteredSuggestions = allScientificNames.filter(name =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10); // Limit to 10 suggestions
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    handleSearch(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
    searchInputRef?.current?.blur(); // Remove focus from input
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
    setSuggestions([]);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
    searchInputRef?.current?.blur(); // Remove focus from input
  };

  // Handle keydown events for keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); // Prevent scrolling the page
      setSuggestionIndex((prevIndex) =>
        Math.min(prevIndex + 1, suggestions.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); // Prevent cursor moving to start of input
      setSuggestionIndex((prevIndex) => Math.max(prevIndex - 1, -1));
    } else if (e.key === 'Enter' && suggestionIndex > -1) {
      e.preventDefault(); // Prevent form submission
      handleSuggestionClick(suggestions[suggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestionIndex(-1);
    }
  };

  // Highlight matched text in suggestions
  const highlightMatch = (text: string) => {
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) {
      return <span>{text}</span>;
    }
    return (
      <span>
        {text.substring(0, index)}
        <mark>{text.substring(index, index + searchTerm.length)}</mark>
        {text.substring(index + searchTerm.length)}
      </span>
    );
  };

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Dropdown menu handler
  const handleSpeciesSelect = (scientificName: string) => {
    setSearchTerm(scientificName);
    handleSearch(scientificName);
    setSuggestions([]);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
    searchInputRef?.current?.blur();
  };

  return (
    <div className="search-container" style={{ position: 'relative', display: 'inline-block' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            ref={searchInputRef}
            placeholder="Search for animals (scientific names)"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            aria-label="Animal Search"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-activedescendant={suggestionIndex > -1 ? `suggestion-${suggestionIndex}` : undefined}
            style={{ paddingRight: '2.5em' }} // Make space for the dropdown toggle
          />
          {showSuggestions && (
            <ul
              ref={suggestionsRef}
              className="suggestions"
              role="listbox"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: 0,
                margin: 0,
                zIndex: 1,
                backgroundColor: 'white',
                listStyleType: 'none',
              }}
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={index === suggestionIndex}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    backgroundColor: index === suggestionIndex ? '#f0f0f0' : 'transparent',
                  }}
                >
                  {highlightMatch(suggestion)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ position: 'relative', marginLeft: '0.5em' }}>
          <button
            type="button"
            onClick={() => {
              // Toggle dropdown visibility
              const dropdown = document.getElementById('speciesDropdown');
              if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5em',
              cursor: 'pointer',
              fontSize: '1em',
              position: 'relative',
            }}
            aria-label="Toggle Common Species Dropdown"
          >
            ☰
          </button>
          <div
            id="speciesDropdown"
            style={{
              display: 'none',
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '0.5em',
              zIndex: 2,
              minWidth: '160px',
            }}
          >
            <ul>
              {commonSpecies.map((species) => (
                <li
                  key={species.scientificName}
                  style={{
                    cursor: 'pointer',
                    padding: '0.25em 0.5em',
                  }}
                  onClick={() => handleSpeciesSelect(species.scientificName)}
                >
                  {species.commonName} ({species.scientificName})
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button type="submit" style={{ marginLeft: '0.5em' }}>Search</button>
      </form>
    </div>
  );
};

export default AnimalSearch;
