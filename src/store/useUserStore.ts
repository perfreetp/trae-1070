import { create } from 'zustand';
import type { User, CollectionItem, WishlistItem, CardCondition, Language } from '../types';
import { CURRENT_USER, INITIAL_COLLECTION, INITIAL_WISHLIST } from '../data/users';

interface UserStore {
  currentUser: User;
  collection: CollectionItem[];
  wishlist: WishlistItem[];
  
  addToCollection: (cardId: string, data?: Partial<CollectionItem>) => void;
  removeFromCollection: (cardId: string) => void;
  updateCollectionItem: (cardId: string, data: Partial<CollectionItem>) => void;
  
  addToWishlist: (cardId: string, priority?: 1 | 2 | 3, quantityWanted?: number) => void;
  removeFromWishlist: (cardId: string) => void;
  updateWishlistItem: (cardId: string, data: Partial<WishlistItem>) => void;
  
  isInCollection: (cardId: string) => boolean;
  isInWishlist: (cardId: string) => boolean;
  getCollectionQuantity: (cardId: string) => number;
  
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
  
  getCollectionStats: () => {
    totalCards: number;
    totalValue: number;
    rarityDistribution: Record<string, number>;
    setDistribution: Record<string, number>;
  };
  
  getWishlistCompletion: () => {
    total: number;
    owned: number;
    percentage: number;
  };
  
  bulkImportCollection: (items: { cardId: string; quantity: number; condition?: CardCondition; language?: Language }[]) => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: CURRENT_USER,
  collection: INITIAL_COLLECTION,
  wishlist: INITIAL_WISHLIST,

  addToCollection: (cardId, data = {}) => set((state) => {
    const existing = state.collection.find((item) => item.cardId === cardId);
    if (existing) {
      return {
        collection: state.collection.map((item) =>
          item.cardId === cardId
            ? { ...item, quantity: item.quantity + (data.quantity || 1) }
            : item
        ),
      };
    }
    return {
      collection: [
        ...state.collection,
        {
          cardId,
          quantity: data.quantity || 1,
          condition: data.condition || 'near-mint',
          language: data.language || 'zh-CN',
          addedAt: new Date().toISOString(),
        },
      ],
    };
  }),

  removeFromCollection: (cardId) => set((state) => ({
    collection: state.collection.filter((item) => item.cardId !== cardId),
  })),

  updateCollectionItem: (cardId, data) => set((state) => ({
    collection: state.collection.map((item) =>
      item.cardId === cardId ? { ...item, ...data } : item
    ),
  })),

  addToWishlist: (cardId, priority = 2, quantityWanted = 1) => set((state) => {
    const existing = state.wishlist.find((item) => item.cardId === cardId);
    if (existing) return state;
    return {
      wishlist: [
        ...state.wishlist,
        {
          cardId,
          priority,
          quantityWanted,
          addedAt: new Date().toISOString(),
        },
      ],
    };
  }),

  removeFromWishlist: (cardId) => set((state) => ({
    wishlist: state.wishlist.filter((item) => item.cardId !== cardId),
  })),

  updateWishlistItem: (cardId, data) => set((state) => ({
    wishlist: state.wishlist.map((item) =>
      item.cardId === cardId ? { ...item, ...data } : item
    ),
  })),

  isInCollection: (cardId) => {
    return get().collection.some((item) => item.cardId === cardId);
  },

  isInWishlist: (cardId) => {
    return get().wishlist.some((item) => item.cardId === cardId);
  },

  getCollectionQuantity: (cardId) => {
    const item = get().collection.find((i) => i.cardId === cardId);
    return item?.quantity || 0;
  },

  blockUser: (userId) => set((state) => ({
    currentUser: {
      ...state.currentUser,
      blockedUsers: [...state.currentUser.blockedUsers, userId],
    },
  })),

  unblockUser: (userId) => set((state) => ({
    currentUser: {
      ...state.currentUser,
      blockedUsers: state.currentUser.blockedUsers.filter((id) => id !== userId),
    },
  })),

  isBlocked: (userId) => {
    return get().currentUser.blockedUsers.includes(userId);
  },

  getCollectionStats: () => {
    const { collection } = get();
    const { useCardStore } = require('./useCardStore');
    const totalCards = collection.reduce((sum, item) => sum + item.quantity, 0);
    
    let totalValue = 0;
    const rarityDistribution: Record<string, number> = {};
    const setDistribution: Record<string, number> = {};
    
    collection.forEach((item) => {
      const card = useCardStore.getState().getCardById(item.cardId);
      if (card) {
        totalValue += card.estimatedValue * item.quantity;
        rarityDistribution[card.rarity] = (rarityDistribution[card.rarity] || 0) + item.quantity;
        setDistribution[card.setName] = (setDistribution[card.setName] || 0) + item.quantity;
      }
    });
    
    return { totalCards, totalValue, rarityDistribution, setDistribution };
  },

  getWishlistCompletion: () => {
    const { wishlist, isInCollection, getCollectionQuantity } = get();
    let owned = 0;
    wishlist.forEach((item) => {
      if (isInCollection(item.cardId)) {
        const qty = getCollectionQuantity(item.cardId);
        owned += Math.min(qty, item.quantityWanted);
      }
    });
    const total = wishlist.reduce((sum, item) => sum + item.quantityWanted, 0);
    return {
      total,
      owned,
      percentage: total > 0 ? Math.round((owned / total) * 100) : 0,
    };
  },

  bulkImportCollection: (items) => set((state) => {
    const newCollection = [...state.collection];
    items.forEach((item) => {
      const existing = newCollection.find((c) => c.cardId === item.cardId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        newCollection.push({
          cardId: item.cardId,
          quantity: item.quantity,
          condition: item.condition || 'near-mint',
          language: item.language || 'zh-CN',
          addedAt: new Date().toISOString(),
        });
      }
    });
    return { collection: newCollection };
  }),
}));
