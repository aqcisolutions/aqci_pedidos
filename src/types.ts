export interface Category {
  id: string;
  empresa_id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  empresa_id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem_url: string | null;
  ativo: boolean;
  categoria_id?: string | null;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerData {
  name: string;
  phone: string;
  address: string;
  city: string;
  observation?: string;
  cardMessage?: string;
  deliveryDate?: string;
  deliveryTime?: string;
}

export type PaymentMethod = 'PIX' | 'CASH' | 'CARD';

export type OrderStatus = 'novo' | 'em_preparo' | 'saiu_para_entrega' | 'finalizado' | 'cancelado';

export interface Customer {
  id: string;
  nome: string;
  telefone: string;
  created_at: string;
}

export interface Order {
  id: string;
  numero_pedido: number;
  empresa_id: string;
  cliente_id?: string;
  cliente_nome: string;
  cliente_telefone: string;
  endereco: string;
  cidade: string;
  forma_pagamento: PaymentMethod;
  total: number;
  status: OrderStatus;
  created_at: string;
  observacao?: string;
  mensagem_cartao?: string;
  data_entrega?: string;
  horario_entrega?: string;
  cliente_notificado?: boolean;
}

export interface OrderItem {
  id: string;
  pedido_id: string;
  produto_id: string;
  nome_produto: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
}

export interface StoreConfig {
  id?: string;
  nome_fantasia: string;
  tipo_pessoa: 'PF' | 'PJ';
  documento: string;
  razao_social?: string;
  telefone: string;
  endereco: string;
  cidade: string;
  chave_pix: string;
  logo_url?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  slug: string;
  subdominio?: string;
  plano?: string;
  ativo: boolean;
  created_at?: string;
}

export type Screen = 'HOME' | 'DETAILS' | 'CART' | 'CHECKOUT' | 'PAYMENT' | 'CONFIRMATION';
