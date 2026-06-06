import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Book, Heart, Sparkles, 
  MessageSquare, Layers, User, 
  Menu, X, Bell 
} from 'lucide-react';
import { useTradeStore } from '../../store/useTradeStore';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/atlas', label: '卡牌图鉴', icon: Book },
  { path: '/collection', label: '我的收藏', icon: Heart },
  { path: '/wishlist', label: '愿望清单', icon: Sparkles },
  { path: '/match', label: '换牌匹配', icon: Layers },
  { path: '/chat', label: '交易沟通', icon: MessageSquare },
  { path: '/deck', label: '套牌检测', icon: Layers },
  { path: '/profile', label: '个人中心', icon: User },
];

export default function Header() {
  const location = useLocation();
  const unreadCount = useTradeStore((state) => state.getUnreadCount());

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-dark/90 backdrop-blur-md border-b border-gold-500/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-surface-dark" />
            </div>
            <span className="font-display text-xl font-bold text-gradient-gold">CardHub</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600/20 text-gold-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.path === '/chat' && unreadCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden overflow-x-auto scrollbar-thin border-t border-white/5">
        <nav className="flex items-center gap-1 px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-600/20 text-gold-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
