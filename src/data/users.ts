import type { User, CollectionItem, WishlistItem, TradeRequest, Message, MatchResult } from '../types';

const avatars = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Oscar',
];

export const USERS: User[] = [
  {
    id: 'user-001',
    username: '卡牌大师',
    email: 'master@cardhub.com',
    avatar: avatars[0],
    reputation: 98,
    tradeCount: 156,
    bio: '资深卡牌收藏家，专注于稀有卡收集10年。希望能和大家友好交换！',
    location: '北京',
    blockedUsers: [],
  },
  {
    id: 'user-002',
    username: '暗影猎手',
    email: 'hunter@cardhub.com',
    avatar: avatars[1],
    reputation: 95,
    tradeCount: 89,
    bio: '主打暗影国度系列，可换可售。',
    location: '上海',
    blockedUsers: [],
  },
  {
    id: 'user-003',
    username: '森林精灵',
    email: 'elf@cardhub.com',
    avatar: avatars[2],
    reputation: 92,
    tradeCount: 67,
    bio: '热爱大自然和绿色卡牌~',
    location: '杭州',
    blockedUsers: [],
  },
  {
    id: 'user-004',
    username: '赛博朋克',
    email: 'cyber@cardhub.com',
    avatar: avatars[3],
    reputation: 88,
    tradeCount: 45,
    bio: '赛博黎明死忠粉！',
    location: '深圳',
    blockedUsers: [],
  },
  {
    id: 'user-005',
    username: '圣光使者',
    email: 'light@cardhub.com',
    avatar: avatars[4],
    reputation: 99,
    tradeCount: 203,
    bio: '只收白色和神圣系卡牌，信誉保证！',
    location: '广州',
    blockedUsers: [],
  },
];

export const CURRENT_USER: User = {
  id: 'current-user',
  username: '我的收藏',
  email: 'me@cardhub.com',
  avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=You',
  reputation: 90,
  tradeCount: 28,
  bio: '新人玩家，正在努力收集中！',
  location: '成都',
  blockedUsers: [],
};

export const INITIAL_COLLECTION: CollectionItem[] = [
  { cardId: 'card-001', quantity: 2, condition: 'near-mint', language: 'zh-CN', addedAt: '2024-01-15' },
  { cardId: 'card-003', quantity: 1, condition: 'mint', language: 'zh-CN', addedAt: '2024-02-20' },
  { cardId: 'card-004', quantity: 4, condition: 'excellent', language: 'zh-CN', addedAt: '2024-03-10' },
  { cardId: 'card-006', quantity: 3, condition: 'good', language: 'en-US', addedAt: '2024-03-15' },
  { cardId: 'card-007', quantity: 2, condition: 'near-mint', language: 'zh-CN', addedAt: '2024-04-05' },
  { cardId: 'card-011', quantity: 8, condition: 'played', language: 'zh-CN', addedAt: '2024-04-10' },
  { cardId: 'card-012', quantity: 1, condition: 'mint', language: 'ja-JP', addedAt: '2024-05-01' },
  { cardId: 'card-016', quantity: 6, condition: 'excellent', language: 'zh-CN', addedAt: '2024-05-15' },
  { cardId: 'card-008', quantity: 2, condition: 'near-mint', language: 'zh-CN', addedAt: '2024-06-01' },
];

export const INITIAL_WISHLIST: WishlistItem[] = [
  { cardId: 'card-002', priority: 1, quantityWanted: 2, addedAt: '2024-01-20' },
  { cardId: 'card-005', priority: 2, quantityWanted: 1, addedAt: '2024-02-15' },
  { cardId: 'card-009', priority: 1, quantityWanted: 1, addedAt: '2024-03-20' },
  { cardId: 'card-010', priority: 3, quantityWanted: 1, addedAt: '2024-04-25' },
  { cardId: 'card-013', priority: 2, quantityWanted: 1, addedAt: '2024-05-10' },
  { cardId: 'card-014', priority: 1, quantityWanted: 1, addedAt: '2024-05-20' },
];

