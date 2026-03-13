import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings, 
  ChevronLeft,
  LogOut,
  Menu,
  X,
  Tag,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'orders', label: 'Pedidos', icon: Package, path: '/admin/orders' },
  { id: 'products', label: 'Produtos', icon: ShoppingBag, path: '/admin/products' },
  { id: 'categories', label: 'Categorias', icon: Tag, path: '/admin/categories' },
  { id: 'customers', label: 'Clientes', icon: Users, path: '/admin/customers' },
  { id: 'settings', label: 'Configurações', icon: Settings, path: '/admin/settings' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const activeItem = MENU_ITEMS.find(item => item.path === location.pathname) || MENU_ITEMS[0];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Package className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase">FLORA ADMIN</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-bold text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 flex flex-col gap-2">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full px-4 py-3"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Ver Loja</span>
          </button>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors w-full px-4 py-3"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Package className="text-white w-5 h-5" />
          </div>
          <span className="font-black tracking-tighter">FLORA</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="md:hidden fixed inset-0 bg-gray-900 z-40 p-8 pt-24"
          >
            <nav className="flex flex-col gap-4">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                      isActive 
                        ? 'bg-primary text-white' 
                        : 'text-gray-400'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="font-black text-lg">{item.label}</span>
                  </button>
                );
              })}
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-4 px-6 py-4 text-gray-400 mt-8"
              >
                <ChevronLeft className="w-6 h-6" />
                <span className="font-black text-lg">Ver Loja</span>
              </button>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-4 px-6 py-4 text-red-400"
              >
                <LogOut className="w-6 h-6" />
                <span className="font-black text-lg">Sair</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-12 pt-24 md:pt-12 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
