import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Check, CheckCheck, Package, User, Search, MoreVertical, X, Edit3, Plus, Minus, Save, AlertCircle } from 'lucide-react';
import { useTradeStore } from '../store/useTradeStore';
import { getUserById } from '../data/users';
import { useCardStore } from '../store/useCardStore';
import type { TradeCard, TradeRequest, CardCondition, Language } from '../types';

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

export default function Chat() {
  const { 
    tradeRequests, 
    messages, 
    getConversationsList, 
    getConversation, 
    sendMessage,
    acceptTrade,
    rejectTrade,
    markAsShipped,
    confirmReceived,
    setActiveChatUserId,
    activeChatUserId,
    updateTradeProposal,
    getTradeById,
  } = useTradeStore();
  const { getCardById, cards } = useCardStore();
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'trades'>('messages');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [negotiatingTrade, setNegotiatingTrade] = useState<string | null>(null);
  const [negotiateOffered, setNegotiateOffered] = useState<TradeCard[]>([]);
  const [negotiateRequested, setNegotiateRequested] = useState<TradeCard[]>([]);
  const [negotiateMessage, setNegotiateMessage] = useState('');
  const [originalTrade, setOriginalTrade] = useState<TradeRequest | null>(null);

  const conversations = useMemo(() => getConversationsList(), [getConversationsList, messages]);
  const activeConversation = useMemo(() => 
    activeChatUserId ? getConversation(activeChatUserId) : [], 
    [activeChatUserId, getConversation, messages]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChatUserId) return;
    sendMessage(activeChatUserId, messageInput.trim());
    setMessageInput('');
  };

  const handleStartNegotiate = (trade: TradeRequest) => {
    setNegotiatingTrade(trade.id);
    setOriginalTrade(trade);
    setNegotiateOffered(trade.offeredCards.map(c => ({ ...c })));
    setNegotiateRequested(trade.requestedCards.map(c => ({ ...c })));
    setNegotiateMessage('');
  };

  const handleNegotiateUpdate = (type: 'offered' | 'requested', idx: number, field: 'quantity' | 'condition' | 'language', value: number | CardCondition | Language) => {
    const setter = type === 'offered' ? setNegotiateOffered : setNegotiateRequested;
    setter((prev) =>
      prev.map((c, i) => {
        if (i === idx) {
          return { ...c, [field]: value };
        }
        return c;
      })
    );
  };

  const handleNegotiateAddCard = (type: 'offered' | 'requested') => {
    const setter = type === 'offered' ? setNegotiateOffered : setNegotiateRequested;
    const current = type === 'offered' ? negotiateOffered : negotiateRequested;
    const availableCard = cards.find((c) => 
      !current.some((o) => o.cardId === c.id)
    );
    if (availableCard) {
      setter((prev) => [...prev, { cardId: availableCard.id, quantity: 1, condition: 'near-mint', language: 'zh-CN' }]);
    }
  };

  const handleNegotiateRemoveCard = (type: 'offered' | 'requested', idx: number) => {
    const setter = type === 'offered' ? setNegotiateOffered : setNegotiateRequested;
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatChangeComparison = (oldCards: TradeCard[], newCards: TradeCard[], isOffered: boolean) => {
    const changes: string[] = [];
    const oldMap = new Map(oldCards.map(c => [`${c.cardId}-${c.condition}-${c.language}`, c]));
    const newMap = new Map(newCards.map(c => [`${c.cardId}-${c.condition}-${c.language}`, c]));
    
    newCards.forEach((c, idx) => {
      const key = `${c.cardId}-${c.condition}-${c.language}`;
      const oldCard = oldCards.find((oc, oi) => {
        const oldKey = `${oc.cardId}-${oc.condition}-${oc.language}`;
        return oc.cardId === c.cardId && !newCards.some((nc, ni) => ni !== idx && `${nc.cardId}-${nc.condition}-${nc.language}` === oldKey);
      });
      
      const card = getCardById(c.cardId);
      if (!card) return;
      
      if (!oldCard) {
        changes.push(`+${c.quantity}x ${card.name} (${conditionLabels[c.condition || 'near-mint']} ${languageLabels[c.language || 'zh-CN']})【新增】`);
      } else if (oldCard.quantity !== c.quantity || oldCard.condition !== c.condition || oldCard.language !== c.language) {
        const qtyChange = oldCard.quantity !== c.quantity ? `数量: ${oldCard.quantity}→${c.quantity}` : '';
        const condChange = oldCard.condition !== c.condition ? `品相: ${conditionLabels[oldCard.condition || 'near-mint']}→${conditionLabels[c.condition || 'near-mint']}` : '';
        const langChange = oldCard.language !== c.language ? `语言: ${languageLabels[oldCard.language || 'zh-CN']}→${languageLabels[c.language || 'zh-CN']}` : '';
        const changesArr = [qtyChange, condChange, langChange].filter(Boolean);
        changes.push(`${card.name}: ${changesArr.join(', ')}`);
      }
    });
    
    oldCards.forEach((oc) => {
      const stillExists = newCards.some(nc => nc.cardId === oc.cardId);
      if (!stillExists) {
        const card = getCardById(oc.cardId);
        if (card) {
          changes.push(`-${oc.quantity}x ${card.name} (${conditionLabels[oc.condition || 'near-mint']} ${languageLabels[oc.language || 'zh-CN']})【移除】`);
        }
      }
    });
    
    return changes;
  };

  const handleSubmitNegotiation = (trade: TradeRequest) => {
    if (negotiateOffered.length === 0 || negotiateRequested.length === 0) return;
    
    const otherUserId = trade.fromUserId === 'current-user' ? trade.toUserId : trade.fromUserId;
    const messageText = negotiateMessage || '修改了交易提议';
    
    const offeredChanges = originalTrade ? formatChangeComparison(originalTrade.offeredCards, negotiateOffered, true) : [];
    const requestedChanges = originalTrade ? formatChangeComparison(originalTrade.requestedCards, negotiateRequested, false) : [];
    
    const allChanges = [...offeredChanges.map(c => `给出: ${c}`), ...requestedChanges.map(c => `想要: ${c}`)];
    const systemMessage = `【交易修改】${allChanges.join('；')}。${messageText}`;
    
    updateTradeProposal(trade.id, negotiateOffered, negotiateRequested, messageText);
    sendMessage(otherUserId, systemMessage, trade.id);
    
    setNegotiatingTrade(null);
    setOriginalTrade(null);
  };

  const handleConfirmReceived = (tradeId: string) => {
    const result = confirmReceived(tradeId);
    if (!result.success && result.missingCards) {
      const missingText = result.missingCards.map(m => `${m.name}：持有 ${m.available} 张，需要 ${m.needed} 张`).join('；');
      alert(`无法确认收货，以下卡牌数量不足：\n${missingText}`);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'bg-yellow-500/20 text-yellow-400' },
    accepted: { label: '已接受', color: 'bg-blue-500/20 text-blue-400' },
    rejected: { label: '已拒绝', color: 'bg-red-500/20 text-red-400' },
    shipped: { label: '已寄出', color: 'bg-purple-500/20 text-purple-400' },
    completed: { label: '已完成', color: 'bg-green-500/20 text-green-400' },
    cancelled: { label: '已取消', color: 'bg-gray-500/20 text-gray-400' },
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">
            交易 <span className="text-gradient-gold">沟通</span>
          </h1>
          <p className="text-gray-400">管理换牌请求和站内消息</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'messages'
                ? 'bg-gold-500 text-surface-dark'
                : 'bg-surface text-gray-400 hover:text-white'
            }`}
          >
            消息
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'trades'
                ? 'bg-gold-500 text-surface-dark'
                : 'bg-surface text-gray-400 hover:text-white'
            }`}
          >
            换牌请求
          </button>
        </div>

        {activeTab === 'messages' ? (
          <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversation List */}
            <div className="glass-card overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索对话..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {conversations.map((conv) => {
                  const user = getUserById(conv.userId);
                  if (!user) return null;
                  return (
                    <button
                      key={conv.userId}
                      onClick={() => setActiveChatUserId(conv.userId)}
                      className={`w-full p-4 flex items-center gap-3 border-b border-white/5 transition-colors ${
                        activeChatUserId === conv.userId
                          ? 'bg-gold-500/10 border-l-2 border-l-gold-500'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="relative">
                        <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
                        {conv.unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white truncate">{user.username}</h4>
                          <span className="text-xs text-gray-500">
                            {formatTime(conv.lastMessage.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {conv.lastMessage.senderId === 'current-user' && '你: '}
                          {conv.lastMessage.content}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 glass-card flex flex-col overflow-hidden">
              {activeChatUserId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={getUserById(activeChatUserId)?.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h4 className="font-medium text-white">
                          {getUserById(activeChatUserId)?.username}
                        </h4>
                        <p className="text-xs text-green-400">在线</p>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                    {activeConversation.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${msg.senderId === 'current-user' ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-2.5 rounded-2xl ${
                              msg.content.startsWith('【交易修改】')
                                ? 'bg-gold-500/20 text-gold-200 border border-gold-500/30'
                                : msg.senderId === 'current-user'
                                ? 'bg-primary-600 text-white rounded-br-md'
                                : 'bg-surface-light text-gray-200 rounded-bl-md'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                            msg.senderId === 'current-user' ? 'justify-end' : 'justify-start'
                          }`}>
                            <span>{formatTime(msg.timestamp)}</span>
                            {msg.senderId === 'current-user' && (
                              msg.isRead ? (
                                <CheckCheck className="w-3 h-3 text-blue-400" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="输入消息..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-4 py-2.5 rounded-xl bg-gold-500 text-surface-dark hover:bg-gold-400 transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <User className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">选择一个对话开始聊天</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Trade Requests */
          <div className="space-y-4">
            {tradeRequests.map((trade) => {
              const otherUser = getUserById(
                trade.fromUserId === 'current-user' ? trade.toUserId : trade.fromUserId
              );
              const isIncoming = trade.toUserId === 'current-user';
              const canNegotiate = (trade.status === 'pending' || trade.status === 'accepted');
              const isNegotiating = negotiatingTrade === trade.id;
              if (!otherUser) return null;

              return (
                <div key={trade.id} className="glass-card p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <img src={otherUser.avatar} alt="" className="w-12 h-12 rounded-full" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-white">
                            {isIncoming ? '来自 ' : '发给 '}{otherUser.username}
                          </h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusLabels[trade.status].color}`}>
                            {statusLabels[trade.status].label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {new Date(trade.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1">
                      {isNegotiating ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-2">给出（修改后）</p>
                              <div className="space-y-2">
                                {negotiateOffered.map((card, idx) => {
                                  const cardData = getCardById(card.cardId);
                                  return cardData ? (
                                    <div key={idx} className="bg-surface p-2 rounded-lg space-y-2">
                                      <p className="text-sm text-gold-400 font-medium">{cardData.name}</p>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <label className="text-xs text-gray-500 block mb-1">数量</label>
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => handleNegotiateUpdate('offered', idx, 'quantity', Math.max(1, card.quantity - 1))}
                                              className="w-5 h-5 rounded bg-surface-light flex items-center justify-center"
                                            >
                                              <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm text-gold-400 font-bold w-5 text-center">{card.quantity}</span>
                                            <button
                                              onClick={() => handleNegotiateUpdate('offered', idx, 'quantity', card.quantity + 1)}
                                              className="w-5 h-5 rounded bg-surface-light flex items-center justify-center"
                                            >
                                              <Plus className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs text-gray-500 block mb-1">品相</label>
                                          <select
                                            value={card.condition}
                                            onChange={(e) => handleNegotiateUpdate('offered', idx, 'condition', e.target.value as CardCondition)}
                                            className="w-full px-1 py-1 text-xs bg-surface-light border border-white/10 rounded text-white"
                                          >
                                            {Object.entries(conditionLabels).map(([key, label]) => (
                                              <option key={key} value={key}>{label}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="flex items-end gap-1">
                                          <div className="flex-1">
                                            <label className="text-xs text-gray-500 block mb-1">语言</label>
                                            <select
                                              value={card.language}
                                              onChange={(e) => handleNegotiateUpdate('offered', idx, 'language', e.target.value as Language)}
                                              className="w-full px-1 py-1 text-xs bg-surface-light border border-white/10 rounded text-white"
                                            >
                                              {Object.entries(languageLabels).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <button
                                            onClick={() => handleNegotiateRemoveCard('offered', idx)}
                                            className="w-6 h-6 rounded bg-surface-light flex items-center justify-center text-red-400 mb-0.5"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : null;
                                })}
                                <button
                                  onClick={() => handleNegotiateAddCard('offered')}
                                  className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> 添加卡牌
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-2">想要（修改后）</p>
                              <div className="space-y-2">
                                {negotiateRequested.map((card, idx) => {
                                  const cardData = getCardById(card.cardId);
                                  return cardData ? (
                                    <div key={idx} className="bg-surface p-2 rounded-lg space-y-2">
                                      <p className="text-sm text-green-400 font-medium">{cardData.name}</p>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <label className="text-xs text-gray-500 block mb-1">数量</label>
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => handleNegotiateUpdate('requested', idx, 'quantity', Math.max(1, card.quantity - 1))}
                                              className="w-5 h-5 rounded bg-surface-light flex items-center justify-center"
                                            >
                                              <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm text-green-400 font-bold w-5 text-center">{card.quantity}</span>
                                            <button
                                              onClick={() => handleNegotiateUpdate('requested', idx, 'quantity', card.quantity + 1)}
                                              className="w-5 h-5 rounded bg-surface-light flex items-center justify-center"
                                            >
                                              <Plus className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs text-gray-500 block mb-1">品相</label>
                                          <select
                                            value={card.condition}
                                            onChange={(e) => handleNegotiateUpdate('requested', idx, 'condition', e.target.value as CardCondition)}
                                            className="w-full px-1 py-1 text-xs bg-surface-light border border-white/10 rounded text-white"
                                          >
                                            {Object.entries(conditionLabels).map(([key, label]) => (
                                              <option key={key} value={key}>{label}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="flex items-end gap-1">
                                          <div className="flex-1">
                                            <label className="text-xs text-gray-500 block mb-1">语言</label>
                                            <select
                                              value={card.language}
                                              onChange={(e) => handleNegotiateUpdate('requested', idx, 'language', e.target.value as Language)}
                                              className="w-full px-1 py-1 text-xs bg-surface-light border border-white/10 rounded text-white"
                                            >
                                              {Object.entries(languageLabels).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <button
                                            onClick={() => handleNegotiateRemoveCard('requested', idx)}
                                            className="w-6 h-6 rounded bg-surface-light flex items-center justify-center text-red-400 mb-0.5"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : null;
                                })}
                                <button
                                  onClick={() => handleNegotiateAddCard('requested')}
                                  className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> 添加卡牌
                                </button>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">差额说明（可选）</label>
                            <input
                              type="text"
                              value={negotiateMessage}
                              onChange={(e) => setNegotiateMessage(e.target.value)}
                              placeholder="例如：我补50元差价，或者加一张小卡..."
                              className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-white text-sm placeholder-gray-600"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSubmitNegotiation(trade)}
                              className="btn-gold flex items-center gap-2 text-sm"
                              disabled={negotiateOffered.length === 0 || negotiateRequested.length === 0}
                            >
                              <Save className="w-4 h-4" />
                              发送新提议
                            </button>
                            <button
                              onClick={() => {
                                setNegotiatingTrade(null);
                                setOriginalTrade(null);
                              }}
                              className="btn-outline text-sm"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-2">
                              {isIncoming ? '对方给出' : '你给出'}
                            </p>
                            <div className="space-y-1">
                              {trade.offeredCards.map((card, idx) => {
                                const cardData = getCardById(card.cardId);
                                return cardData ? (
                                  <div key={idx} className="text-sm text-green-400">
                                    <span className="flex items-center gap-1">
                                      <span className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center text-xs">+{card.quantity}</span>
                                      {cardData.name}
                                      {(card.condition || card.language) && (
                                        <span className="text-gray-500 text-xs ml-1">
                                          ({card.condition && conditionLabels[card.condition]}{card.language ? ` ${languageLabels[card.language]}` : ''})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-2">
                              {isIncoming ? '对方想要' : '你想要'}
                            </p>
                            <div className="space-y-1">
                              {trade.requestedCards.map((card, idx) => {
                                const cardData = getCardById(card.cardId);
                                return cardData ? (
                                  <div key={idx} className="text-sm text-red-400">
                                    <span className="flex items-center gap-1">
                                      <span className="w-6 h-6 rounded bg-red-500/20 flex items-center justify-center text-xs">-{card.quantity}</span>
                                      {cardData.name}
                                      {(card.condition || card.language) && (
                                        <span className="text-gray-500 text-xs ml-1">
                                          ({card.condition && conditionLabels[card.condition]}{card.language ? ` ${languageLabels[card.language]}` : ''})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {trade.message && !isNegotiating && (
                    <div className="mt-4 p-3 rounded-lg bg-surface">
                      <p className="text-sm text-gray-300">"{trade.message}"</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!isNegotiating && trade.status === 'pending' && isIncoming && (
                      <>
                        <button
                          onClick={() => acceptTrade(trade.id)}
                          className="btn-gold flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          接受
                        </button>
                        <button
                          onClick={() => rejectTrade(trade.id)}
                          className="btn-outline text-red-400 border-red-500/50 hover:bg-red-500/10 flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          拒绝
                        </button>
                        {canNegotiate && (
                          <button
                            onClick={() => handleStartNegotiate(trade)}
                            className="btn-primary flex items-center gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            协商修改
                          </button>
                        )}
                      </>
                    )}
                    {!isNegotiating && trade.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => markAsShipped(trade.id, 'SF' + Date.now())}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Package className="w-4 h-4" />
                          确认寄出
                        </button>
                        {canNegotiate && (
                          <button
                            onClick={() => handleStartNegotiate(trade)}
                            className="btn-outline flex items-center gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            协商修改
                          </button>
                        )}
                      </>
                    )}
                    {trade.status === 'shipped' && (
                      <>
                        <button
                          onClick={() => handleConfirmReceived(trade.id)}
                          className="btn-gold flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          确认收货
                        </button>
                        {trade.trackingNumber && (
                          <span className="px-4 py-2 rounded-lg bg-surface text-gray-400 text-sm">
                            快递单号: {trade.trackingNumber}
                          </span>
                        )}
                      </>
                    )}
                    {!isNegotiating && trade.status === 'pending' && !isIncoming && (
                      <>
                        <span className="text-sm text-gray-400 flex items-center gap-2">
                          等待对方回应...
                        </span>
                        {canNegotiate && (
                          <button
                            onClick={() => handleStartNegotiate(trade)}
                            className="btn-outline flex items-center gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            修改提议
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
