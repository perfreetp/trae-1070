import { useState, useMemo } from 'react';
import { Plus, Upload, Download, Trash2, Edit3, BarChart3, PieChart, TrendingUp, X, Check, Copy, Save } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useCardStore } from '../store/useCardStore';
import { CardDisplay, CardDetailModal } from '../components/Card/CardDisplay';
import type { Card, CardCondition, Language, CollectionItem } from '../types';

const conditionLabels: Record<CardCondition, string> = {
  mint: '全新',
  'near-mint': '近新',
  excellent: '优秀',
  good: '良好',
  played: '使用过',
};

const languageLabels: Record<Language, string> = {
  'zh-CN': '简体中文',
  'en-US': '英文',
  'ja-JP': '日文',
  'ko-KR': '韩文',
};

export default function MyCollection() {
  const { collection, getCollectionStats, removeFromCollection, updateCollectionItem, bulkImportCollection, addToCollection } = useUserStore();
  const { getCardById, cards } = useCardStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [editForm, setEditForm] = useState<{ quantity: number; condition: CardCondition; language: Language }>({
    quantity: 1,
    condition: 'near-mint',
    language: 'zh-CN',
  });

  const stats = useMemo(() => getCollectionStats(), [getCollectionStats, collection, cards]);

  const collectionWithCards = useMemo(() => 
    collection.map((item) => ({
      ...item,
      card: getCardById(item.cardId),
    })).filter((item) => item.card),
    [collection, getCardById, cards]
  );

  const exportText = useMemo(() => {
    return collectionWithCards.map((item) => {
      return `${item.quantity}x ${item.card!.name} [${conditionLabels[item.condition]}] [${languageLabels[item.language]}]`;
    }).join('\n');
  }, [collectionWithCards]);

  const handleStartEdit = (item: CollectionItem) => {
    setEditingItem(item.cardId);
    setEditForm({
      quantity: item.quantity,
      condition: item.condition,
      language: item.language,
    });
  };

  const handleSaveEdit = (cardId: string) => {
    if (editForm.quantity <= 0) {
      removeFromCollection(cardId);
    } else {
      updateCollectionItem(cardId, editForm);
    }
    setEditingItem(null);
  };

  const handleImport = () => {
    const lines = importText.trim().split('\n');
    const items: { cardId: string; quantity: number; condition?: CardCondition; language?: Language }[] = [];
    let failed = 0;

    lines.forEach((line) => {
      if (!line.trim()) return;
      
      const match = line.match(/^(\d+)x?\s+(.+?)(?:\s*\[([^\]]+)\])?\s*(?:\[([^\]]+)\])?$/i);
      if (match) {
        const quantity = parseInt(match[1]);
        const cardName = match[2].trim();
        const conditionStr = match[3];
        const languageStr = match[4];
        
        const card = cards.find((c) => 
          c.name === cardName || 
          c.name.toLowerCase().includes(cardName.toLowerCase())
        );
        
        if (card) {
          let condition: CardCondition | undefined;
          let language: Language | undefined;
          
          if (conditionStr) {
            const condKey = Object.keys(conditionLabels).find(
              (k) => conditionLabels[k as CardCondition] === conditionStr.trim()
            ) as CardCondition | undefined;
            condition = condKey;
          }
          
          if (languageStr) {
            const langKey = Object.keys(languageLabels).find(
              (k) => languageLabels[k as Language] === languageStr.trim()
            ) as Language | undefined;
            language = langKey;
          }
          
          items.push({
            cardId: card.id,
            quantity,
            condition,
            language,
          });
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    });

    if (items.length > 0) {
      bulkImportCollection(items);
      setImportText('');
      setShowImportModal(false);
      alert(`成功导入 ${items.length} 张卡牌${failed > 0 ? `，${failed} 张未识别` : ''}`);
    } else {
      alert('未能识别任何卡牌，请检查格式');
    }
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportText);
    alert('已复制到剪贴板');
  };

  const handleDownloadExport = () => {
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-collection-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <button 
              className="btn-outline flex items-center gap-2"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="w-4 h-4" />
              批量导入
            </button>
            <button 
              className="btn-outline flex items-center gap-2"
              onClick={() => setShowExportModal(true)}
            >
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
            <p className="font-display text-3xl font-bold text-white">{stats.totalCards || 0}</p>
            <p className="text-sm text-gray-400">卡牌总数</p>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gold-400" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-gold-400">¥{(stats.totalValue || 0).toLocaleString()}</p>
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
              {Object.keys(stats.rarityDistribution || {}).length}
            </p>
            <p className="text-sm text-gray-400">稀有度种类</p>
          </div>
        </div>

        {/* Rarity Distribution */}
        <div className="glass-card p-6 mb-8">
          <h3 className="font-display font-bold text-white mb-4">稀有度分布</h3>
          <div className="space-y-3">
            {Object.entries(stats.rarityDistribution || {}).map(([rarity, count]) => {
              const percentage = stats.totalCards > 0 ? (count / stats.totalCards) * 100 : 0;
              const rarityLabelMap: Record<string, string> = {
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
                  <span className="w-16 text-sm text-gray-400">{rarityLabelMap[rarity] || rarity}</span>
                  <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full ${rarityColors[rarity] || 'bg-gray-500'} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm text-white font-medium">{count}</span>
                </div>
              );
            })}
            {Object.keys(stats.rarityDistribution || {}).length === 0 && (
              <p className="text-gray-500 text-center py-4">暂无收藏数据</p>
            )}
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
                
                {editingItem === item.cardId ? (
                  <div className="mt-2 glass-card p-3 space-y-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">数量</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 text-sm bg-surface border border-white/10 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">品相</label>
                      <select
                        value={editForm.condition}
                        onChange={(e) => setEditForm({ ...editForm, condition: e.target.value as CardCondition })}
                        className="w-full px-2 py-1 text-sm bg-surface border border-white/10 rounded text-white"
                      >
                        {Object.entries(conditionLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">语言</label>
                      <select
                        value={editForm.language}
                        onChange={(e) => setEditForm({ ...editForm, language: e.target.value as Language })}
                        className="w-full px-2 py-1 text-sm bg-surface border border-white/10 rounded text-white"
                      >
                        {Object.entries(languageLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(item.cardId)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gold-500 text-surface-dark rounded-lg font-medium hover:bg-gold-400 transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        保存
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute -bottom-2 left-2 right-2 glass-card py-1.5 px-2 text-xs flex items-center justify-between">
                    <span className="text-gray-400">×{item.quantity} · {conditionLabels[item.condition]}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1 text-gold-400 hover:text-gold-300 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCollection(item.cardId)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-white">批量导入收藏</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              每行一张卡牌，格式：<code className="text-gold-400">数量x 卡牌名 [品相] [语言]</code><br />
              示例：<code className="text-gold-400">2x 暗影龙王 [全新] [简体中文]</code>
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="3x 烈焰法师 [近新] [简体中文]&#10;1x 圣光守护者 [全新] [英文]&#10;2x 森林守望者 [优秀]"
              className="flex-1 w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-600 resize-none font-mono text-sm"
              rows={12}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleImport}
                className="flex-1 btn-gold flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                导入收藏
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 btn-outline"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-white">导出收藏清单</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-white font-mono text-sm overflow-auto mb-4">
              {exportText || '暂无收藏数据'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyExport}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                复制到剪贴板
              </button>
              <button
                onClick={handleDownloadExport}
                className="flex-1 btn-gold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载文件
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}
