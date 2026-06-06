import { create } from 'zustand';
import type { User, CollectionItem, WishlistItem, CardCondition, Language, Card } from '../types';
import { CURRENT_USER, INITIAL_COLLECTION, INITIAL_WISHLIST } from '../data/users';

let cardStoreGetState: (() => { getCardById: (id: string) => Card | undefined; cards: Card[] }) | null = null;

export const setCardStoreRef = (ref: typeof cardStoreGetState) => {
  cardStoreGetState = ref;
};

export const getVersionKey = (cardId: string, condition: CardCondition, language: Language) => {
  return `${cardId}-${condition}-${language}`;
};

export const getCardVersionPrice = (card: Card, condition: CardCondition, language: Language): number => {
  const exactMatch = card.versions.find(v => v.condition === condition && v.language === language);
  if (exactMatch) return exactMatch.price;
  
  const langMatch = card.versions.find(v => v.language === language);
  if (langMatch) return langMatch.price;
  
  const condMatch = card.versions.find(v => v.condition === condition);
  if (condMatch) return condMatch.price;
  
  return card.estimatedValue;
};

interface UserStore {
  currentUser: User;
  collection: CollectionItem[];
  wishlist: WishlistItem[];
  
  addToCollection: (cardId: string, quantity?: number, condition?: CardCondition, language?: Language) => void;
  removeFromCollection: (cardId: string, condition?: CardCondition, language?: Language) => void;
  updateCollectionItem: (cardId: string, oldCondition: CardCondition, oldLanguage: Language, data: Partial<CollectionItem>) => void;
  
  addToWishlist: (cardId: string, priority?: 1 | 2 | 3, quantityWanted?: number) => void;
  removeFromWishlist: (cardId: string) => void;
  updateWishlistItem: (cardId: string, data: Partial<WishlistItem>) => void;
  
  isInCollection: (cardId: string) => boolean;
  isInWishlist: (cardId: string) => boolean;
  getCollectionQuantity: (cardId: string, condition?: CardCondition, language?: Language) => number;
  getCollectionVersions: (cardId: string) => CollectionItem[];
  
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
  
