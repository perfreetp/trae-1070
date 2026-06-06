import { create } from 'zustand';
import type { TradeRequest, Message, MatchResult, TradeCard, TradeStatus } from '../types';
import { INITIAL_TRADES, INITIAL_MESSAGES, MOCK_MATCHES, USERS, getUserById } from '../data/users';

interface TradeStore {
  tradeRequests: TradeRequest[];
  messages: Message[];
  matches: MatchResult[];
  selectedTrade: TradeRequest | null;
  activeChatUserId: string | null;

  calculateMatches: () => MatchResult[];
  sendTradeRequest: (targetUserId: string, offeredCards: TradeCard[], requestedCards: TradeCard[], message?: string) => void;
  updateTradeProposal: (tradeId: string, offeredCards: TradeCard[], requestedCards: TradeCard[], message?: string) => void;
  acceptTrade: (tradeId: string) => void;
  rejectTrade: (tradeId: string) => void;
  markAsShipped: (tradeId: string, trackingNumber: string) => void;
  confirmReceived: (tradeId: string) => void;
  cancelTrade: (tradeId: string) => void;

  sendMessage: (receiverId: string, content: string, tradeId?: string) => void;
  markMessageAsRead: (messageId: string) => void;
  getUnreadCount: () => number;
  getConversation: (userId: string) => Message[];
  getConversationsList: () => { userId: string; lastMessage: Message; unread: number }[];

  setSelectedTrade: (trade: TradeRequest | null) => void;
  setActiveChatUserId: (userId: string | null) => void;

  getTradeById: (tradeId: string) => TradeRequest | undefined;
  getTradesByStatus: (status: TradeStatus) => TradeRequest[];
}

export const useTradeStore = create<TradeStore>((set, get) => ({
  tradeRequests: INITIAL_TRADES,
  messages: INITIAL_MESSAGES,
  matches: MOCK_MATCHES,
  selectedTrade: null,
  activeChatUserId: null,

  calculateMatches: () => {
    return get().matches;
  },

  sendTradeRequest: (targetUserId, offeredCards, requestedCards, message) => set((state) => ({
    tradeRequests: [
      ...state.tradeRequests,
      {
        id: `trade-${Date.now()}`,
        fromUserId: 'current-user',
        toUserId: targetUserId,
        status: 'pending',
        offeredCards,
        requestedCards,
        message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  })),

  updateTradeProposal: (tradeId, offeredCards, requestedCards, message) => set((state) => ({
    tradeRequests: state.tradeRequests.map((trade) =>
      trade.id === tradeId
        ? {
            ...trade,
            offeredCards,
            requestedCards,
            message: message || trade.message,
            updatedAt: new Date().toISOString(),
          }
        : trade
    ),
  })),

  acceptTrade: (tradeId) => set((state) => ({
    tradeRequests: state.tradeRequests.map((trade) =>
      trade.id === tradeId
        ? { ...trade, status: 'accepted', updatedAt: new Date().toISOString() }
        : trade
    ),
  })),

  rejectTrade: (tradeId) => set((state) => ({
    tradeRequests: state.tradeRequests.map((trade) =>
      trade.id === tradeId
        ? { ...trade, status: 'rejected', updatedAt: new Date().toISOString() }
        : trade
    ),
  })),

  markAsShipped: (tradeId, trackingNumber) => set((state) => ({
    tradeRequests: state.tradeRequests.map((trade) =>
      trade.id === tradeId
        ? { ...trade, status: 'shipped', trackingNumber, updatedAt: new Date().toISOString() }
        : trade
    ),
  })),

  confirmReceived: (tradeId) => set((state) => ({
    tradeRequests: state.tradeRequests.map((trade) =>
      trade.id === tradeId
        ? { ...trade, status: 'completed', updatedAt: new Date().toISOString() }
        : trade
    ),
  })),

  cancelTrade: (tradeId) => set((state) => ({
    tradeRequests: state.tradeRequests.map((trade) =>
      trade.id === tradeId
        ? { ...trade, status: 'cancelled', updatedAt: new Date().toISOString() }
        : trade
    ),
  })),

  sendMessage: (receiverId, content, tradeId) => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: `msg-${Date.now()}`,
        senderId: 'current-user',
        receiverId,
        content,
        timestamp: new Date().toISOString(),
        isRead: false,
        tradeId,
      },
    ],
  })),

  markMessageAsRead: (messageId) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId ? { ...msg, isRead: true } : msg
    ),
  })),

  getUnreadCount: () => {
    return get().messages.filter((msg) => msg.receiverId === 'current-user' && !msg.isRead).length;
  },

  getConversation: (userId) => {
    return get().messages
      .filter(
        (msg) =>
          (msg.senderId === 'current-user' && msg.receiverId === userId) ||
          (msg.senderId === userId && msg.receiverId === 'current-user')
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  getConversationsList: () => {
    const { messages } = get();
    const conversations = new Map<string, { lastMessage: Message; unread: number }>();

    messages.forEach((msg) => {
      const otherUserId = msg.senderId === 'current-user' ? msg.receiverId : msg.senderId;
      const existing = conversations.get(otherUserId);

      if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessage.timestamp)) {
        conversations.set(otherUserId, {
          lastMessage: msg,
          unread: msg.receiverId === 'current-user' && !msg.isRead ? 1 : 0,
        });
      } else if (msg.receiverId === 'current-user' && !msg.isRead) {
        existing.unread += 1;
      }
    });

    return Array.from(conversations.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    }));
  },

  setSelectedTrade: (trade) => set({ selectedTrade: trade }),
  setActiveChatUserId: (userId) => set({ activeChatUserId: userId }),

  getTradeById: (tradeId) => {
    return get().tradeRequests.find((trade) => trade.id === tradeId);
  },

  getTradesByStatus: (status) => {
    return get().tradeRequests.filter((trade) => trade.status === status);
  },
}));
