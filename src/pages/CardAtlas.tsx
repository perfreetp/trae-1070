import { useState, useMemo } from 'react';
import { Search, Filter, Grid, List, X } from 'lucide-react';
import { useCardStore } from '../store/useCardStore';
import { CardDisplay, CardDetailModal } from '../components/Card/CardDisplay';
import type { Card, Rarity } from '../types';

const rarityOptions = [
  { value: '', label: '全部稀有度' },
  { value: 'common', label: '普通' },
  { value: 'uncommon', label: '非普通' },
  { value: 'rare', label: '稀有' },
  { value: 'mythic', label: '秘稀' },
  { value: 'legendary', label: '传说' },
];

export default function CardAtlas() {
  const { cards, sets, filters, setFilters, getFilteredCards, getCardById } = useCardStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredCards = useMemo(() => getFilteredCards(), [getFilteredCards, cards, filters]);

  const handleRarityChange = (value: string) => {
    setFilters({ rarity: value as Rarity | undefined });
  };

  const handleSetChange = (value: string) => {
    setFilters({ set: value || undefined });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">
            卡牌 <span className="text-gradient-gold">图鉴</span>
          </h1>
          <p className="text-gray-400">浏览全部卡牌，按系列和稀有度筛选查找</p>
        </div>

        {/* Search and Filters */}
        <div className="glass-card p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索卡牌名称..."
                value={filters.search || ''}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                  showFilters 
                    ? 'bg-gold-500/20 border-gold-500/50 text-gold-400' 
                    : 'bg-surface border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <Filter className="w-4 h-4" />
                筛选
              </button>
              <div className="flex rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 ${viewMode === 'grid' ? 'bg-gold-500/20 text-gold-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 ${viewMode === 'list' ? 'bg-gold-500/20 text-gold-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10 animate-fade-in-up">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">卡牌系列</label>
                <select
                  value={filters.set || ''}
                  onChange={(e) => handleSetChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white focus:outline-none focus:border-gold-500/50"
                >
                  <option value="">全部系列</option>
                  {sets.map((set) => (
                    <option key={set.id} value={set.id}>{set.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">稀有度</label>
                <select
                  value={filters.rarity || ''}
                  onChange={(e) => handleRarityChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white focus:outline-none focus:border-gold-500/50"
                >
                  {rarityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            共找到 <span className="text-gold-400 font-bold">{filteredCards.length}</span> 张卡牌
          </p>
          {(filters.search || filters.set || filters.rarity) && (
            <button
              onClick={() => setFilters({ search: undefined, set: undefined, rarity: undefined })}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
            >
              清除筛选
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Cards Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredCards.map((card, idx) => (
              <div key={card.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                <CardDisplay
                  card={card}
                  showQuantity
                  onView={() => setSelectedCard(card)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCards.map((card, idx) => (
              <div
                key={card.id}
                className="glass-card p-4 flex items-center gap-4 card-hover cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => setSelectedCard(card)}
              >
                <img src={card.image} alt={card.name} className="w-16 h-20 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-white truncate">{card.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      card.rarity === 'legendary' ? 'bg-gold-500 text-surface-dark' :
                      card.rarity === 'mythic' ? 'bg-primary-500 text-white' :
                      card.rarity === 'rare' ? 'bg-blue-500 text-white' :
                      card.rarity === 'uncommon' ? 'bg-green-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {card.rarity === 'common' ? '普通' :
                       card.rarity === 'uncommon' ? '非普通' :
                       card.rarity === 'rare' ? '稀有' :
                       card.rarity === 'mythic' ? '秘稀' : '传说'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{card.type}</p>
                  <p className="text-xs text-gray-500">{card.setName}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-gold-400">¥{card.estimatedValue}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredCards.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="font-display text-xl font-bold text-white mb-2">未找到卡牌</h3>
            <p className="text-gray-400">请尝试调整筛选条件或搜索关键词</p>
          </div>
        )}
      </div>

      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
