import React from 'react';
import { ShoppingCart, ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  cartCount?: number;
  onCartClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack = false, 
  onBack, 
  cartCount = 0, 
  onCartClick
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFF0F5]/90 backdrop-blur-lg border-b border-black/5 px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-primary/5 active:scale-90 transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-text-main" />
          </button>
        )}
        <h1 className="text-lg md:text-xl font-extrabold text-text-main tracking-tight uppercase">{title}</h1>
      </div>
      
      <div className="flex items-center gap-1">
        {onCartClick && (
          <button 
            onClick={onCartClick}
            className="relative p-2 rounded-full hover:bg-primary/5 active:scale-90 transition-all"
          >
            <ShoppingCart className="w-6 h-6 text-text-main" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
