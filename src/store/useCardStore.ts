import { create } from 'zustand';
import type { Card, Rarity } from '../types';
import { CARDS, CARD_SETS } from '../data/cards';

interface CardFilters {
  set?: string;
  rarity?: Rarity;
  search?: string;
  type?: string;
}

interface CardStore {
  cards: Card[];
  sets: typeof CARD_SETS;
  filters: CardFilters;
  selectedCard: Card | null;
  setFilters: (filters: Partial<CardFilters>) => void;
  getFilteredCards: () => Card[];
  getCardById: (id: string) => Card | undefined;
  setSelectedCard: (card: Card | null) => void;
  getPopularCards: () => Card[];
}

export const useCardStore = create<CardStore>((set, get) => ({
  cards: CARDS,
  sets: CARD_SETS,
  filters: {},
  selectedCard: null,

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),

  getFilteredCards: () => {
    const { cards, filters } = get();
    return cards.filter((card) => {
      if (filters.set && card.set !== filters.set) return false;
      if (filters.rarity && card.rarity !== filters.rarity) return false;
      if (filters.type && !card.type.includes(filters.type)) return false;
      if (filters.search && !card.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  },

  getCardById: (id) => {
    return get().cards.find((card) => card.id === id);
  },

  setSelectedCard: (card) => set({ selectedCard: card }),

  getPopularCards: () => {
    return get().cards
      .sort((a, b) => b.estimatedValue - a.estimatedValue)
      .slice(0, 6);
  },
}));
