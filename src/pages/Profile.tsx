import { useState, useMemo } from 'react';
import { User, Star, Shield, Clock, Settings, Ban, CheckCircle, XCircle, Edit3, Mail, MapPin } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useTradeStore } from '../store/useTradeStore';
import { useCardStore } from '../store/useCardStore';
import { getUserById, USERS } from '../data/users';

export default function Profile() {
  const { currentUser, collection, wishlist, getCollectionStats, isBlocked, blockUser, unblockUser } = useUserStore();
  const { tradeRequests } = useTradeStore();
  const { getCardById, cards } = useCardStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'blocked' | 'settings'>('overview');

  const stats = useMemo(() => getCollectionStats(), [getCollectionStats, collection, cards]);
  const completedTrades = useMemo(() => 
    tradeRequests.filter((t) => t.status === 'completed'), 
    [tradeRequests]
  );

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="glass-card p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-600/50 to-gold-500/30" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 pt-16">
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className="w-24 h-24 rounded-full border-4 border-gold-500/50 bg-surface"
            />
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-3xl font-bold text-white mb-1">
                {currentUser.username}
              </h1>
              <p className="text-gray-400 mb-3">{currentUser.bio}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentUser.location}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {currentUser.email}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(currentUser.reputation / 20)
                          ? 'text-gold-400 fill-current'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400">信誉 {currentUser.reputation}</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-gold-400">
                  {currentUser.tradeCount}
                </p>
                <p className="text-xs text-gray-400">成功交易</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin">
          {[
            { id: 'overview', label: '概览', icon: User },
            { id: 'history', label: '交易历史', icon: Clock },
            { id: 'blocked', label: '屏蔽管理', icon: Ban },
            { id: 'settings', label: '设置', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gold-500 text-surface-dark'
                    : 'bg-surface text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Collection Stats */}
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold-400" />
                收藏统计
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">卡牌总数</span>
                  <span className="font-bold text-white">{stats.totalCards}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">不同卡牌</span>
                  <span className="font-bold text-white">{collection.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">估值总额</span>
                  <span className="font-bold text-gold-400">¥{stats.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">愿望清单</span>
                  <span className="font-bold text-white">{wishlist.length} 张</span>
                </div>
              </div>
            </div>

            {/* Trade Stats */}
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold-400" />
                交易统计
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">总交易数</span>
                  <span className="font-bold text-white">{tradeRequests.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">已完成</span>
                  <span className="font-bold text-green-400">{completedTrades.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">进行中</span>
                  <span className="font-bold text-yellow-400">
                    {tradeRequests.filter((t) => ['pending', 'accepted', 'shipped'].includes(t.status)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">成功率</span>
                  <span className="font-bold text-gold-400">
                    {tradeRequests.length > 0
                      ? Math.round((completedTrades.length / tradeRequests.length) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-gold-400" />
                成就徽章
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: '新手', icon: '🌱', unlocked: true },
                  { name: '收藏家', icon: '💎', unlocked: stats.totalCards >= 20 },
                  { name: '交易达人', icon: '🤝', unlocked: currentUser.tradeCount >= 10 },
                  { name: '稀有猎人', icon: '⭐', unlocked: Object.keys(stats.rarityDistribution).includes('legendary') },
                  { name: '信誉王', icon: '👑', unlocked: currentUser.reputation >= 95 },
                  { name: '套牌大师', icon: '🃏', unlocked: false },
                ].map((badge, idx) => (
                  <div
                    key={idx}
                    className={`text-center p-3 rounded-xl ${
                      badge.unlocked
                        ? 'bg-gold-500/20 border border-gold-500/30'
                        : 'bg-surface opacity-50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{badge.icon}</span>
                    <p className={`text-xs ${badge.unlocked ? 'text-gold-400' : 'text-gray-500'}`}>
                      {badge.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold text-white mb-4">交易历史</h3>
            {completedTrades.length > 0 ? (
              completedTrades.map((trade) => {
                const otherUser = getUserById(
                  trade.fromUserId === 'current-user' ? trade.toUserId : trade.fromUserId
                );
                if (!otherUser) return null;
                return (
                  <div key={trade.id} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img src={otherUser.avatar} alt="" className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-medium text-white">{otherUser.username}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(trade.updatedAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400">
                        已完成
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">收到</p>
                        <div className="space-y-1">
                          {trade.offeredCards.map((card, idx) => {
                            const cardData = getCardById(card.cardId);
                            return cardData ? (
                              <div key={idx} className="text-sm text-green-400">
                                +{card.quantity}x {cardData.name}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">付出</p>
                        <div className="space-y-1">
                          {trade.requestedCards.map((card, idx) => {
                            const cardData = getCardById(card.cardId);
                            return cardData ? (
                              <div key={idx} className="text-sm text-red-400">
                                -{card.quantity}x {cardData.name}
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 glass-card">
                <Clock className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">暂无交易历史</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className="glass-card p-6">
            <h3 className="font-display font-bold text-white mb-4">屏蔽的用户</h3>
            {currentUser.blockedUsers.length > 0 ? (
              <div className="space-y-3">
                {currentUser.blockedUsers.map((userId) => {
                  const user = getUserById(userId);
                  if (!user) return null;
                  return (
                    <div key={userId} className="flex items-center justify-between p-3 rounded-lg bg-surface">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-medium text-white">{user.username}</p>
                          <p className="text-xs text-gray-400">{user.tradeCount} 次交易</p>
                        </div>
                      </div>
                      <button
                        onClick={() => unblockUser(userId)}
                        className="px-4 py-1.5 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        解除屏蔽
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Ban className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">暂无屏蔽的用户</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-card p-6 max-w-2xl">
            <h3 className="font-display font-bold text-white mb-6">账户设置</h3>
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">用户名</label>
                <input
                  type="text"
                  defaultValue={currentUser.username}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white focus:outline-none focus:border-gold-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">邮箱</label>
                <input
                  type="email"
                  defaultValue={currentUser.email}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white focus:outline-none focus:border-gold-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">个人简介</label>
                <textarea
                  defaultValue={currentUser.bio}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white focus:outline-none focus:border-gold-500/50 resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">所在地区</label>
                <input
                  type="text"
                  defaultValue={currentUser.location}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white focus:outline-none focus:border-gold-500/50"
                />
              </div>
              <button className="btn-gold w-full">保存更改</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
