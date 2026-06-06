import { create } from 'zustand';
import type { User, CollectionItem, WishlistItem, CardCondition, Language, Card, CollectionChangeLog, CollectionChangeSource } from '../types';
import { CURRENT_USER, INITIAL_COLLECTION, INITIAL_WISHLIST } from '../data/users';

const conditionLabels: Record<CardCondition, string> = {
  mint: '全新',
  'near-mint': '近新',
  excellent: '优秀',
  good: '良好',
  played: '使用过',
};

const languageLabels: Record<Language, string> = {
  'zh-CN': '简中',
  'en-US': '英文',
  'ja-JP': '日文',
  'ko-KR': '韩文',
};

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
  collectionChangeLogs: CollectionChangeLog[];
  
  addToCollection: (cardId: string, quantity?: number, condition?: CardCondition, language?: Language, source?: CollectionChangeSource, sourceDescription?: string) => void;
  removeFromCollection: (cardId: string, condition?: CardCondition, language?: Language, source?: CollectionChangeSource, sourceDescription?: string) => void;
  updateCollectionItem: (cardId: string, oldCondition: CardCondition, oldLanguage: Language, data: Partial<CollectionItem>) => void;
  addChangeLog: (log: Omit<CollectionChangeLog, 'id' | 'timestamp'>) => void;
  
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
  
  processTradeCompletion: (offeredCards: { cardId: string; quantity: number; condition?: CardCondition; language?: Language }[], receivedCards: { cardId: string; quantity: number; condition?: CardCondition; language?: Language }[]) => { success: boolean; missingCards?: { cardId: string; name: string; available: number; needed: number; condition: CardCondition; language: Language }[] };
}

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: CURRENT_USER,
  collection: INITIAL_COLLECTION,
  wishlist: INITIAL_WISHLIST,
  collectionChangeLogs: [],

  addChangeLog: (log) => set((state) => ({
    collectionChangeLogs: [
      {
        ...log,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      },
      ...state.collectionChangeLogs,
    ],
  })),

  addToCollection: (cardId, quantity = 1, condition = 'near-mint', language = 'zh-CN', source = 'manual', sourceDescription) => {
    let quantityAfter = quantity;
    
    set((state) => {
      const existingIdx = state.collection.findIndex(
        (item) => item.cardId === cardId && item.condition === condition && item.language === language
      );
      
      if (existingIdx >= 0) {
        quantityAfter = state.collection[existingIdx].quantity + quantity;
        const newCollection = [...state.collection];
        newCollection[existingIdx] = {
          ...newCollection[existingIdx],
          quantity: quantityAfter,
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
    });
    
    if (cardStoreGetState) {
      const card = cardStoreGetState().getCardById(cardId);
      if (card) {
        get().addChangeLog({
          cardId,
          cardName: card.name,
          condition,
          language,
          quantityChange: quantity,
          quantityAfter,
          source,
          sourceDescription,
        });
      }
    }
  },

  removeFromCollection: (cardId, condition, language, source = 'delete', sourceDescription) => {
    if (condition && language) {
      const existingItem = get().collection.find(
        (item) => item.cardId === cardId && item.condition === condition && item.language === language
      );
      
      if (existingItem) {
        set((state) => ({
          collection: state.collection.filter((item) => 
            !(item.cardId === cardId && item.condition === condition && item.language === language)
          ),
        }));
        
        if (cardStoreGetState) {
          const card = cardStoreGetState().getCardById(cardId);
          if (card) {
            get().addChangeLog({
              cardId,
              cardName: card.name,
              condition,
              language,
              quantityChange: -existingItem.quantity,
              quantityAfter: 0,
              source,
              sourceDescription,
            });
          }
        }
        return;
      }
    }
    
    set((state) => ({
      collection: state.collection.filter((item) => item.cardId !== cardId),
    }));
  },

  updateCollectionItem: (cardId, oldCondition, oldLanguage, data) => {
    const state = get();
    const newCondition = data.condition || oldCondition;
    const newLanguage = data.language || oldLanguage;
    const newQuantity = data.quantity;
    
    const oldItem = state.collection.find(
      (item) => item.cardId === cardId && item.condition === oldCondition && item.language === oldLanguage
    );
    
    if (!oldItem) return;
    
    let finalCollection: CollectionItem[] = [];
    
    if (newCondition !== oldCondition || newLanguage !== oldLanguage) {
      const existingTargetItem = state.collection.find(
        (item) => item.cardId === cardId && item.condition === newCondition && item.language === newLanguage
      );
      
      if (existingTargetItem) {
        const mergedQuantity = existingTargetItem.quantity + (newQuantity ?? oldItem.quantity);
        finalCollection = state.collection.filter(
          (item) => !(item.cardId === cardId && item.condition === oldCondition && item.language === oldLanguage)
        ).map((item) => {
          if (item.cardId === cardId && item.condition === newCondition && item.language === newLanguage) {
            return { ...item, quantity: mergedQuantity };
          }
          return item;
        });
      } else {
        finalCollection = state.collection.map((item) => {
          if (item.cardId === cardId && item.condition === oldCondition && item.language === oldLanguage) {
            return { ...item, ...data };
          }
          return item;
        });
      }
    } else {
      finalCollection = state.collection.map((item) => {
        if (item.cardId === cardId && item.condition === oldCondition && item.language === oldLanguage) {
          return { ...item, ...data };
        }
        return item;
      });
    }
    
    set({ collection: finalCollection });
    
    if (cardStoreGetState) {
      const card = cardStoreGetState().getCardById(cardId);
      if (card) {
        const qtyChange = (newQuantity ?? oldItem.quantity) - oldItem.quantity;
        if (newCondition !== oldCondition || newLanguage !== oldLanguage) {
          get().addChangeLog({
            cardId,
            cardName: card.name,
            condition: oldCondition,
            language: oldLanguage,
            quantityChange: -oldItem.quantity,
            quantityAfter: 0,
            source: 'manual',
            sourceDescription: `版本变更为 ${conditionLabels[newCondition]} ${languageLabels[newLanguage]}`,
          });
          
          const targetItem = finalCollection.find(
            (i) => i.cardId === cardId && i.condition === newCondition && i.language === newLanguage
          );
          get().addChangeLog({
            cardId,
            cardName: card.name,
            condition: newCondition,
            language: newLanguage,
            quantityChange: (newQuantity ?? oldItem.quantity),
            quantityAfter: targetItem?.quantity || 0,
            source: 'manual',
            sourceDescription: `从 ${conditionLabels[oldCondition]} ${languageLabels[oldLanguage]} 变更`,
          });
        } else if (qtyChange !== 0) {
          const targetItem = finalCollection.find(
            (i) => i.cardId === cardId && i.condition === newCondition && i.language === newLanguage
          );
          get().addChangeLog({
            cardId,
            cardName: card.name,
            condition: newCondition,
            language: newLanguage,
            quantityChange: qtyChange,
            quantityAfter: targetItem?.quantity || 0,
            source: 'manual',
          });
        }
      }
    }
  },

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

  bulkImportCollection: (items) => {
    let finalCollection: CollectionItem[] = [];
    
    set((state) => {
      finalCollection = [...state.collection];
      items.forEach((item) => {
        const condition = item.condition || 'near-mint';
        const language = item.language || 'zh-CN';
        const existingIdx = finalCollection.findIndex(
          (c) => c.cardId === item.cardId && c.condition === condition && c.language === language
        );
        
        if (existingIdx >= 0) {
          finalCollection[existingIdx].quantity += item.quantity;
        } else {
          finalCollection.push({
            cardId: item.cardId,
            quantity: item.quantity,
            condition,
            language,
            addedAt: new Date().toISOString(),
          });
        }
      });
      return { collection: finalCollection };
    });
    
    if (cardStoreGetState) {
      const { getCardById } = cardStoreGetState();
      items.forEach((item) => {
        const condition = item.condition || 'near-mint';
        const language = item.language || 'zh-CN';
        const card = getCardById(item.cardId);
        if (card) {
          const targetItem = finalCollection.find(
            (i) => i.cardId === item.cardId && i.condition === condition && i.language === language
          );
          get().addChangeLog({
            cardId: item.cardId,
            cardName: card.name,
            condition,
            language,
            quantityChange: item.quantity,
            quantityAfter: targetItem?.quantity || 0,
            source: 'bulk-import',
          });
        }
      });
    }
  },

  processTradeCompletion: (offeredCards, receivedCards) => {
    const state = get();
    const { collection } = state;
    let finalCollection: CollectionItem[] = [];
    
    if (cardStoreGetState) {
      const { getCardById } = cardStoreGetState();
      const missingCards: { cardId: string; name: string; available: number; needed: number; condition: CardCondition; language: Language }[] = [];
      
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
            condition,
            language,
          });
        }
      }
      
      if (missingCards.length > 0) {
        return { success: false, missingCards };
      }
    }
    
    set((state) => {
      finalCollection = [...state.collection];
      
      for (const offered of offeredCards) {
        const condition = offered.condition || 'near-mint';
        const language = offered.language || 'zh-CN';
        const idx = finalCollection.findIndex(
          (i) => i.cardId === offered.cardId && i.condition === condition && i.language === language
        );
        
        if (idx >= 0) {
          const newQty = finalCollection[idx].quantity - offered.quantity;
          if (newQty <= 0) {
            finalCollection = finalCollection.filter((_, i) => i !== idx);
          } else {
            finalCollection[idx] = { ...finalCollection[idx], quantity: newQty };
          }
        }
      }
      
      for (const received of receivedCards) {
        const condition = received.condition || 'near-mint';
        const language = received.language || 'zh-CN';
        const idx = finalCollection.findIndex(
          (i) => i.cardId === received.cardId && i.condition === condition && i.language === language
        );
        
        if (idx >= 0) {
          finalCollection[idx] = {
            ...finalCollection[idx],
            quantity: finalCollection[idx].quantity + received.quantity,
          };
        } else {
          finalCollection.push({
            cardId: received.cardId,
            quantity: received.quantity,
            condition,
            language,
            addedAt: new Date().toISOString(),
          });
        }
      }
      
      return { collection: finalCollection };
    });
    
    if (cardStoreGetState) {
      const { getCardById } = cardStoreGetState();
      const { addChangeLog } = get();
      
      for (const offered of offeredCards) {
        const condition = offered.condition || 'near-mint';
        const language = offered.language || 'zh-CN';
        const card = getCardById(offered.cardId);
        if (card) {
          const targetItem = finalCollection.find(
            (i) => i.cardId === offered.cardId && i.condition === condition && i.language === language
          );
          addChangeLog({
            cardId: offered.cardId,
            cardName: card.name,
            condition,
            language,
            quantityChange: -offered.quantity,
            quantityAfter: targetItem?.quantity || 0,
            source: 'trade',
            sourceDescription: '交易付出',
          });
        }
      }
      
      for (const received of receivedCards) {
        const condition = received.condition || 'near-mint';
        const language = received.language || 'zh-CN';
        const card = getCardById(received.cardId);
        if (card) {
          const targetItem = finalCollection.find(
            (i) => i.cardId === received.cardId && i.condition === condition && i.language === language
          );
          addChangeLog({
            cardId: received.cardId,
            cardName: card.name,
            condition,
            language,
            quantityChange: received.quantity,
            quantityAfter: targetItem?.quantity || 0,
            source: 'trade',
            sourceDescription: '交易获得',
          });
        }
      }
    }
    
    return { success: true };
  },
}));
