// Central type definition for Species across the entire application
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
  facts: string[] | Array<{icon: string, title: string, description: string}>;
}

// Valid detailed categories for species classification
export const VALID_CATEGORIES = [
  'blomma', 'buske', 'ört', 'träd', 'svamp', 
  'mossa', 'sten', 'insekt', 'fågel', 'däggdjur', 'annat'
] as const;

export type CategoryKey = typeof VALID_CATEGORIES[number];

// Simplified main categories for UI
export const MAIN_CATEGORIES = [
  'växter', 'svamp', 'insekter', 'fåglar', 'däggdjur', 'stenar', 'annat'
] as const;

export type MainCategoryKey = typeof MAIN_CATEGORIES[number];

// Mapping from detailed categories to main categories
export const CATEGORY_TO_MAIN: Record<CategoryKey, MainCategoryKey> = {
  'blomma': 'växter',
  'buske': 'växter',
  'ört': 'växter',
  'träd': 'växter',
  'mossa': 'växter',
  'svamp': 'svamp',
  'insekt': 'insekter',
  'fågel': 'fåglar',
  'däggdjur': 'däggdjur',
  'sten': 'stenar',
  'annat': 'annat'
};

// Display information for main categories
export const MAIN_CATEGORY_DISPLAY: Record<MainCategoryKey | 'favoriter', { icon: string; name: string; subcategories: string[] }> = {
  'favoriter': { icon: '⭐', name: 'Favoriter', subcategories: [] },
  'växter': { icon: '🌿', name: 'Växter', subcategories: ['Blomma', 'Buske', 'Ört', 'Träd', 'Mossa'] },
  'svamp': { icon: '🍄', name: 'Svampar', subcategories: [] },
  'insekter': { icon: '🦋', name: 'Insekter', subcategories: [] },
  'fåglar': { icon: '🦅', name: 'Fåglar', subcategories: [] },
  'däggdjur': { icon: '🦌', name: 'Däggdjur', subcategories: [] },
  'stenar': { icon: '💎', name: 'Stenar & Mineraler', subcategories: [] },
  'annat': { icon: '❓', name: 'Annat', subcategories: [] }
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
  
  // Legacy mapping
  if (normalized === 'växt') {
    return 'växter';
  }
  
  // Default fallback
  return 'annat';
};

// Helper to get display name for detailed category
export const getCategoryDisplayName = (category: string): string => {
  const normalized = category.toLowerCase().trim();
  
  const displayNames: Record<string, string> = {
    'blomma': 'Blomma',
    'buske': 'Buske',
    'ört': 'Ört',
    'träd': 'Träd',
    'mossa': 'Mossa',
    'svamp': 'Svamp',
    'insekt': 'Insekt',
    'fågel': 'Fågel',
    'däggdjur': 'Däggdjur',
    'sten': 'Sten',
    'annat': 'Annat'
  };
  
  return displayNames[normalized] || 'Annat';
};

// Helper to validate if a category is valid
export const isValidCategory = (category: string): category is CategoryKey => {
  return VALID_CATEGORIES.includes(category.toLowerCase().trim() as CategoryKey);
};
