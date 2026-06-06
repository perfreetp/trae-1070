import { useState } from 'react';
import { CheckSquare, Upload, AlertCircle, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useCardStore } from '../store/useCardStore';
import type { Card } from '../types';

interface DeckCard {
  id: string;
  name: string;
  quantity: number;
  card?: Card;
  owned: number;
  status: 'complete' | 'partial' | 'missing';
}

export default function DeckCheck() {
  const { isInCollection, getCollectionQuantity } = useUserStore();
  const { cards, getCardById } = useCardStore();
  const [deckInput, setDeckInput] = useState('');
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const sampleDeck = `4x 烈焰法师
2x 圣光守护者
3x 森林守望者
2x 寒冰女王
3x 烈焰元素
2x 哥布林战士
4x 圣光治愈`;

  const parseDeckList = (text: string) => {
    const lines = text.trim().split('\n');
    const parsed: DeckCard[] = [];

    lines.forEach((line) => {
      const match = line.match(/^(\d+)x?\s+(.+)$/i);
      if (match) {
        const quantity = parseInt(match[1]);
        const cardName = match[2].trim();
        const card = cards.find((c) => c.name === cardName || c.name.includes(cardName));
        
        if (card) {
          const owned = getCollectionQuantity(card.id);
          parsed.push({
            id: card.id,
            name: card.name,
            quantity,
            card,
            owned,
            status: owned >= quantity ? 'complete' : owned > 0 ? 'partial' : 'missing',
          });
        } else {
          parsed.push({
            id: `unknown-${Date.now()}-${Math.random()}`,
            name: cardName,
            quantity,
            owned: 0,
            status: 'missing',
          });
        }
      }
    });

    return parsed;
  };

  const handleAnalyze = () => {
    const parsed = parseDeckList(deckInput);
    setDeckCards(parsed);
    setIsAnalyzed(true);
  };

  const handleLoadSample = () => {
    setDeckInput(sampleDeck);
  };

  const totalCards = deckCards.reduce((sum, c) => sum + c.quantity, 0);
  const ownedCards = deckCards.reduce((sum, c) => sum + Math.min(c.owned, c.quantity), 0);
  const completionRate = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0;

  const completeCount = deckCards.filter((c) => c.status === 'complete').length;
  const partialCount = deckCards.filter((c) => c.status === 'partial').length;
  const missingCount = deckCards.filter((c) => c.status === 'missing').length;

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">
            套牌 <span className="text-gradient-gold">检测</span>
          </h1>
          <p className="text-gray-400">导入套牌列表，检查缺卡情况，获取获取渠道推荐</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="glass-card p-6">
            <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-gold-400" />
              导入套牌列表
            </h3>
            
            <textarea
              value={deckInput}
              onChange={(e) => setDeckInput(e.target.value)}
              placeholder="粘贴套牌列表，每行格式：数量x 卡牌名称&#10;例如：&#10;4x 烈焰法师&#10;2x 圣光守护者"
              className="w-full h-64 px-4 py-3 rounded-xl bg-surface border border-white/10 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gold-500/50 font-mono text-sm"
            />

            <div className="flex gap-2 mt-4">
              <button onClick={handleAnalyze} className="btn-gold flex-1">
                开始检测
              </button>
              <button onClick={handleLoadSample} className="btn-outline">
                加载示例
              </button>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-surface">
              <p className="text-xs text-gray-400">
                <span className="text-gold-400">提示：</span>
                支持格式："数量x 卡牌名称"，每行一张。例如 "4x 烈焰法师"
              </p>
            </div>
          </div>

          {/* Results Section */}
          {isAnalyzed ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="glass-card p-6">
                <h3 className="font-display font-bold text-white mb-4">检测结果</h3>
                
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-surface-light"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - completionRate / 100)}`}
                        className={completionRate >= 80 ? 'text-green-400' : completionRate >= 50 ? 'text-yellow-400' : 'text-red-400'}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-3xl font-bold text-white">{completionRate}%</span>
                      <span className="text-xs text-gray-400">完成度</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-green-500/10">
                    <p className="font-display text-2xl font-bold text-green-400">{completeCount}</p>
                    <p className="text-xs text-gray-400">已齐</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                    <p className="font-display text-2xl font-bold text-yellow-400">{partialCount}</p>
                    <p className="text-xs text-gray-400">不足</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-500/10">
                    <p className="font-display text-2xl font-bold text-red-400">{missingCount}</p>
                    <p className="text-xs text-gray-400">缺少</p>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-400">
                    已拥有 <span className="text-gold-400 font-bold">{ownedCards}</span> / {totalCards} 张卡牌
                  </p>
                </div>
              </div>

              {/* Card List */}
              <div className="glass-card p-6 max-h-96 overflow-y-auto scrollbar-thin">
                <h3 className="font-display font-bold text-white mb-4">卡牌详情</h3>
                <div className="space-y-2">
                  {deckCards.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        item.status === 'complete'
                          ? 'bg-green-500/10 border border-green-500/30'
                          : item.status === 'partial'
                          ? 'bg-yellow-500/10 border border-yellow-500/30'
                          : 'bg-red-500/10 border border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.status === 'complete' ? (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : item.status === 'partial' ? (
                          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="text-xs text-gray-400">需要 {item.quantity} 张</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          item.status === 'complete' ? 'text-green-400' :
                          item.status === 'partial' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {item.owned}/{item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center">
              <CheckSquare className="w-20 h-20 text-gray-600 mb-4" />
              <h3 className="font-display text-xl font-bold text-white mb-2">等待检测</h3>
              <p className="text-gray-400 text-center">
                在左侧粘贴您的套牌列表，点击开始检测
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
