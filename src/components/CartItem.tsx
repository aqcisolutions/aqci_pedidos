import React from 'react';
import { CartItem as CartItemType } from '../types';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}) => {
  const subtotal = item.product.preco * item.quantity;
  const placeholderImage = 'https://picsum.photos/seed/gift/400/400';

  return (
    <div className="flex gap-4 p-4 bg-[#FFF0F5] rounded-3xl border border-black/5 shadow-sm">
      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
        <img 
          src={item.product.imagem_url || placeholderImage} 
          alt={item.product.nome}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="flex flex-col flex-grow justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-text-main leading-tight text-sm md:text-base">{item.product.nome}</h4>
            <p className="text-xs text-gray-400 mt-1">
              R$ {item.product.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} un.
            </p>
          </div>
          <button 
            onClick={() => onRemove(item.product.id)}
            className="p-2 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center bg-secondary rounded-xl p-1">
            <button 
              onClick={() => onUpdateQuantity(item.product.id, -1)}
              className="p-1.5 text-text-main hover:bg-white rounded-lg transition-all active:scale-90 shadow-sm disabled:opacity-30"
              disabled={item.quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-text-main">{item.quantity}</span>
            <button 
              onClick={() => onUpdateQuantity(item.product.id, 1)}
              className="p-1.5 text-text-main hover:bg-white rounded-lg transition-all active:scale-90 shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <span className="font-black text-primary">
            R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};
