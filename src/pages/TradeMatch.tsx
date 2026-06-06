import { useState } from 'react';
import { Layers, Users, Star, ArrowRight, MessageSquare, RefreshCw, Zap, CheckCircle } from 'lucide-react';
import { useTradeStore } from '../store/useTradeStore';
import { useCardStore } from '../store/useCardStore';
import { getUserById } from '../data/users';
import { Link } from 'react-router-dom';

export default function TradeMatch() {
  const { matches, calculateMatches } = useTradeStore();
  const { getCardById } = useCardStore();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      calculateMatches();
      setIsRefreshing(false);
    }, 1000);
  };

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
          匹配结果 <span className="text-gold-400">({matches.length})</span>
        </h2>

        <div className="space-y-4">
          {matches.map((match, idx) => {
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
                    <Link
                      to="/chat"
                      onClick={(e) => e.stopPropagation()}
                      className="btn-primary flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      发起换牌
                    </Link>
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

        {matches.length === 0 && (
          <div className="text-center py-20 glass-card">
            <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="font-display text-xl font-bold text-white mb-2">暂无匹配</h3>
            <p className="text-gray-400 mb-6">完善您的收藏和愿望清单，稍后再来看看吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}
