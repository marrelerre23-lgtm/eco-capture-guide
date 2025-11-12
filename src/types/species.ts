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

// Valid categories for species classification
export const VALID_CATEGORIES = [
  'blomma', 'buske', 'ört', 'träd', 'svamp', 
  'mossa', 'sten', 'insekt', 'fågel', 'däggdjur', 'annat'
] as const;

export type CategoryKey = typeof VALID_CATEGORIES[number];

// Helper to validate if a category is valid
export const isValidCategory = (category: string): category is CategoryKey => {
  return VALID_CATEGORIES.includes(category.toLowerCase().trim() as CategoryKey);
};
