import { useState, useMemo } from 'react';
import { Layers, Users, Star, ArrowRight, MessageSquare, RefreshCw, Zap, CheckCircle, X, Plus, Minus, Send, Check } from 'lucide-react';
import { useTradeStore } from '../store/useTradeStore';
import { useCardStore } from '../store/useCardStore';
import { useUserStore } from '../store/useUserStore';
import { getUserById, USERS } from '../data/users';
import { Link, useNavigate } from 'react-router-dom';
import type { Card, TradeCard, CardCondition, Language } from '../types';

const conditionLabels: Record<CardCondition, string> = {
  mint: '全新',
  'near-mint': '近新',
  excellent: '优秀',
  good: '良好',
  played: '使用过',
};

export default function TradeMatch() {
  const { matches, calculateMatches, sendTradeRequest, setActiveChatUserId } = useTradeStore();
  const { getCardById, cards } = useCardStore();
  const { collection, isBlocked } = useUserStore();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [offeredCards, setOfferedCards] = useState<TradeCard[]>([]);
  const [requestedCards, setRequestedCards] = useState<TradeCard[]>([]);
  const [tradeMessage, setTradeMessage] = useState('');
  const [step, setStep] = useState<'select-offered' | 'select-requested' | 'confirm'>('select-offered');

  const myCollectionCards = useMemo(() => {
    return collection.map((item) => ({
      ...item,
      card: getCardById(item.cardId),
    })).filter((item) => item.card);
  }, [collection, getCardById]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => !isBlocked(m.userId));
  }, [matches, isBlocked]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      calculateMatches();
      setIsRefreshing(false);
    }, 1000);
  };

  const handleStartTrade = (userId: string) => {
    setTargetUserId(userId);
    setOfferedCards([]);
    setRequestedCards([]);
    setTradeMessage('');
    setStep('select-offered');
    setShowTradeModal(true);
  };

  const handleToggleOfferedCard = (cardId: string, maxQty: number) => {
    setOfferedCards((prev) => {
      const existing = prev.find((c) => c.cardId === cardId);
      if (existing) {
        return prev.filter((c) => c.cardId !== cardId);
      }
      return [...prev, { cardId, quantity: 1, condition: 'near-mint', language: 'zh-CN' }];
    });
  };

  const handleUpdateOfferedQuantity = (cardId: string, delta: number, maxQty: number) => {
    setOfferedCards((prev) =>
      prev.map((c) => {
        if (c.cardId === cardId) {
          const newQty = Math.max(1, Math.min(maxQty, c.quantity + delta));
          return { ...c, quantity: newQty };
        }
        return c;
      })
    );
  };

  const handleToggleRequestedCard = (cardId: string) => {
    setRequestedCards((prev) => {
      const existing = prev.find((c) => c.cardId === cardId);
      if (existing) {
        return prev.filter((c) => c.cardId !== cardId);
      }
      return [...prev, { cardId, quantity: 1 }];
    });
  };

  const handleUpdateRequestedQuantity = (cardId: string, delta: number) => {
    setRequestedCards((prev) =>
      prev.map((c) => {
        if (c.cardId === cardId) {
          const newQty = Math.max(1, c.quantity + delta);
          return { ...c, quantity: newQty };
        }
        return c;
      })
    );
  };

  const handleSubmitTrade = () => {
    if (!targetUserId || offeredCards.length === 0 || requestedCards.length === 0) return;
    
    sendTradeRequest(targetUserId, offeredCards, requestedCards, tradeMessage);
    setShowTradeModal(false);
    setActiveChatUserId(targetUserId);
    navigate('/chat');
  };

  const targetUser = targetUserId ? getUserById(targetUserId) : null;
  const currentMatch = targetUserId ? matches.find((m) => m.userId === targetUserId) : null;

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-white mb-2">
              换牌 <span className="text-gradient-gold">匹配</span>
            </h1>
            <p className="text-gray-400">智能匹配互补玩家，找到最佳换牌对象</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 btn-outline mt-4 md:mt-0"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            重新匹配
          </button>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Star, title: '设置愿望清单', desc: '标记你想要的卡牌' },
            { icon: Zap, title: '智能匹配', desc: '系统自动找出互补玩家' },
            { icon: MessageSquare, title: '发起交换', desc: '沟通细节完成交易' },
          ].map((step, idx) => (
            <div key={idx} className="glass-card p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gold-500/20 flex items-center justify-center">
                <step.icon className="w-6 h-6 text-gold-400" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-gold-500 text-surface-dark font-bold text-sm flex items-center justify-center">
                  {idx + 1}
                </span>
                <h3 className="font-display font-bold text-white">{step.title}</h3>
              </div>
              <p className="text-sm text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Matches */}
        <h2 className="font-display text-2xl font-bold text-white mb-6">
          匹配结果 <span className="text-gold-400">({filteredMatches.length})</span>
        </h2>

        <div className="space-y-4">
          {filteredMatches.map((match, idx) => {
            const user = getUserById(match.userId);
            if (!user) return null;

            return (
              <div
                key={match.userId}
                className={`glass-card p-6 animate-fade-in-up cursor-pointer transition-all ${
                  selectedMatch === match.userId ? 'gold-border' : 'hover:border-gold-500/30'
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => setSelectedMatch(selectedMatch === match.userId ? null : match.userId)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-14 h-14 rounded-full border-2 border-gold-500/50"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-white">{user.username}</h3>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.round(user.reputation / 20)
                                  ? 'text-gold-400 fill-current'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">
                        {user.location} · {user.tradeCount} 次交易
                      </p>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-surface-light"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - match.matchScore / 100)}`}
                            className="text-gold-400"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display font-bold text-white">{match.matchScore}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">匹配度</p>
                    </div>

                    <div className="text-center">
                      <p className="font-display text-2xl font-bold text-green-400">{match.mutualMatches}</p>
                      <p className="text-xs text-gray-400">互补卡牌</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 md:ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTrade(match.userId);
                      }}
                      className="btn-gold flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      发起换牌
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedMatch === match.userId && (
                  <div className="mt-6 pt-6 border-t border-white/10 grid md:grid-cols-2 gap-6 animate-fade-in-up">
                    <div>
                      <h4 className="font-display font-bold text-green-400 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        对方拥有（你想要的）
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {match.cardsTheyHave.map((cardId) => {
                          const card = getCardById(cardId);
                          return card ? (
                            <span
                              key={cardId}
                              className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm"
                            >
                              {card.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-blue-400 mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        对方想要的（你拥有）
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {match.cardsTheyWant.map((cardId) => {
                          const card = getCardById(cardId);
                          return card ? (
                            <span
                              key={cardId}
                              className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm"
                            >
                              {card.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredMatches.length === 0 && (
          <div className="text-center py-20 glass-card">
            <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="font-display text-xl font-bold text-white mb-2">暂无匹配</h3>
            <p className="text-gray-400 mb-6">完善您的收藏和愿望清单，稍后再来看看吧！</p>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      {showTradeModal && targetUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-xl font-bold text-white">发起换牌请求</h3>
                <p className="text-sm text-gray-400">与 {targetUser.username} 进行交易</p>
              </div>
              <button onClick={() => setShowTradeModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-2 mb-6">
              {['选择我给出的', '选择我想要的', '确认并提交'].map((label, idx) => {
                const stepKeys = ['select-offered', 'select-requested', 'confirm'] as const;
                const isActive = step === stepKeys[idx];
                const isDone = stepKeys.indexOf(step) > idx;
                return (
                  <div key={idx} className="flex items-center flex-1">
                    <div className={`flex items-center gap-2 ${isActive ? '' : 'opacity-60'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isDone ? 'bg-green-500 text-white' :
                        isActive ? 'bg-gold-500 text-surface-dark' :
                        'bg-surface-light text-gray-400'
                      }`}>
                        {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className="text-sm hidden sm:inline">{label}</span>
                    </div>
                    {idx < 2 && <div className="flex-1 h-0.5 bg-surface-light mx-2" />}
                  </div>
                );
              })}
            </div>

            <div className="flex-1 overflow-auto">
              {step === 'select-offered' && (
                <div>
                  <h4 className="font-bold text-white mb-4">从我的收藏中选择要给出的卡牌</h4>
                  {myCollectionCards.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {myCollectionCards.map((item) => {
                        const isSelected = offeredCards.some((c) => c.cardId === item.cardId);
                        const selectedItem = offeredCards.find((c) => c.cardId === item.cardId);
                        return (
                          <div
                            key={item.cardId}
                            onClick={() => handleToggleOfferedCard(item.cardId, item.quantity)}
                            className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                              isSelected
                                ? 'border-gold-500 bg-gold-500/10'
                                : 'border-white/10 bg-surface hover:border-gold-500/50'
                            }`}
                          >
                            <p className="text-sm font-medium text-white truncate">{item.card!.name}</p>
                            <p className="text-xs text-gray-400">持有: {item.quantity} 张</p>
                            {isSelected && selectedItem && (
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateOfferedQuantity(item.cardId, -1, item.quantity);
                                  }}
                                  className="w-6 h-6 rounded bg-surface-light flex items-center justify-center"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-bold text-gold-400 w-6 text-center">
                                  {selectedItem.quantity}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateOfferedQuantity(item.cardId, 1, item.quantity);
                                  }}
                                  className="w-6 h-6 rounded bg-surface-light flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">您还没有收藏任何卡牌</p>
                  )}
                </div>
              )}

              {step === 'select-requested' && currentMatch && (
                <div>
                  <h4 className="font-bold text-white mb-4">选择您想要的卡牌（对方拥有）</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {currentMatch.cardsTheyHave.map((cardId) => {
                      const card = getCardById(cardId);
                      if (!card) return null;
                      const isSelected = requestedCards.some((c) => c.cardId === cardId);
                      const selectedItem = requestedCards.find((c) => c.cardId === cardId);
                      return (
                        <div
                          key={cardId}
                          onClick={() => handleToggleRequestedCard(cardId)}
                          className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                            isSelected
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-white/10 bg-surface hover:border-green-500/50'
                          }`}
                        >
                          <p className="text-sm font-medium text-white truncate">{card.name}</p>
                          <p className="text-xs text-gray-400">¥{card.estimatedValue}</p>
                          {isSelected && selectedItem && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateRequestedQuantity(cardId, -1);
                                }}
                                className="w-6 h-6 rounded bg-surface-light flex items-center justify-center"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-bold text-green-400 w-6 text-center">
                                {selectedItem.quantity}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateRequestedQuantity(cardId, 1);
                                }}
                                className="w-6 h-6 rounded bg-surface-light flex items-center justify-center"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="glass-card p-4">
                      <h4 className="font-bold text-gold-400 mb-3">我给出的</h4>
                      {offeredCards.length > 0 ? (
                        <ul className="space-y-2">
                          {offeredCards.map((c) => {
                            const card = getCardById(c.cardId);
                            return card ? (
                              <li key={c.cardId} className="flex justify-between text-sm">
                                <span className="text-white">{card.name}</span>
                                <span className="text-gold-400">×{c.quantity}</span>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm">未选择</p>
                      )}
                    </div>
                    <div className="glass-card p-4">
                      <h4 className="font-bold text-green-400 mb-3">我想要的</h4>
                      {requestedCards.length > 0 ? (
                        <ul className="space-y-2">
                          {requestedCards.map((c) => {
                            const card = getCardById(c.cardId);
                            return card ? (
                              <li key={c.cardId} className="flex justify-between text-sm">
                                <span className="text-white">{card.name}</span>
                                <span className="text-green-400">×{c.quantity}</span>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm">未选择</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">补充说明（可选）</label>
                    <textarea
                      value={tradeMessage}
                      onChange={(e) => setTradeMessage(e.target.value)}
                      placeholder="可以在这里说明品相要求、补差方式、邮寄方式等..."
                      className="w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-600 resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
              {step !== 'select-offered' && (
                <button
                  onClick={() => setStep(step === 'select-requested' ? 'select-offered' : 'select-requested')}
                  className="flex-1 btn-outline"
                >
                  上一步
                </button>
              )}
              {step !== 'confirm' ? (
                <button
                  onClick={() => setStep(step === 'select-offered' ? 'select-requested' : 'confirm')}
                  className="flex-1 btn-gold flex items-center justify-center gap-2"
                  disabled={(step === 'select-offered' && offeredCards.length === 0) || (step === 'select-requested' && requestedCards.length === 0)}
                >
                  下一步
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitTrade}
                  className="flex-1 btn-gold flex items-center justify-center gap-2"
                  disabled={offeredCards.length === 0 || requestedCards.length === 0}
                >
                  <Send className="w-4 h-4" />
                  提交换牌请求
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
