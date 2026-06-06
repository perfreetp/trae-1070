export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic' | 'legendary';

export type CardCondition = 'mint' | 'near-mint' | 'excellent' | 'good' | 'played';

export type Language = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'shipped' | 'completed' | 'cancelled';

export interface CardVersion {
  language: Language;
  condition: CardCondition;
  price: number;
}

export interface Card {
  id: string;
  name: string;
  set: string;
  setName: string;
  rarity: Rarity;
  type: string;
  colors: string[];
  manaCost?: string;
  power?: string;
  toughness?: string;
  image: string;
  ruleText: string;
  flavorText?: string;
  estimatedValue: number;
  versions: CardVersion[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  reputation: number;
  tradeCount: number;
  bio?: string;
  location?: string;
  blockedUsers: string[];
}

export interface CollectionItem {
  cardId: string;
  quantity: number;
  condition: CardCondition;
  language: Language;
  addedAt: string;
}

export interface WishlistItem {
  cardId: string;
  priority: 1 | 2 | 3;
  quantityWanted: number;
  addedAt: string;
}

export interface TradeCard {
  cardId: string;
  quantity: number;
  condition?: CardCondition;
  language?: Language;
}

export interface TradeRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: TradeStatus;
  offeredCards: TradeCard[];
  requestedCards: TradeCard[];
  message?: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  tradeId?: string;
}

export interface MatchResult {
  userId: string;
  matchScore: number;
  cardsTheyHave: string[];
  cardsTheyWant: string[];
  mutualMatches: number;
}

export interface DeckCard {
  cardName: string;
  quantity: number;
}

export interface DeckAnalysis {
  totalCards: number;
  ownedCards: number;
  missingCards: { name: string; quantity: number; cardId?: string }[];
  completionRate: number;
}
