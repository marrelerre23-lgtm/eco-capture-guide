// Central type definitions for Species across the entire application
export interface SpeciesFact {
  icon: string;
  title: string;
  description: string;
}

export interface Species {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  dateFound: Date | string;
  description: string;
  category: string;
  confidence?: number;
  reasoning?: string;
  facts: string[] | SpeciesFact[];
  edibility?: 'ätlig' | 'giftig' | 'ätlig med förbehåll' | 'inte ätlig' | 'okänd';
  ageStage?: string;
  // UI/display fields used by Logbook and SpeciesModal
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  capturedAt?: Date;
  isFavorite?: boolean;
  gpsAccuracy?: number;
}

// Narrowed Species type where facts are always structured objects (used by Logbook, SpeciesModal)
export interface SpeciesDetailed extends Omit<Species, 'facts' | 'dateFound'> {
  facts: SpeciesFact[];
  dateFound: string;
}

// Valid detailed categories for species classification
export const VALID_CATEGORIES = [
  // Träd och Vedartade
  'barrträd', 'lövträd', 'buske', 'klätterväxt',
  // Örter och Blommor
  'ört', 'blomma', 'gräs',
  // Mossor och Lavar
  'mossa', 'lav',
  // Svampar
  'svamp',
  // Fåglar
  'fågel',
  // Däggdjur
  'däggdjur',
  // Grod- och Kräldjur
  'groda', 'salamander', 'ödla', 'orm',
  // Insekter och Spindeldjur
  'insekt', 'spindel',
  // Vatten- och Ryggradslöst Liv
  'vattenlevande', 'snäcka', 'mask',
  // Stenar & Mineraler
  'sten', 'mineral',
  // Spår och Övrigt
  'spår', 'annat'
] as const;

export type CategoryKey = typeof VALID_CATEGORIES[number];

// Main categories (11 groups)
export const MAIN_CATEGORIES = [
  'träd-vedartade', 'örter-blommor', 'mossor-lavar', 'svampar', 
  'fåglar', 'däggdjur', 'grod-kräldjur', 'insekter-spindeldjur', 
  'vatten-ryggradslöst', 'stenar-mineraler', 'spår-övrigt'
] as const;

export type MainCategoryKey = typeof MAIN_CATEGORIES[number];

// Mapping from detailed categories to main categories
export const CATEGORY_TO_MAIN: Record<CategoryKey, MainCategoryKey> = {
  // Träd och Vedartade
  'barrträd': 'träd-vedartade',
  'lövträd': 'träd-vedartade',
  'buske': 'träd-vedartade',
  'klätterväxt': 'träd-vedartade',
  // Örter och Blommor
  'ört': 'örter-blommor',
  'blomma': 'örter-blommor',
  'gräs': 'örter-blommor',
  // Mossor och Lavar
  'mossa': 'mossor-lavar',
  'lav': 'mossor-lavar',
  // Svampar
  'svamp': 'svampar',
  // Fåglar
  'fågel': 'fåglar',
  // Däggdjur
  'däggdjur': 'däggdjur',
  // Grod- och Kräldjur
  'groda': 'grod-kräldjur',
  'salamander': 'grod-kräldjur',
  'ödla': 'grod-kräldjur',
  'orm': 'grod-kräldjur',
  // Insekter och Spindeldjur
  'insekt': 'insekter-spindeldjur',
  'spindel': 'insekter-spindeldjur',
  // Vatten- och Ryggradslöst Liv
  'vattenlevande': 'vatten-ryggradslöst',
  'snäcka': 'vatten-ryggradslöst',
  'mask': 'vatten-ryggradslöst',
  // Stenar & Mineraler
  'sten': 'stenar-mineraler',
  'mineral': 'stenar-mineraler',
  // Spår och Övrigt
  'spår': 'spår-övrigt',
  'annat': 'spår-övrigt'
};

