import { useState, useMemo } from 'react';
import { Plus, Upload, Download, Trash2, Edit3, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useCardStore } from '../store/useCardStore';
import { CardDisplay, CardDetailModal } from '../components/Card/CardDisplay';
import type { Card } from '../types';

export default function MyCollection() {
  const { collection, getCollectionStats, removeFromCollection, updateCollectionItem } = useUserStore();
  const { getCardById, cards } = useCardStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const stats = useMemo(() => getCollectionStats(), [getCollectionStats, collection, cards]);

  const collectionWithCards = useMemo(() => 
    collection.map((item) => ({
      ...item,
      card: getCardById(item.cardId),
    })).filter((item) => item.card),
    [collection, getCardById, cards]
  );

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-white mb-2">
              我的 <span className="text-gradient-gold">收藏</span>
            </h1>
            <p className="text-gray-400">管理您的卡牌藏品，标记品相和语言版本</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button className="btn-outline flex items-center gap-2">
              <Upload className="w-4 h-4" />
              批量导入
            </button>
            <button className="btn-outline flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出清单
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-white">{stats.totalCards}</p>
            <p className="text-sm text-gray-400">卡牌总数</p>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gold-400" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-gold-400">¥{stats.totalValue.toLocaleString()}</p>
            <p className="text-sm text-gray-400">估值总额</p>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-white">{collection.length}</p>
            <p className="text-sm text-gray-400">不同卡牌</p>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-white">
              {Object.keys(stats.rarityDistribution).length}
            </p>
            <p className="text-sm text-gray-400">稀有度种类</p>
          </div>
        </div>

        {/* Rarity Distribution */}
        <div className="glass-card p-6 mb-8">
          <h3 className="font-display font-bold text-white mb-4">稀有度分布</h3>
          <div className="space-y-3">
            {Object.entries(stats.rarityDistribution).map(([rarity, count]) => {
              const percentage = stats.totalCards > 0 ? (count / stats.totalCards) * 100 : 0;
              const rarityLabels: Record<string, string> = {
                common: '普通',
                uncommon: '非普通',
                rare: '稀有',
                mythic: '秘稀',
                legendary: '传说',
              };
              const rarityColors: Record<string, string> = {
                common: 'bg-gray-500',
                uncommon: 'bg-green-500',
                rare: 'bg-blue-500',
                mythic: 'bg-purple-500',
                legendary: 'bg-gold-500',
              };
              return (
                <div key={rarity} className="flex items-center gap-4">
                  <span className="w-16 text-sm text-gray-400">{rarityLabels[rarity]}</span>
                  <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full ${rarityColors[rarity]} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm text-white font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collection Grid */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-white">
            收藏列表 <span className="text-gold-400">({collection.length})</span>
          </h2>
        </div>

        {collectionWithCards.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {collectionWithCards.map((item, idx) => (
              <div key={item.cardId} className="relative animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                <CardDisplay
                  card={item.card!}
                  quantity={item.quantity}
                  onView={() => setSelectedCard(item.card!)}
                />
                <div className="absolute -bottom-2 left-2 right-2 glass-card py-1.5 px-2 text-xs flex items-center justify-between">
                  <span className="text-gray-400">×{item.quantity}</span>
                  <span className="text-gold-400">
                    {item.condition === 'mint' ? '全新' : 
                     item.condition === 'near-mint' ? '近新' : 
                     item.condition === 'excellent' ? '优秀' : '良好'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass-card">
            <Plus className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="font-display text-xl font-bold text-white mb-2">还没有收藏</h3>
            <p className="text-gray-400 mb-6">去卡牌图鉴添加您的第一张收藏吧！</p>
            <button className="btn-gold">
              前往卡牌图鉴
            </button>
          </div>
        )}
      </div>

      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