  processTradeCompletion: (offeredCards: { cardId: string; quantity: number; condition?: CardCondition; language?: Language }[], receivedCards: { cardId: string; quantity: number; condition?: CardCondition; language?: Language }[]) => { success: boolean; missingCards?: { cardId: string; name: string; available: number; needed: number }[] };
}

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: CURRENT_USER,
  collection: INITIAL_COLLECTION,
  wishlist: INITIAL_WISHLIST,

  addToCollection: (cardId, quantity = 1, condition = 'near-mint', language = 'zh-CN') => set((state) => {
    const existingIdx = state.collection.findIndex(
      (item) => item.cardId === cardId && item.condition === condition && item.language === language
    );
    
    if (existingIdx >= 0) {
      const newCollection = [...state.collection];
      newCollection[existingIdx] = {
        ...newCollection[existingIdx],
        quantity: newCollection[existingIdx].quantity + quantity,
      };
      return { collection: newCollection };
    }
    
    return {
      collection: [
        ...state.collection,
        {
          cardId,
          quantity,
          condition,
          language,
          addedAt: new Date().toISOString(),
        },
      ],
    };
  }),

  removeFromCollection: (cardId, condition, language) => set((state) => ({
    collection: state.collection.filter((item) => {
      if (condition && language) {
        return !(item.cardId === cardId && item.condition === condition && item.language === language);
      }
      return item.cardId !== cardId;
    }),
  })),

  updateCollectionItem: (cardId, oldCondition, oldLanguage, data) => set((state) => {
    const newCondition = data.condition || oldCondition;
    const newLanguage = data.language || oldLanguage;
    
    if (newCondition !== oldCondition || newLanguage !== oldLanguage) {
      const existingIdx = state.collection.findIndex(
        (item) => item.cardId === cardId && item.condition === newCondition && item.language === newLanguage
      );
      
      if (existingIdx >= 0) {
        const oldItem = state.collection.find(
          (item) => item.cardId === cardId && item.condition === oldCondition && item.language === oldLanguage
        );
        if (oldItem) {
          const newCollection = state.collection.filter(
            (item) => !(item.cardId === cardId && item.condition === oldCondition && item.language === oldLanguage)
          );
          newCollection[existingIdx] = {
            ...newCollection[existingIdx],
            quantity: newCollection[existingIdx].quantity + (data.quantity || oldItem.quantity),
          };
          return { collection: newCollection };
        }
      }
    }
    
    return {
      collection: state.collection.map((item) =>
        item.cardId === cardId && item.condition === oldCondition && item.language === oldLanguage
          ? { ...item, ...data }
          : item
      ),
    };
  }),

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

  getCollectionQuantity: (cardId, condition, language) => {
    const { collection } = get();
    if (condition && language) {
      const item = collection.find((i) => i.cardId === cardId && i.condition === condition && i.language === language);
      return item?.quantity || 0;
    }
    return collection.filter((i) => i.cardId === cardId).reduce((sum, i) => sum + i.quantity, 0);
  },

  getCollectionVersions: (cardId) => {
    return get().collection.filter((item) => item.cardId === cardId);
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
    const totalCards = collection.reduce((sum, item) => sum + item.quantity, 0);
    
    let totalValue = 0;
    const rarityDistribution: Record<string, number> = {};
    const setDistribution: Record<string, number> = {};
    
    if (cardStoreGetState) {
      const { getCardById } = cardStoreGetState();
      collection.forEach((item) => {
        const card = getCardById(item.cardId);
        if (card) {
          const price = getCardVersionPrice(card, item.condition, item.language);
          totalValue += price * item.quantity;
          rarityDistribution[card.rarity] = (rarityDistribution[card.rarity] || 0) + item.quantity;
          setDistribution[card.setName] = (setDistribution[card.setName] || 0) + item.quantity;
        }
      });
    }
    
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
      const condition = item.condition || 'near-mint';
      const language = item.language || 'zh-CN';
      const existingIdx = newCollection.findIndex(
        (c) => c.cardId === item.cardId && c.condition === condition && c.language === language
      );
      
      if (existingIdx >= 0) {
        newCollection[existingIdx].quantity += item.quantity;
      } else {
        newCollection.push({
          cardId: item.cardId,
          quantity: item.quantity,
          condition,
          language,
          addedAt: new Date().toISOString(),
        });
      }
    });
    return { collection: newCollection };
  }),

  processTradeCompletion: (offeredCards, receivedCards) => {
    const { collection, addToCollection, removeFromCollection } = get();
    
    if (cardStoreGetState) {
      const { getCardById } = cardStoreGetState();
      const missingCards: { cardId: string; name: string; available: number; needed: number }[] = [];
      
      for (const offered of offeredCards) {
        const condition = offered.condition || 'near-mint';
        const language = offered.language || 'zh-CN';
        const available = collection.find(
          (i) => i.cardId === offered.cardId && i.condition === condition && i.language === language
        )?.quantity || 0;
        
        if (available < offered.quantity) {
          const card = getCardById(offered.cardId);
          missingCards.push({
            cardId: offered.cardId,
            name: card?.name || offered.cardId,
            available,
            needed: offered.quantity,
          });
        }
      }
      
      if (missingCards.length > 0) {
        return { success: false, missingCards };
      }
    }
    
    set((state) => {
      let newCollection = [...state.collection];
      
      for (const offered of offeredCards) {
        const condition = offered.condition || 'near-mint';
        const language = offered.language || 'zh-CN';
        const idx = newCollection.findIndex(
          (i) => i.cardId === offered.cardId && i.condition === condition && i.language === language
        );
        
        if (idx >= 0) {
          const newQty = newCollection[idx].quantity - offered.quantity;
          if (newQty <= 0) {
            newCollection = newCollection.filter((_, i) => i !== idx);
          } else {
            newCollection[idx] = { ...newCollection[idx], quantity: newQty };
          }
        }
      }
      
      for (const received of receivedCards) {
        const condition = received.condition || 'near-mint';
        const language = received.language || 'zh-CN';
        const idx = newCollection.findIndex(
          (i) => i.cardId === received.cardId && i.condition === condition && i.language === language
        );
        
        if (idx >= 0) {
          newCollection[idx] = {
            ...newCollection[idx],
            quantity: newCollection[idx].quantity + received.quantity,
          };
        } else {
          newCollection.push({
            cardId: received.cardId,
            quantity: received.quantity,
            condition,
            language,
            addedAt: new Date().toISOString(),
          });
        }
      }
      
      return { collection: newCollection };
    });
    
    return { success: true };
  },
}));