export const INITIAL_TRADES: TradeRequest[] = [
  {
    id: 'trade-001',
    fromUserId: 'user-002',
    toUserId: 'current-user',
    status: 'pending',
    offeredCards: [{ cardId: 'card-005', quantity: 1, condition: 'mint' }],
    requestedCards: [{ cardId: 'card-004', quantity: 2 }],
    message: '你好！我想用这张亡语召唤师换你的2张森林守望者，可以吗？',
    createdAt: '2024-06-01T10:30:00Z',
    updatedAt: '2024-06-01T10:30:00Z',
  },
  {
    id: 'trade-002',
    fromUserId: 'current-user',
    toUserId: 'user-005',
    status: 'accepted',
    offeredCards: [{ cardId: 'card-007', quantity: 1 }, { cardId: 'card-008', quantity: 1 }],
    requestedCards: [{ cardId: 'card-010', quantity: 1 }],
    message: '想用寒冰女王+雷神之怒换你的天使守护神',
    createdAt: '2024-05-25T14:20:00Z',
    updatedAt: '2024-05-26T09:15:00Z',
  },
  {
    id: 'trade-003',
    fromUserId: 'user-003',
    toUserId: 'current-user',
    status: 'completed',
    offeredCards: [{ cardId: 'card-014', quantity: 1, condition: 'near-mint' }],
    requestedCards: [{ cardId: 'card-003', quantity: 1 }],
    message: '远古树人换暗影龙王，可以吗？',
    createdAt: '2024-04-15T08:00:00Z',
    updatedAt: '2024-04-22T16:30:00Z',
    trackingNumber: 'SF1234567890',
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-001',
    senderId: 'user-002',
    receiverId: 'current-user',
    content: '你好！看到你有多余的森林守望者，我这边有亡语召唤师可以交换~',
    timestamp: '2024-06-01T10:25:00Z',
    isRead: true,
    tradeId: 'trade-001',
  },
  {
    id: 'msg-002',
    senderId: 'current-user',
    receiverId: 'user-002',
    content: '你好，请问你的亡语召唤师品相如何？',
    timestamp: '2024-06-01T10:28:00Z',
    isRead: true,
    tradeId: 'trade-001',
  },
  {
    id: 'msg-003',
    senderId: 'user-002',
    receiverId: 'current-user',
    content: '是中文全新的，品相完美！我可以发照片给你看',
    timestamp: '2024-06-01T10:30:00Z',
    isRead: false,
    tradeId: 'trade-001',
  },
  {
    id: 'msg-004',
    senderId: 'user-005',
    receiverId: 'current-user',
    content: '交易已发出，请查收！快递单号：SF9876543210',
    timestamp: '2024-05-28T15:00:00Z',
    isRead: true,
    tradeId: 'trade-002',
  },
];

export const MOCK_MATCHES: MatchResult[] = [
  {
    userId: 'user-002',
    matchScore: 92,
    cardsTheyHave: ['card-005', 'card-009', 'card-014'],
    cardsTheyWant: ['card-003', 'card-004', 'card-006'],
    mutualMatches: 3,
  },
  {
    userId: 'user-005',
    matchScore: 85,
    cardsTheyHave: ['card-002', 'card-010'],
    cardsTheyWant: ['card-007', 'card-008'],
    mutualMatches: 2,
  },
  {
    userId: 'user-003',
    matchScore: 78,
    cardsTheyHave: ['card-014', 'card-004'],
    cardsTheyWant: ['card-003', 'card-007'],
    mutualMatches: 2,
  },
  {
    userId: 'user-004',
    matchScore: 65,
    cardsTheyHave: ['card-013', 'card-015'],
    cardsTheyWant: ['card-001', 'card-006'],
    mutualMatches: 1,
  },
];

export const getUserById = (id: string): User | undefined => {
  if (id === 'current-user') return CURRENT_USER;
  return USERS.find(user => user.id === id);
};
