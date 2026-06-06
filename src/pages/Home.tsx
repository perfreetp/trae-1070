import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  Sparkles, Book, Heart, Star, 
  Layers, MessageSquare, CheckSquare, User,
  ArrowRight, TrendingUp, Users, Shield
} from 'lucide-react';
import { useCardStore } from '../store/useCardStore';
import { CardDisplay } from '../components/Card/CardDisplay';

const featureCards = [
  { icon: Book, title: '卡牌图鉴', desc: '海量卡牌数据库', path: '/atlas', color: 'from-blue-500 to-blue-700' },
  { icon: Heart, title: '我的收藏', desc: '管理个人藏品', path: '/collection', color: 'from-red-500 to-red-700' },
  { icon: Star, title: '愿望清单', desc: '标记想要的卡牌', path: '/wishlist', color: 'from-yellow-500 to-yellow-700' },
  { icon: Layers, title: '换牌匹配', desc: '智能匹配互补玩家', path: '/match', color: 'from-purple-500 to-purple-700' },
  { icon: MessageSquare, title: '交易沟通', desc: '安全便捷的交易流程', path: '/chat', color: 'from-green-500 to-green-700' },
  { icon: CheckSquare, title: '套牌检测', desc: '检查套牌缺卡', path: '/deck', color: 'from-cyan-500 to-cyan-700' },
  { icon: User, title: '个人中心', desc: '信誉与历史记录', path: '/profile', color: 'from-pink-500 to-pink-700' },
];

const tradeActivities = [
  { user: '卡牌大师', action: '成功交换了', card: '暗影龙王', time: '2分钟前' },
  { user: '圣光使者', action: '发起了换牌请求', card: '天使守护神', time: '5分钟前' },
  { user: '森林精灵', action: '确认收到了', card: '远古树人', time: '12分钟前' },
  { user: '赛博朋克', action: '添加了新收藏', card: '机甲战神', time: '20分钟前' },
  { user: '暗影猎手', action: '更新了愿望清单', card: '血族领主', time: '35分钟前' },
];

export default function Home() {
  const getPopularCards = useCardStore((state) => state.getPopularCards);
  const cards = useCardStore((state) => state.cards);
  const popularCards = useMemo(() => getPopularCards(), [getPopularCards, cards]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient opacity-50" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/30 mb-6 animate-fade-in-up">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-gold-400 text-sm font-medium">卡牌收藏爱好者的理想家园</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up animate-stagger-1">
              <span className="text-white">发现 · 收藏 · </span>
              <span className="text-gradient-gold">交换</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fade-in-up animate-stagger-2">
              管理您的卡牌收藏，寻找互补玩家，安全便捷地完成卡牌交换。
              加入我们，开启您的卡牌收藏之旅！
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up animate-stagger-3">
              <Link to="/atlas" className="btn-gold flex items-center gap-2">
                浏览卡牌图鉴
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/collection" className="btn-outline flex items-center gap-2">
                管理我的收藏
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {[
              { icon: TrendingUp, value: '50,000+', label: '卡牌总数' },
              { icon: Users, value: '10,000+', label: '活跃玩家' },
              { icon: Layers, value: '25,000+', label: '成功交换' },
              { icon: Shield, value: '99.8%', label: '交易安全率' },
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className="glass-card p-6 text-center animate-fade-in-up"
                style={{ animationDelay: `${0.4 + idx * 0.1}s` }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-gold-400" />
                <p className="font-display text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="py-16 bg-surface-dark/50">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center text-white mb-10">
            功能 <span className="text-gradient-gold">入口</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {featureCards.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.path}
                  to={feature.path}
                  className="glass-card p-6 group hover:border-gold-500/50 transition-all duration-300 animate-fade-in-up card-hover"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-3xl font-bold text-white">
              热门 <span className="text-gradient-gold">卡牌</span>
            </h2>
            <Link to="/atlas" className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-sm font-medium">
              查看全部
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
            {popularCards.map((card, idx) => (
              <div key={card.id} className="flex-shrink-0 animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <CardDisplay card={card} showQuantity />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-16 bg-surface-dark/50">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center text-white mb-10">
            实时 <span className="text-gradient-gold">换牌动态</span>
          </h2>
          
          <div className="max-w-2xl mx-auto space-y-3">
            {tradeActivities.map((activity, idx) => (
              <div 
                key={idx} 
                className="glass-card p-4 flex items-center gap-4 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-white text-sm">
                    {activity.user.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-white">{activity.user}</span>
                    {' '}{activity.action}{' '}
                    <span className="text-gold-400 font-medium">{activity.card}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto glass-card gold-border p-12 text-center rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-gold-500/20" />
            <div className="relative z-10">
              <Sparkles className="w-16 h-16 mx-auto mb-6 text-gold-400" />
              <h2 className="font-display text-4xl font-bold text-white mb-4">
                准备好开始您的收藏之旅了吗？
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                立即注册，免费管理您的卡牌收藏，与全球玩家进行安全便捷的卡牌交换。
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/collection" className="btn-gold">
                  立即开始
                </Link>
                <Link to="/atlas" className="btn-outline">
                  了解更多
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
