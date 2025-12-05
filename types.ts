export enum Sport {
  Baseball = 'Baseball',
  Basketball = 'Basketball',
  Football = 'Football',
  Hockey = 'Hockey',
  Soccer = 'Soccer',
  TCG = 'TCG', // Trading Card Game (Pokemon, Magic)
  Other = 'Other'
}

export enum CardStatus {
  Raw = 'Raw',
  Graded = 'Graded'
}

export enum GradingCompany {
  PSA = 'PSA',
  BGS = 'BGS',
  SGC = 'SGC',
  CGC = 'CGC',
  TAG = 'TAG'
}

export enum RawCondition {
  GemMint = 'Gem Mint',
  Mint = 'Mint',
  NearMintMint = 'Near Mint-Mint',
  NearMint = 'Near Mint',
  ExcellentMint = 'Excellent-Mint',
  Excellent = 'Excellent',
  VeryGood = 'Very Good',
  Good = 'Good',
  Poor = 'Poor'
}

export interface Card {
  id: string;
  first_name: string;
  last_name: string;
  year: string;
  brand: string;
  card_number: string;
  sport: Sport;
  team: string;
  status: CardStatus;
  grading_company?: GradingCompany;
  grade?: string; // e.g., "10", "9.5"
  condition?: RawCondition;
  estimated_value: number;
  image_url: string; // Base64 or URL
  notes: string;
  date_added: string;
}

export interface CardAnalysisResult {
  first_name: string;
  last_name: string;
  year: string;
  brand: string;
  card_number: string;
  sport: string;
  team: string;
  description: string;
}

export type SortOption = 'date_desc' | 'date_asc' | 'value_desc' | 'value_asc';