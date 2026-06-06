import { useState, useMemo } from 'react';
import { Star, Plus, Trash2, ArrowUp, CheckCircle, X } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useCardStore } from '../store/useCardStore';
import { CardDisplay, CardDetailModal } from '../components/Card/CardDisplay';
import type { Card, WishlistItem } from '../types';

export default function Wishlist() {
  const { wishlist, getWishlistCompletion, removeFromWishlist, updateWishlistItem, isInCollection, getCollectionQuantity } = useUserStore();
  const { getCardById, cards } = useCardStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [filterPriority, setFilterPriority] = useState<number | null>(null);

  const completion = useMemo(() => getWishlistCompletion(), [getWishlistCompletion, wishlist, cards]);

  const wishlistWithCards = useMemo(() => 
    wishlist
      .map((item) => ({
        ...item,
        card: getCardById(item.cardId),
        owned: isInCollection(item.cardId),
        ownedQty: getCollectionQuantity(item.cardId),
      }))
      .filter((item) => item.card)
      .filter((item) => filterPriority === null || item.priority === filterPriority),
    [wishlist, getCardById, isInCollection, getCollectionQuantity, filterPriority, cards]
  );

  const priorityLabels: Record<number, string> = {
    1: '高优先级',
    2: '中优先级',
    3: '低优先级',
  };

  const priorityColors: Record<number, string> = {
    1: 'bg-red-500/20 text-red-400 border-red-500/50',
    2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    3: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">
            愿望 <span className="text-gradient-gold">清单</span>
          </h1>
          <p className="text-gray-400">标记想要的卡牌，追踪获取进度</p>
        </div>

        {/* Completion Progress */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-white mb-1">完成度</h3>
              <p className="text-sm text-gray-400">已获得 {completion.owned} / {completion.total} 张想要的卡牌</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-surface-light"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - completion.percentage / 100)}`}
                    className="text-gold-400 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-xl font-bold text-white">{completion.percentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterPriority(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterPriority === null
                ? 'bg-gold-500 text-surface-dark'
                : 'bg-surface text-gray-400 hover:text-white'
            }`}
          >
            全部
          </button>
          {[1, 2, 3].map((priority) => (
            <button
              key={priority}
              onClick={() => setFilterPriority(priority)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterPriority === priority
                  ? priorityColors[priority] + ' border'
                  : 'bg-surface text-gray-400 hover:text-white'
              }`}
            >
              {priorityLabels[priority]}
            </button>
          ))}
        </div>

        {/* Wishlist Grid */}
        {wishlistWithCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlistWithCards.map((item, idx) => (
              <div
                key={item.cardId}
                className="glass-card p-4 flex gap-4 animate-fade-in-up card-hover"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <img
                  src={item.card!.image}
                  alt={item.card!.name}
                  className="w-20 h-28 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                  onClick={() => setSelectedCard(item.card!)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-display font-bold text-white truncate">{item.card!.name}</h4>
                      <p className="text-xs text-gray-400">{item.card!.setName}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${priorityColors[item.priority]}`}>
                      {priorityLabels[item.priority]}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <span className="text-xs text-gray-500">需要</span>
                      <p className="font-bold text-white">×{item.quantityWanted}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">已拥有</span>
                      <p className={`font-bold ${item.ownedQty >= item.quantityWanted ? 'text-green-400' : 'text-gold-400'}`}>
                        ×{item.ownedQty}
                        {item.ownedQty >= item.quantityWanted && (
                          <CheckCircle className="w-3 h-3 inline ml-1" />
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">参考价</span>
                      <p className="font-bold text-gold-400">¥{item.card!.estimatedValue}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateWishlistItem(item.cardId, { priority: Math.max(1, item.priority - 1) as 1 | 2 | 3 })}
                      className="p-1.5 rounded-lg bg-surface hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
                      disabled={item.priority <= 1}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateWishlistItem(item.cardId, { priority: Math.min(3, item.priority + 1) as 1 | 2 | 3 })}
                      className="p-1.5 rounded-lg bg-surface hover:bg-surface-light text-gray-400 hover:text-white transition-colors rotate-180"
                      disabled={item.priority >= 3}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.cardId)}
                      className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass-card">
            <Star className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="font-display text-xl font-bold text-white mb-2">愿望清单为空</h3>
            <p className="text-gray-400 mb-6">在卡牌图鉴中添加您想要的卡牌吧！</p>
          </div>
        )}
      </div>

      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
