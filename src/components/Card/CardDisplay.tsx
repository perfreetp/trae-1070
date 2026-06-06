import { useState } from 'react';
import { Heart, Star, Plus, Minus, Eye, X } from 'lucide-react';
import type { Card, Rarity } from '../../types';
import { useUserStore } from '../../store/useUserStore';

const rarityColors: Record<Rarity, string> = {
  common: 'border-rarity-common bg-rarity-common/10',
  uncommon: 'border-rarity-uncommon bg-rarity-uncommon/10',
  rare: 'border-rarity-rare bg-rarity-rare/10',
  mythic: 'border-rarity-mythic bg-rarity-mythic/10',
  legendary: 'border-rarity-legendary bg-rarity-legendary/10 animate-glow',
};

const rarityLabels: Record<Rarity, string> = {
  common: '普通',
  uncommon: '非普通',
  rare: '稀有',
  mythic: '秘稀',
  legendary: '传说',
};

interface CardDisplayProps {
  card: Card;
  showQuantity?: boolean;
  quantity?: number;
  onView?: () => void;
  compact?: boolean;
}

export function CardDisplay({ card, showQuantity, quantity, onView, compact }: CardDisplayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { isInCollection, isInWishlist, addToCollection, removeFromCollection, addToWishlist, removeFromWishlist, getCollectionQuantity } = useUserStore();
  
  const inCollection = isInCollection(card.id);
  const inWishlist = isInWishlist(card.id);
  const ownedQty = getCollectionQuantity(card.id);

  return (
    <div
      className={`relative rounded-xl overflow-hidden card-hover border-2 ${rarityColors[card.rarity]} ${
        compact ? 'w-36' : 'w-48'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={card.image}
          alt={card.name}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
        />
        
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
            card.rarity === 'legendary' 
              ? 'bg-gold-500 text-surface-dark' 
              : card.rarity === 'mythic'
              ? 'bg-primary-500 text-white'
              : card.rarity === 'rare'
              ? 'bg-blue-500 text-white'
              : card.rarity === 'uncommon'
              ? 'bg-green-500 text-white'
              : 'bg-gray-500 text-white'
          }`}>
            {rarityLabels[card.rarity]}
          </span>
        </div>

        {showQuantity && ownedQty > 0 && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-surface-dark/80 text-gold-400 border border-gold-500/50">
              ×{ownedQty}
            </span>
          </div>
        )}

        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/50 to-transparent flex flex-col justify-end p-3 animate-fade-in-up">
            <h4 className="font-display font-bold text-white text-sm mb-1">{card.name}</h4>
            <p className="text-xs text-gray-300 mb-3 line-clamp-2">{card.type}</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => inCollection ? removeFromCollection(card.id) : addToCollection(card.id)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  inCollection
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                }`}
              >
                {inCollection ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {inCollection ? '移除' : '收藏'}
              </button>
              <button
                onClick={() => inWishlist ? removeFromWishlist(card.id) : addToWishlist(card.id)}
                className={`flex items-center justify-center px-2 py-1.5 rounded-lg transition-colors ${
                  inWishlist
                    ? 'bg-gold-500 text-surface-dark'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <Star className={`w-3 h-3 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
              {onView && (
                <button
                  onClick={onView}
                  className="flex items-center justify-center px-2 py-1.5 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {!compact && (
        <div className="p-3 bg-surface-dark/80">
          <h4 className="font-display font-bold text-white text-sm truncate">{card.name}</h4>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400">{card.setName}</span>
            <span className="text-xs font-bold text-gold-400">¥{card.estimatedValue}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface CardDetailModalProps {
  card: Card;
  onClose: () => void;
}

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const { isInCollection, isInWishlist, addToCollection, removeFromCollection, addToWishlist, removeFromWishlist, getCollectionQuantity } = useUserStore();
  const inCollection = isInCollection(card.id);
  const inWishlist = isInWishlist(card.id);
  const ownedQty = getCollectionQuantity(card.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin glass-card gold-border"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-surface/50 text-gray-400 hover:text-white hover:bg-surface transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="relative">
            <div className={`sticky top-0 rounded-xl overflow-hidden border-2 ${rarityColors[card.rarity]}`}>
              <img src={card.image} alt={card.name} className="w-full aspect-[3/4] object-cover" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-display text-2xl font-bold text-white">{card.name}</h2>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  card.rarity === 'legendary' 
                    ? 'bg-gold-500 text-surface-dark' 
                    : 'bg-primary-500 text-white'
                }`}>
                  {rarityLabels[card.rarity]}
                </span>
              </div>
              <p className="text-gray-400">{card.type}</p>
              <p className="text-sm text-gold-400 mt-1">{card.setName}</p>
            </div>

            {card.manaCost && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">法术力费用：</span>
                <span className="font-mono text-lg text-blue-400">{card.manaCost}</span>
              </div>
            )}

            {card.power && card.toughness && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">攻防：</span>
                <span className="font-mono text-lg">
                  <span className="text-red-400">{card.power}</span>
                  <span className="text-gray-500"> / </span>
                  <span className="text-green-400">{card.toughness}</span>
                </span>
              </div>
            )}

            <div className="glass-card p-4 rounded-xl">
              <h4 className="font-display font-bold text-gold-400 mb-2">规则文本</h4>
              <p className="text-gray-300 text-sm leading-relaxed">{card.ruleText}</p>
            </div>

            {card.flavorText && (
              <div className="border-l-2 border-gold-500/50 pl-4">
                <p className="text-gray-500 italic text-sm">{card.flavorText}</p>
              </div>
            )}

            <div className="glass-card p-4 rounded-xl">
              <h4 className="font-display font-bold text-gold-400 mb-3">版本信息</h4>
              <div className="space-y-2">
                {card.versions.map((version, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">{version.language === 'zh-CN' ? '简中' : version.language === 'en-US' ? '英文' : version.language === 'ja-JP' ? '日文' : '韩文'}</span>
                      <span className="text-xs text-gray-500">/</span>
                      <span className="text-sm text-gray-400">{version.condition === 'mint' ? '全新' : version.condition === 'near-mint' ? '近新' : version.condition === 'excellent' ? '优秀' : '良好'}</span>
                    </div>
                    <span className="font-bold text-gold-400">¥{version.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div>
                <span className="text-gray-400 text-sm">参考价格</span>
                <p className="font-display text-2xl font-bold text-gold-400">¥{card.estimatedValue}</p>
                {ownedQty > 0 && (
                  <p className="text-xs text-green-400">已持有 {ownedQty} 张</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => inCollection ? removeFromCollection(card.id) : addToCollection(card.id)}
                  className={inCollection ? 'btn-outline' : 'btn-primary'}
                >
                  {inCollection ? '从收藏移除' : '加入收藏'}
                </button>
                <button
                  onClick={() => inWishlist ? removeFromWishlist(card.id) : addToWishlist(card.id)}
                  className={`px-4 py-2.5 rounded-full font-semibold transition-all ${
                    inWishlist
                      ? 'bg-gold-500 text-surface-dark'
                      : 'bg-surface-light text-gray-300 hover:bg-surface hover:text-white'
                  }`}
                >
                  <Star className={`w-4 h-4 inline mr-1 ${inWishlist ? 'fill-current' : ''}`} />
                  {inWishlist ? '已愿望' : '愿望单'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
