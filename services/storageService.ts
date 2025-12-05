import { Card } from "../types";

const STORAGE_KEY = 'card_vault_inventory';

export const getCards = (): Card[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load cards", e);
    return [];
  }
};

export const saveCard = (card: Card): void => {
  const cards = getCards();
  const updatedCards = [card, ...cards];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards));
};

export const updateCard = (updatedCard: Card): void => {
    const cards = getCards();
    const index = cards.findIndex(c => c.id === updatedCard.id);
    if (index !== -1) {
        cards[index] = updatedCard;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    }
}

export const deleteCard = (id: string): void => {
  const cards = getCards();
  const filtered = cards.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getPortfolioValue = (): number => {
  const cards = getCards();
  return cards.reduce((sum, card) => sum + (card.estimated_value || 0), 0);
};

export const getSportDistribution = (): { name: string; value: number }[] => {
  const cards = getCards();
  const map: Record<string, number> = {};
  
  cards.forEach(card => {
    const sport = card.sport || 'Other';
    map[sport] = (map[sport] || 0) + 1;
  });

  return Object.entries(map).map(([name, value]) => ({ name, value }));
};
