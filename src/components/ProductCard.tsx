import React from 'react';
import { Product } from '../types';
import { Button } from './UI';
import { Plus, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onViewDetails, 
  onAddToCart 
}) => {
  const placeholderImage = 'https://picsum.photos/seed/gift/400/400';

  return (
    <div className="bg-[#FFF0F5] rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-primary/10 border border-black/5 overflow-hidden flex flex-col transition-all duration-500 group h-full">
      <div 
        className="relative aspect-square overflow-hidden cursor-pointer"
        onClick={() => onViewDetails(product)}
      >
        <img 
          src={product.imagem_url || placeholderImage} 
          alt={product.nome}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="p-5 md:p-7 flex flex-col flex-grow">
        <div className="flex flex-col gap-1 mb-4">
          <h3 className="text-lg md:text-xl font-black text-text-main leading-tight group-hover:text-primary transition-colors">
            {product.nome}
          </h3>
          <p className="text-xs md:text-sm text-gray-400 line-clamp-2 leading-relaxed">
            {product.descricao}
          </p>
        </div>
        
        <div className="flex flex-col mt-auto gap-3">
          <span className="text-xl md:text-2xl font-black text-primary">
            R$ {product.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => onAddToCart(product)}
              className="w-full py-3.5 md:py-4 rounded-2xl text-sm md:text-base shadow-lg shadow-primary/10"
            >
              <Plus className="w-5 h-5" />
              Adicionar ao Carrinho
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full py-2 text-xs md:text-sm text-gray-400 hover:text-primary"
              onClick={() => onViewDetails(product)}
            >
              <Eye className="w-4 h-4" />
              Ver Detalhes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