// Display information for main categories
export const MAIN_CATEGORY_DISPLAY: Record<MainCategoryKey | 'favoriter', { icon: string; name: string; subcategories: string[] }> = {
  'favoriter': { icon: '⭐', name: 'Favoriter', subcategories: [] },
  'träd-vedartade': { icon: '🌲', name: 'Träd och Vedartade', subcategories: ['Barrträd', 'Lövträd', 'Buske', 'Klätterväxt'] },
  'örter-blommor': { icon: '🌸', name: 'Örter och Blommor', subcategories: ['Ört', 'Blomma', 'Gräs'] },
  'mossor-lavar': { icon: '🍃', name: 'Mossor och Lavar', subcategories: ['Mossa', 'Lav'] },
  'svampar': { icon: '🍄', name: 'Svampar', subcategories: [] },
  'fåglar': { icon: '🦅', name: 'Fåglar', subcategories: [] },
  'däggdjur': { icon: '🦌', name: 'Däggdjur', subcategories: [] },
  'grod-kräldjur': { icon: '🐸', name: 'Grod- och Kräldjur', subcategories: ['Groda', 'Salamander', 'Ödla', 'Orm'] },
  'insekter-spindeldjur': { icon: '🦋', name: 'Insekter och Spindeldjur', subcategories: ['Insekt', 'Spindel'] },
  'vatten-ryggradslöst': { icon: '🐚', name: 'Vatten- och Ryggradslöst Liv', subcategories: ['Vattenlevande', 'Snäcka', 'Mask'] },
  'stenar-mineraler': { icon: '💎', name: 'Stenar & Mineraler', subcategories: ['Sten', 'Mineral'] },
  'spår-övrigt': { icon: '👣', name: 'Spår och Övrigt', subcategories: ['Spår', 'Annat'] }
};

// Helper to get main category from detailed category
export const getMainCategory = (category: string): MainCategoryKey => {
  const normalized = category.toLowerCase().trim();
  
  // Check if it's already a main category
  if (MAIN_CATEGORIES.includes(normalized as MainCategoryKey)) {
    return normalized as MainCategoryKey;
  }
  
  // Check if it's a valid detailed category
  if (VALID_CATEGORIES.includes(normalized as CategoryKey)) {
    return CATEGORY_TO_MAIN[normalized as CategoryKey];
  }
  
  // Comprehensive legacy mapping for old categories
  const legacyMapping: Record<string, MainCategoryKey> = {
    // Spår (gamla stavfel)
    'spar': 'spår-övrigt',
    
    // Träd och Vedartade (gamla kategorier)
    'barrtrad': 'träd-vedartade',
    'lovtrad': 'träd-vedartade',
    'träd': 'träd-vedartade',
    
    // Mossor (gamla detaljerade kategorier)
    'bladmossor': 'mossor-lavar',
    'levermossor': 'mossor-lavar',
    
    // Örter och Blommor (gamla kategorier)
    'orkideer': 'örter-blommor',
    'blommor': 'örter-blommor',
    'fröväxter': 'örter-blommor',
    'växt': 'örter-blommor',
    'växter': 'örter-blommor',
    
    // Insekter (gamla kategorier)
    'insekt': 'insekter-spindeldjur',
    'insekter': 'insekter-spindeldjur',
    
    // Stenar (gamla kategorier)
    'stenar': 'stenar-mineraler',
    
    // Svampar (gamla kategorier)
    'svamp': 'svampar'
  };
  
  if (legacyMapping[normalized]) {
    return legacyMapping[normalized];
  }
  
  // Log unknown categories for future debugging
  if (normalized && normalized !== '') {
    console.warn(`Unknown category detected: "${category}" (normalized: "${normalized}"). Defaulting to 'spår-övrigt'.`);
  }
  
  // Default fallback
  return 'spår-övrigt';
};

// Helper to get display name for detailed category
export const getCategoryDisplayName = (category: string): string => {
  const normalized = category.toLowerCase().trim();
  
  const displayNames: Record<string, string> = {
    // Träd och Vedartade
    'barrträd': 'Barrträd',
    'lövträd': 'Lövträd',
    'buske': 'Buske',
    'klätterväxt': 'Klätterväxt',
    // Örter och Blommor
    'ört': 'Ört',
    'blomma': 'Blomma',
    'gräs': 'Gräs',
    // Mossor och Lavar
    'mossa': 'Mossa',
    'lav': 'Lav',
    // Svampar
    'svamp': 'Svamp',
    // Fåglar
    'fågel': 'Fågel',
    // Däggdjur
    'däggdjur': 'Däggdjur',
    // Grod- och Kräldjur
    'groda': 'Groda',
    'salamander': 'Salamander',
    'ödla': 'Ödla',
    'orm': 'Orm',
    // Insekter och Spindeldjur
    'insekt': 'Insekt',
    'spindel': 'Spindel',
    // Vatten- och Ryggradslöst Liv
    'vattenlevande': 'Vattenlevande',
    'snäcka': 'Snäcka',
    'mask': 'Mask',
    // Stenar & Mineraler
    'sten': 'Sten',
    'mineral': 'Mineral',
    // Spår och Övrigt
    'spår': 'Spår',
    'annat': 'Annat',
    // Legacy
    'träd': 'Träd',
    'växt': 'Växt'
  };
  
  return displayNames[normalized] || 'Annat';
};
