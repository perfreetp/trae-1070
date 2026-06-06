import { useState, useMemo } from 'react';
import { Plus, Upload, Download, Trash2, Edit3, BarChart3, PieChart, TrendingUp, X, Check, Copy, Save, Layers, History, Clock, TrendingDown, TrendingUp as TrendingUpIcon, FileText, Table } from 'lucide-react';
import { useUserStore, getCardVersionPrice } from '../store/useUserStore';
import { useCardStore } from '../store/useCardStore';
import { CardDisplay, CardDetailModal } from '../components/Card/CardDisplay';
import type { Card, CardCondition, Language, CollectionItem, CollectionChangeSource } from '../types';

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

const sourceLabels: Record<CollectionChangeSource, { label: string; color: string }> = {
  'manual': { label: '手动编辑', color: 'bg-blue-500/20 text-blue-400' },
  'bulk-import': { label: '批量导入', color: 'bg-green-500/20 text-green-400' },
  'trade': { label: '交易完成', color: 'bg-purple-500/20 text-purple-400' },
  'delete': { label: '删除版本', color: 'bg-red-500/20 text-red-400' },
};

interface EditFormState {
  quantity: number;
  condition: CardCondition;
  language: Language;
}

export default function MyCollection() {
  const { collection, collectionChangeLogs, getCollectionStats, removeFromCollection, updateCollectionItem, bulkImportCollection, addToCollection } = useUserStore();
  const { getCardById, cards } = useCardStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'history'>('list');
  const [exportFormat, setExportFormat] = useState<'simple' | 'detailed'>('simple');
  const [editForm, setEditForm] = useState<EditFormState>({
    quantity: 1,
    condition: 'near-mint',
    language: 'zh-CN',
  });

  const stats = useMemo(() => getCollectionStats(), [getCollectionStats, collection, cards]);

  const collectionWithCards = useMemo(() => 
    collection.map((item) => {
      const card = getCardById(item.cardId);
      const price = card ? getCardVersionPrice(card, item.condition, item.language) : 0;
      return {
        ...item,
        card,
        unitPrice: price,
        subTotal: price * item.quantity,
        versionKey: `${item.cardId}-${item.condition}-${item.language}`,
      };
    }).filter((item) => item.card),
    [collection, getCardById, cards]
  );

  const groupedByCard = useMemo(() => {
    const groups = new Map<string, typeof collectionWithCards>();
    collectionWithCards.forEach((item) => {
      const existing = groups.get(item.cardId) || [];
      existing.push(item);
      groups.set(item.cardId, existing);
    });
    return groups;
  }, [collectionWithCards]);

  const simpleExportText = useMemo(() => {
    return collectionWithCards.map((item) => {
      return `${item.quantity}x ${item.card!.name} [${conditionLabels[item.condition]}] [${languageLabels[item.language]}]`;
    }).join('\n');
  }, [collectionWithCards]);

  const detailedExportText = useMemo(() => {
    const lines: string[] = [];
    lines.push('收藏估值明细清单');
    lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`总卡牌数: ${stats.totalCards || 0}`);
    lines.push(`总估值: ¥${(stats.totalValue || 0).toLocaleString()}`);
    lines.push(`版本数: ${collection.length}`);
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('数量\t卡牌名\t\t品相\t语言\t\t单价\t小计');
    lines.push('='.repeat(80));
    
    let grandTotal = 0;
    collectionWithCards.forEach((item) => {
      lines.push(
        `${item.quantity}\t${item.card!.name.padEnd(12, ' ')}\t${conditionLabels[item.condition]}\t${languageLabels[item.language]}\t¥${item.unitPrice}\t¥${item.subTotal.toLocaleString()}`
      );
      grandTotal += item.subTotal;
    });
    
    lines.push('='.repeat(80));
    lines.push(`\t\t\t\t\t合计:\t¥${grandTotal.toLocaleString()}`);
    
    return lines.join('\n');
  }, [collectionWithCards, stats, collection.length]);

  const exportText = useMemo(() => 
    exportFormat === 'simple' ? simpleExportText : detailedExportText,
    [exportFormat, simpleExportText, detailedExportText]
  );

  const handleStartEdit = (item: CollectionItem) => {
    setEditingKey(`${item.cardId}-${item.condition}-${item.language}`);
    setEditForm({
      quantity: item.quantity,
      condition: item.condition,
      language: item.language,
    });
  };

  const handleSaveEdit = (item: CollectionItem) => {
    if (editForm.quantity <= 0) {
      removeFromCollection(item.cardId, item.condition, item.language, 'delete');
    } else {
      updateCollectionItem(item.cardId, item.condition, item.language, editForm);
    }
    setEditingKey(null);
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
      alert(`成功导入 ${items.length} 条记录${failed > 0 ? `，${failed} 条未识别` : ''}`);
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
    a.download = `my-collection-${new Date().toISOString().split('T')[0]}${exportFormat === 'detailed' ? '-detailed' : ''}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isEditing = (item: CollectionItem) => {
    return editingKey === `${item.cardId}-${item.condition}-${item.language}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                <Layers className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-white">{collection.length}</p>
            <p className="text-sm text-gray-400">不同版本</p>
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-gold-500 text-surface-dark'
                : 'bg-surface text-gray-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              收藏列表
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-gold-500 text-surface-dark'
                : 'bg-surface text-gray-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" />
              变动记录
              {collectionChangeLogs.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">
                  {collectionChangeLogs.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {activeTab === 'list' ? (
          <>
            {/* Collection List */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-white">
                收藏列表 <span className="text-gold-400">({groupedByCard.size} 种卡牌，共 {collection.length} 个版本)</span>
              </h2>
            </div>

            {collectionWithCards.length > 0 ? (
              <div className="space-y-6">
                {Array.from(groupedByCard.entries()).map(([cardId, versions], groupIdx) => {
                  const firstVersion = versions[0];
                  const card = firstVersion.card!;
                  const totalQty = versions.reduce((sum, v) => sum + v.quantity, 0);
                  const totalValue = versions.reduce((sum, v) => sum + v.subTotal, 0);
                  
                  return (
                    <div key={cardId} className="glass-card p-4 animate-fade-in-up" style={{ animationDelay: `${groupIdx * 0.05}s` }}>
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Card Image */}
                        <div className="w-32 flex-shrink-0">
                          <CardDisplay
                            card={card}
                            onView={() => setSelectedCard(card)}
                          />
                        </div>
                        
                        {/* Card Info & Versions */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                                {card.name}
                                <span className={`text-xs px-2 py-0.5 rounded-full rarity-${card.rarity}`}>
                                  {card.rarity === 'common' && '普通'}
                                  {card.rarity === 'uncommon' && '非普通'}
                                  {card.rarity === 'rare' && '稀有'}
                                  {card.rarity === 'mythic' && '秘稀'}
                                  {card.rarity === 'legendary' && '传说'}
                                </span>
                              </h3>
                              <p className="text-sm text-gray-400">{card.setName} · {card.type}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-400">合计 {totalQty} 张</p>
                              <p className="font-bold text-gold-400">¥{totalValue.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          {/* Version List */}
                          <div className="space-y-2">
                            {versions.map((item) => (
                              <div key={item.versionKey} className="bg-surface rounded-lg p-3">
                                {isEditing(item) ? (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                      <label className="text-xs text-gray-400 block mb-1">数量</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={editForm.quantity}
                                        onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                                        className="w-full px-2 py-1.5 text-sm bg-surface-light border border-white/10 rounded text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-400 block mb-1">品相</label>
                                      <select
                                        value={editForm.condition}
                                        onChange={(e) => setEditForm({ ...editForm, condition: e.target.value as CardCondition })}
                                        className="w-full px-2 py-1.5 text-sm bg-surface-light border border-white/10 rounded text-white"
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
                                        className="w-full px-2 py-1.5 text-sm bg-surface-light border border-white/10 rounded text-white"
                                      >
                                        {Object.entries(languageLabels).map(([key, label]) => (
                                          <option key={key} value={key}>{label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex items-end gap-2">
                                      <button
                                        onClick={() => handleSaveEdit(item)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-gold-500 text-surface-dark rounded-lg font-medium hover:bg-gold-400 transition-colors"
                                      >
                                        <Save className="w-3.5 h-3.5" />
                                        保存
                                      </button>
                                      <button
                                        onClick={() => setEditingKey(null)}
                                        className="px-3 py-1.5 text-sm bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                                        {languageLabels[item.language]}
                                      </span>
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                                        {conditionLabels[item.condition]}
                                      </span>
                                      <span className="text-gray-400">
                                        单价: <span className="text-white">¥{item.unitPrice}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <span className="text-lg font-bold text-white">×{item.quantity}</span>
                                        <span className="text-gold-400 font-bold ml-3">¥{item.subTotal.toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleStartEdit(item)}
                                          className="p-2 text-gold-400 hover:text-gold-300 hover:bg-gold-500/10 rounded-lg transition-colors"
                                          title="编辑"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => removeFromCollection(item.cardId, item.condition, item.language, 'delete')}
                                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                          title="删除"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
          </>
        ) : (
          <>
            {/* History List */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-white">
                收藏变动记录 <span className="text-gold-400">({collectionChangeLogs.length} 条)</span>
              </h2>
            </div>

            {collectionChangeLogs.length > 0 ? (
              <div className="glass-card overflow-hidden">
                <div className="divide-y divide-white/5">
                  {collectionChangeLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            log.quantityChange > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {log.quantityChange > 0 ? (
                              <TrendingUpIcon className={`w-5 h-5 ${log.quantityChange > 0 ? 'text-green-400' : 'text-red-400'}`} />
                            ) : (
                              <TrendingDown className={`w-5 h-5 ${log.quantityChange > 0 ? 'text-green-400' : 'text-red-400'}`} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-white">{log.cardName}</h4>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                {languageLabels[log.language]}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                                {conditionLabels[log.condition]}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className={`font-bold ${log.quantityChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {log.quantityChange > 0 ? '+' : ''}{log.quantityChange} 张
                              </span>
                              <span className="text-gray-500">→</span>
                              <span className="text-gray-400">当前 {log.quantityAfter} 张</span>
                              {log.sourceDescription && (
                                <span className="text-gray-500">· {log.sourceDescription}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${sourceLabels[log.source].color}`}>
                            {sourceLabels[log.source].label}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 glass-card">
                <History className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="font-display text-xl font-bold text-white mb-2">暂无变动记录</h3>
                <p className="text-gray-400">收藏的导入、编辑、交易等变动会在这里显示</p>
              </div>
            )}
          </>
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
              每行一条记录，格式：<code className="text-gold-400">数量x 卡牌名 [品相] [语言]</code><br />
              示例：<code className="text-gold-400">2x 暗影龙王 [全新] [简体中文]</code><br />
              相同版本会自动合并数量，不同版本会新增条目
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="3x 烈焰法师 [近新] [简体中文]&#10;1x 圣光守护者 [全新] [英文]&#10;2x 森林守望者 [优秀] [简体中文]"
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
          <div className="glass-card p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-white">导出收藏清单</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Format Selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setExportFormat('simple')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors ${
                  exportFormat === 'simple'
                    ? 'bg-gold-500 text-surface-dark'
                    : 'bg-surface text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                <FileText className="w-4 h-4" />
                纯文本清单
              </button>
              <button
                onClick={() => setExportFormat('detailed')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors ${
                  exportFormat === 'detailed'
                    ? 'bg-gold-500 text-surface-dark'
                    : 'bg-surface text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                <Table className="w-4 h-4" />
                带估值明细
              </button>
            </div>
            
            <div className="flex-1 w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-white font-mono text-sm overflow-auto mb-4 whitespace-pre">
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
