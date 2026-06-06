import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Check, CheckCheck, Package, User, Search, MoreVertical, X } from 'lucide-react';
import { useTradeStore } from '../store/useTradeStore';
import { getUserById } from '../data/users';
import { useCardStore } from '../store/useCardStore';

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
    activeChatUserId
  } = useTradeStore();
  const { getCardById } = useCardStore();
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'trades'>('messages');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                              msg.senderId === 'current-user'
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-2">你将收到</p>
                          <div className="space-y-1">
                            {trade.offeredCards.map((card, idx) => {
                              const cardData = getCardById(card.cardId);
                              return cardData ? (
                                <div key={idx} className="text-sm text-green-400 flex items-center gap-2">
                                  <span className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center text-xs">+{card.quantity}</span>
                                  {cardData.name}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-2">你将付出</p>
                          <div className="space-y-1">
                            {trade.requestedCards.map((card, idx) => {
                              const cardData = getCardById(card.cardId);
                              return cardData ? (
                                <div key={idx} className="text-sm text-red-400 flex items-center gap-2">
                                  <span className="w-6 h-6 rounded bg-red-500/20 flex items-center justify-center text-xs">-{card.quantity}</span>
                                  {cardData.name}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {trade.message && (
                    <div className="mt-4 p-3 rounded-lg bg-surface">
                      <p className="text-sm text-gray-300">"{trade.message}"</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trade.status === 'pending' && isIncoming && (
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
                      </>
                    )}
                    {trade.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => markAsShipped(trade.id, 'SF' + Date.now())}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Package className="w-4 h-4" />
                          确认寄出
                        </button>
                      </>
                    )}
                    {trade.status === 'shipped' && (
                      <>
                        <button
                          onClick={() => confirmReceived(trade.id)}
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
                    {trade.status === 'pending' && !isIncoming && (
                      <span className="text-sm text-gray-400 flex items-center gap-2">
                        等待对方回应...
                      </span>
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
