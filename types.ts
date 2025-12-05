export enum Sport {
  Baseball = 'Baseball',
  Basketball = 'Basketball',
  Football = 'Football',
  Hockey = 'Hockey',
  Soccer = 'Soccer',
  TCG = 'TCG', // Trading Card Game (Pokemon, Magic)
  Other = 'Other'
}

export enum GradingCompany {
  Raw = 'Raw',
  PSA = 'PSA',
  BGS = 'BGS',
  SGC = 'SGC',
  CGC = 'CGC'
}

export interface Card {
  id: string;
  player: string;
  year: string;
  brand: string;
  card_number: string;
  sport: Sport;
  team: string;
  grading_company: GradingCompany;
  grade: string; // e.g., "10", "NM-MT 8", or empty if raw
  estimated_value: number;
  image_url: string; // Base64 or URL
  notes: string;
  date_added: string;
}

export interface CardAnalysisResult {
  player: string;
  year: string;
  brand: string;
  card_number: string;
  sport: string;
  team: string;
  description: string;
}

export type SortOption = 'date_desc' | 'date_asc' | 'value_desc' | 'value_asc';
