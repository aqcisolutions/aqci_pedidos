/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  CheckCircle2, 
  MessageCircle, 
  ArrowRight, 
  CreditCard, 
  Wallet, 
  Banknote,
  Plus,
  Minus,
  ShoppingCart,
  User
} from 'lucide-react';
import { Product, CartItem as CartItemType, CustomerData, PaymentMethod, Screen, Category, StoreConfig } from '../types';
import { PIX_KEY } from '../constants';
import { Header } from '../components/Header';
import { getSupabase } from '../services/supabaseClient';
import { ProductCard } from '../components/ProductCard';
import { CartItem } from '../components/CartItem';
import { Button, InputField } from '../components/UI';

export default function Shop() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  // State
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [shopNotFound, setShopNotFound] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    phone: '',
    address: '',
    city: '',
    observation: '',
    cardMessage: '',
    deliveryDate: '',
    deliveryTime: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [toast, setToast] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<{ type: 'success' | 'info' | null, message: string | null }>({ type: null, message: null });
  const [showFullForm, setShowFullForm] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [tempFoundCustomer, setTempFoundCustomer] = useState<any | null>(null);

  // Helper to format phone number
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const searchCustomer = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return;

    try {
      setIsSearchingCustomer(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefone', cleanPhone)
        .eq('empresa_id', storeConfig?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTempFoundCustomer(data);
        setShowCustomerModal(true);
        setSearchFeedback({ type: 'success', message: 'Dados encontrados para este telefone' });
      } else {
        setShowFullForm(true);
        setSearchFeedback({ type: 'info', message: 'Nenhum cadastro encontrado, preencha seus dados' });
      }
    } catch (err) {
      console.error('Erro ao buscar cliente:', err);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleUseFoundData = (use: boolean) => {
    if (use && tempFoundCustomer) {
      setCustomerData(prev => ({
        ...prev,
        name: tempFoundCustomer.nome || prev.name,
        address: tempFoundCustomer.endereco || prev.address,
        city: tempFoundCustomer.cidade || prev.city,
      }));
    }
    setShowCustomerModal(false);
    setShowFullForm(true);
  };

  // Derived State
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.product.preco * item.quantity), 0), [cart]);

  // Effects
  useEffect(() => {
    if (storeConfig?.cor_primaria) {
      document.documentElement.style.setProperty('--color-primary', storeConfig.cor_primaria);
    }
    if (storeConfig?.cor_secundaria) {
      document.documentElement.style.setProperty('--color-secondary', storeConfig.cor_secundaria);
    }
  }, [storeConfig]);

  useEffect(() => {
    if (slug) {
      loadShopData();
    }
    
    // Real-time subscription
    const supabase = getSupabase();
    
    const productsChannel = supabase
      .channel('public:produtos')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'produtos' 
      }, () => {
        if (storeConfig?.id) fetchProductsAndCategories(storeConfig.id);
      })
      .subscribe();

    const categoriesChannel = supabase
      .channel('public:categorias')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'categorias' 
      }, () => {
        if (storeConfig?.id) fetchProductsAndCategories(storeConfig.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [slug, storeConfig?.id]);

  useEffect(() => {
    const cleanPhone = customerData.phone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const timer = setTimeout(() => {
        searchCustomer(customerData.phone);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setShowFullForm(false);
      setSearchFeedback({ type: null, message: null });
    }
  }, [customerData.phone, storeConfig?.id]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      setError(null);
      setShopNotFound(false);
      
      const supabase = getSupabase();
      
      // 1. Fetch Company by Slug
      const { data: company, error: companyError } = await supabase
        .from('empresas')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .maybeSingle();

      if (companyError) throw companyError;
      
      if (!company) {
        setShopNotFound(true);
        setLoading(false);
        return;
      }

      setStoreConfig(company);

      // 2. Fetch Categories and Products for this company
      await fetchProductsAndCategories(company.id);

    } catch (err) {
      console.error('Error loading shop data:', err);
      setError('Não foi possível carregar a loja.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsAndCategories = async (empresaId: string) => {
    try {
      const supabase = getSupabase();
      
      // Fetch Categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categorias')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch Products
      const { data: productsData, error: productsError } = await supabase
        .from('produtos')
        .select('id, nome, descricao, preco, imagem_url, ativo, categoria_id')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (err) {
      console.error('Error fetching products and categories:', err);
      throw err;
    }
  };
  useEffect(() => {
    if (toast && toast !== 'Produto adicionado ao carrinho com sucesso') {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [detailsQuantity, setDetailsQuantity] = useState(1);

  // Actions
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setToast('Produto adicionado ao carrinho com sucesso');
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: Math.max(1, item.quantity + delta) } 
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const navigateToDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailsQuantity(1);
    setCurrentScreen('DETAILS');
    window.scrollTo(0, 0);
  };

  const navigateBack = () => {
    if (currentScreen === 'DETAILS') setCurrentScreen('HOME');
    else if (currentScreen === 'CART') setCurrentScreen('HOME');
    else if (currentScreen === 'CHECKOUT') {
      setCurrentScreen('CART');
      setShowFullForm(false);
      setSearchFeedback({ type: null, message: null });
    }
    else if (currentScreen === 'PAYMENT') setCurrentScreen('CHECKOUT');
    window.scrollTo(0, 0);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData.name || !customerData.phone || !customerData.address || !customerData.city) {
      setToast('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    setCurrentScreen('PAYMENT');
    window.scrollTo(0, 0);
  };

  const handleFinalizeOrder = async () => {
    if (isFinalizing) return;
    
    let payloadCliente: any = null;
    let payloadPedido: any = null;
    let payloadItens: any = null;
    
    try {
      setIsFinalizing(true);
      const supabase = getSupabase();
      
      if (!storeConfig?.id) {
        throw new Error('Configuração da loja não carregada (empresa_id ausente).');
      }
      
      const empresa_id = storeConfig.id;
      const telefoneLimpo = customerData.phone.replace(/\D/g, '');
      
      // 1. Buscar ou Criar Cliente
      let cliente_id = null;
      
      const { data: existingCustomer, error: customerFetchError } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefone', telefoneLimpo)
        .eq('empresa_id', empresa_id)
        .maybeSingle();

      if (customerFetchError) {
        console.error("Erro ao buscar cliente:", customerFetchError);
        throw customerFetchError;
      }

      if (existingCustomer) {
        cliente_id = existingCustomer.id;
        // Opcional: Atualizar dados se necessário
        // Para evitar erros de RLS em updates, podemos apenas reutilizar o ID
      } else {
        payloadCliente = {
          nome: customerData.name,
          telefone: telefoneLimpo,
          empresa_id,
          endereco: customerData.address,
          cidade: customerData.city
        };

        console.log("Payload cliente:", payloadCliente);

        const { data: newCustomer, error: error } = await supabase
          .from('clientes')
          .insert(payloadCliente)
          .select()
          .single();

        if (error) {
          console.error("Erro ao criar cliente:", error);
          throw error;
        }
        cliente_id = newCustomer.id;
      }

      // 2. Inserir pedido
      payloadPedido = {
        empresa_id,
        cliente_id,
        cliente_nome: customerData.name,
        cliente_telefone: telefoneLimpo,
        endereco: customerData.address,
        cidade: customerData.city,
        forma_pagamento: paymentMethod,
        total: cartTotal,
        status: 'novo',
        observacao: customerData.observation || null,
        mensagem_cartao: customerData.cardMessage || null,
        data_entrega: customerData.deliveryDate || null,
        horario_entrega: customerData.deliveryTime || null
      };

      console.log("Payload Pedido:", payloadPedido);

      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert(payloadPedido)
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      const pedidoId = pedidoData.id;

      // 3. Inserir itens do pedido
      payloadItens = cart.map(item => ({
        pedido_id: pedidoId,
        produto_id: item.product.id,
        nome_produto: item.product.nome,
        preco_unitario: item.product.preco,
        quantidade: item.quantity,
        subtotal: item.product.preco * item.quantity
      }));

      console.log("Payload Itens:", payloadItens);

      const { error: itensError } = await supabase
        .from('pedido_itens')
        .insert(payloadItens);

      if (itensError) {
        console.error("Erro ao salvar pedido_itens:", itensError);
        throw itensError;
      }

      // 4. Abrir WhatsApp
      const orderSummary = cart.map(item => 
        `${item.quantity}x ${item.product.nome} - R$ ${(item.product.preco * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ).join('\n');

      const message = `Olá, gostaria de fazer um pedido:

*Pedido #${pedidoData.numero_pedido}*
${orderSummary}

*Total: R$ ${cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*

*Cliente:* ${customerData.name}
*Telefone:* ${customerData.phone}
*Endereço:* ${customerData.address}, ${customerData.city}
*Forma de Pagamento:* ${paymentMethod === 'PIX' ? 'PIX' : paymentMethod === 'CARD' ? 'Cartão na Entrega' : 'Dinheiro na Entrega'}
${customerData.observation ? `\n*Observação:* ${customerData.observation}` : ''}
${customerData.cardMessage ? `\n*Mensagem do Cartão:* ${customerData.cardMessage}` : ''}
${customerData.deliveryDate ? `\n*Data de Entrega:* ${customerData.deliveryDate}` : ''}
${customerData.deliveryTime ? `\n*Horário:* ${customerData.deliveryTime}` : ''}`;

      openWhatsApp(message);

      // 5. Sucesso
      setCurrentScreen('CONFIRMATION');
      setCart([]);
      setShowFullForm(false);
      setSearchFeedback({ type: null, message: null });
      setCustomerData({
        name: '',
        phone: '',
        address: '',
        city: '',
        observation: '',
        cardMessage: '',
        deliveryDate: '',
        deliveryTime: '',
      });
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.group('Erro ao finalizar pedido');
      console.error('Erro Supabase:', err);
      console.log('Payload Cliente:', payloadCliente);
      console.log('Payload Pedido:', payloadPedido);
      console.log('Payload Itens:', payloadItens);
      console.groupEnd();
      
      setToast('Não foi possível finalizar o pedido. Tente novamente.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const openWhatsApp = (customMessage?: string) => {
    const phone = storeConfig?.telefone.replace(/\D/g, '') || '5500000000000';
    const message = encodeURIComponent(customMessage || `Olá! Gostaria de confirmar meu pedido na ${storeConfig?.nome_fantasia || 'Mimo & Presentes'}.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  // Renderers
  const renderScreen = () => {
    switch (currentScreen) {
      case 'HOME':
        return (
          <div className="p-4 flex flex-col gap-8 pb-24">
            <div className="flex flex-col gap-6">
              {/* Category Filter */}
              {!loading && products.length > 0 && (
                <div className="flex overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide gap-3 md:gap-4 md:overflow-visible md:flex-wrap">
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className={`whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all border-2 ${
                      selectedCategoryId === null
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map(category => {
                    // Only show categories that have products
                    const hasProducts = products.some(p => p.categoria_id === category.id);
                    if (!hasProducts) return null;

                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={`whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all border-2 ${
                          selectedCategoryId === category.id
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        {category.nome}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-text-main/60 font-medium">Carregando mimos...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-text-main">{error}</h3>
                  <p className="text-sm text-gray-400 max-w-[250px]">Tente recarregar a página ou volte mais tarde.</p>
                </div>
                <Button variant="outline" onClick={loadShopData} className="px-10">
                  Tentar Novamente
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-gray-300">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-text-main">Nenhum produto disponível no momento.</h3>
                  <p className="text-sm text-gray-400 max-w-[250px]">Estamos preparando novidades incríveis para você.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                {categories
                  .filter(cat => selectedCategoryId === null || selectedCategoryId === cat.id)
                  .map(category => {
                    const categoryProducts = products.filter(p => p.categoria_id === category.id);
                    if (categoryProducts.length === 0) return null;

                    return (
                      <div key={category.id} className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                          <h3 className="text-2xl font-black text-text-main tracking-tight">{category.nome}</h3>
                          <div className="h-px bg-gray-200 flex-1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                          {categoryProducts.map(product => (
                            <ProductCard 
                              key={product.id} 
                              product={product} 
                              onViewDetails={navigateToDetails}
                              onAddToCart={(p) => addToCart(p)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}

                {/* Products without category */}
                {(selectedCategoryId === null) && products.filter(p => !p.categoria_id).length > 0 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-black text-text-main tracking-tight">Outros Mimos</h3>
                      <div className="h-px bg-gray-200 flex-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                      {products.filter(p => !p.categoria_id).map(product => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          onViewDetails={navigateToDetails}
                          onAddToCart={(p) => addToCart(p)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'DETAILS':
        if (!selectedProduct) return null;
        const placeholderImage = 'https://picsum.photos/seed/gift/800/800';
        return (
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center lg:max-w-5xl lg:mx-auto lg:p-12 lg:gap-12 pb-24">
            {/* 1. Imagem do produto */}
            <div className="w-full lg:w-1/2">
              <div className="relative aspect-square overflow-hidden lg:rounded-[3rem] lg:shadow-2xl lg:border lg:border-black/5">
                <img 
                  src={selectedProduct.imagem_url || placeholderImage} 
                  alt={selectedProduct.nome}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            
            {/* Info Section */}
            <div className="flex-1 p-6 lg:p-0 flex flex-col gap-8 bg-[#FFF0F5] lg:bg-transparent -mt-8 lg:mt-0 rounded-t-[2.5rem] lg:rounded-none shadow-2xl lg:shadow-none border-x border-t lg:border-none border-black/5 relative z-10">
              <div className="flex flex-col gap-6 lg:gap-8">
                {/* 2. Nome do produto */}
                <h2 className="text-2xl md:text-3xl lg:text-5xl font-black text-text-main leading-tight">
                  {selectedProduct.nome}
                </h2>

                {/* 3. Descrição */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-text-main uppercase tracking-widest text-[10px] opacity-50">Sobre este presente</h3>
                  <p className="text-text-main/70 leading-relaxed text-sm md:text-base lg:text-lg">
                    {selectedProduct.descricao}
                  </p>
                </div>

                {/* 4. Preço em destaque */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-text-main/40 uppercase tracking-tighter">Valor do Investimento</span>
                  <span className="text-3xl lg:text-4xl font-black text-primary">
                    R$ {selectedProduct.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                {/* 5. Quantidade e 6. Botão de ação */}
                <div className="flex flex-col gap-6 mt-2">
                  <div className="flex items-center justify-between bg-[#FFF0F5] lg:bg-white/50 border border-black/5 shadow-sm p-5 rounded-3xl lg:rounded-[2rem]">
                    <span className="font-bold text-text-main">Quantidade</span>
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => setDetailsQuantity(prev => Math.max(1, prev - 1))}
                        className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm active:scale-90 transition-all border border-black/5"
                      >
                        <Minus className="w-5 h-5 text-text-main" />
                      </button>
                      <span className="font-black text-2xl w-8 text-center text-text-main">{detailsQuantity}</span>
                      <button 
                        onClick={() => setDetailsQuantity(prev => prev + 1)}
                        className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm active:scale-90 transition-all border border-black/5"
                      >
                        <Plus className="w-5 h-5 text-text-main" />
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    fullWidth 
                    onClick={() => addToCart(selectedProduct, detailsQuantity)}
                    className="py-5 lg:py-6 text-lg lg:text-xl shadow-xl shadow-primary/20"
                  >
                    <ShoppingBag className="w-6 h-6 lg:w-7 lg:h-7" />
                    Adicionar ao Carrinho
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'CART':
        return (
          <div className="p-4 flex flex-col gap-6 pb-32">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black text-text-main">Seu Carrinho</h2>
              <p className="text-text-main/60">{cart.length} itens selecionados</p>
            </div>
            
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center text-gray-300">
                  <ShoppingCart className="w-12 h-12" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-text-main">Seu carrinho está vazio</h3>
                  <p className="text-sm text-gray-400 max-w-[200px]">Explore nossa loja e encontre o presente ideal.</p>
                </div>
                <Button variant="primary" onClick={() => setCurrentScreen('HOME')} className="px-10">
                  Explorar Loja
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {cart.map(item => (
                    <CartItem 
                      key={item.product.id} 
                      item={item} 
                      onUpdateQuantity={updateCartQuantity}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>
                
                <div className="bg-[#FFF0F5] p-8 rounded-[2rem] border border-black/5 shadow-sm flex flex-col gap-6">
                  <div className="flex justify-between items-center text-gray-400 font-medium">
                    <span>Subtotal</span>
                    <span>R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="h-px bg-gray-100 w-full" />
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-text-main text-lg">Total</span>
                    <span className="text-3xl font-black text-primary">
                      R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <Button fullWidth onClick={() => setCurrentScreen('CHECKOUT')} className="py-5 shadow-xl shadow-primary/20">
                    Finalizar Pedido
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                  <Button variant="ghost" fullWidth onClick={() => setCurrentScreen('HOME')}>
                    Continuar Comprando
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      case 'CHECKOUT':
        return (
          <div className="p-4 flex flex-col gap-6 pb-24">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black text-text-main">Dados de Entrega</h2>
              <p className="text-text-main/60">Preencha as informações para o envio.</p>
            </div>
            
            <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-5">
              <div className="bg-[#FFF0F5] p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <InputField 
                    label="Telefone / WhatsApp *" 
                    placeholder="(99) 99999-9999"
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    value={customerData.phone}
                    onChange={e => {
                      const formatted = formatPhone(e.target.value);
                      setCustomerData({...customerData, phone: formatted});
                    }}
                    required
                  />
                  {searchFeedback.message && (
                    <div className={`text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-2 ${
                      searchFeedback.type === 'success' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'
                    }`}>
                      {isSearchingCustomer ? (
                        <div className="w-3 h-3 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {searchFeedback.message}
                    </div>
                  )}
                </div>

                {showFullForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-col gap-5"
                  >
                    <InputField 
                      label="Nome Completo *" 
                      placeholder="Ex: Maria Silva"
                      value={customerData.name}
                      onChange={e => setCustomerData({...customerData, name: e.target.value})}
                      required
                    />
                    
                    <InputField 
                      label="Endereço de Entrega *" 
                      placeholder="Rua, número, bairro"
                      value={customerData.address}
                      onChange={e => setCustomerData({...customerData, address: e.target.value})}
                      required
                    />
                    <InputField 
                      label="Cidade *" 
                      placeholder="Ex: São Paulo"
                      value={customerData.city}
                      onChange={e => setCustomerData({...customerData, city: e.target.value})}
                      required
                    />
                  </motion.div>
                )}
              </div>
              
              {showFullForm && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-5"
                >
                  <div className="bg-[#FFF0F5] p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col gap-5">
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Opcionais</h3>
                    <InputField 
                      label="Mensagem para o Cartão" 
                      placeholder="Escreva uma mensagem carinhosa..."
                      isTextArea
                      value={customerData.cardMessage}
                      onChange={e => setCustomerData({...customerData, cardMessage: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField 
                        label="Data de Entrega" 
                        type="date"
                        value={customerData.deliveryDate}
                        onChange={e => setCustomerData({...customerData, deliveryDate: e.target.value})}
                      />
                      <InputField 
                        label="Horário" 
                        type="time"
                        value={customerData.deliveryTime}
                        onChange={e => setCustomerData({...customerData, deliveryTime: e.target.value})}
                      />
                    </div>
                    <InputField 
                      label="Observações" 
                      placeholder="Algum detalhe sobre a entrega?"
                      value={customerData.observation}
                      onChange={e => setCustomerData({...customerData, observation: e.target.value})}
                    />
                  </div>
                  
                  <Button type="submit" fullWidth>
                    Continuar para Pagamento
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </form>

            {/* Customer Confirmation Modal */}
            <AnimatePresence>
              {showCustomerModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl flex flex-col gap-6"
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center flex flex-col gap-2">
                      <h3 className="text-2xl font-black text-gray-900">Cadastro Encontrado!</h3>
                      <p className="text-gray-500 font-medium">
                        Encontramos seus dados cadastrados. Deseja usar ou atualizar essas informações?
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Nome</span>
                        <span className="font-bold text-gray-900">{tempFoundCustomer?.nome}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Endereço</span>
                        <span className="font-bold text-gray-900 text-right">{tempFoundCustomer?.endereco}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button onClick={() => handleUseFoundData(true)} fullWidth>
                        Sim, usar meus dados
                      </Button>
                      <Button onClick={() => handleUseFoundData(false)} variant="ghost" fullWidth>
                        Não, preencher novo
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'PAYMENT':
        return (
          <div className="p-4 flex flex-col gap-6 pb-24">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black text-text-main">Pagamento</h2>
              <p className="text-text-main/60">Escolha como deseja pagar seu pedido.</p>
            </div>
            
            <div className="bg-[#FFF0F5] p-8 rounded-[2rem] border border-black/5 shadow-sm flex flex-col gap-6">
              <h3 className="font-extrabold text-text-main text-lg">Resumo do Pedido</h3>
              <div className="flex flex-col gap-3">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-500 font-medium">{item.quantity}x {item.product.nome}</span>
                    <span className="font-bold text-text-main">R$ {(item.product.preco * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
              <div className="h-px bg-gray-100 w-full" />
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-text-main">Total a pagar</span>
                <span className="text-3xl font-black text-primary">
                  R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setPaymentMethod('PIX')}
                className={`flex items-center gap-5 p-5 rounded-3xl border-2 transition-all ${paymentMethod === 'PIX' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${paymentMethod === 'PIX' ? 'bg-primary text-white' : 'bg-secondary text-gray-400'}`}>
                  <Wallet className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-extrabold text-text-main">PIX</span>
                  <span className="text-xs text-gray-400 font-medium">Pagamento instantâneo</span>
                </div>
              </button>
              
              <button 
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-center gap-5 p-5 rounded-3xl border-2 transition-all ${paymentMethod === 'CARD' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${paymentMethod === 'CARD' ? 'bg-primary text-white' : 'bg-secondary text-gray-400'}`}>
                  <CreditCard className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-extrabold text-text-main">Cartão na Entrega</span>
                  <span className="text-xs text-gray-400 font-medium">Crédito ou Débito</span>
                </div>
              </button>
              
              <button 
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center gap-5 p-5 rounded-3xl border-2 transition-all ${paymentMethod === 'CASH' ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${paymentMethod === 'CASH' ? 'bg-primary text-white' : 'bg-secondary text-gray-400'}`}>
                  <Banknote className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-extrabold text-text-main">Dinheiro na Entrega</span>
                  <span className="text-xs text-gray-400 font-medium">Pague ao receber</span>
                </div>
              </button>
            </div>
            
            {paymentMethod === 'PIX' && (
              <div className="bg-accent/10 p-8 rounded-[2rem] border border-accent/20 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-accent font-black uppercase text-xs tracking-widest">
                  <CheckCircle2 className="w-5 h-5" />
                  Pagamento via PIX
                </div>
                <p className="text-sm text-text-main/70 font-medium leading-relaxed">
                  Após finalizar, você receberá as instruções para o pagamento via PIX.
                </p>
                <div className="bg-[#FFF0F5] p-4 rounded-2xl border border-accent/20 flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] uppercase font-black text-gray-300 tracking-tighter">Chave PIX (E-mail)</span>
                  <span className="font-mono text-sm font-bold text-text-main break-all">{storeConfig?.chave_pix}</span>
                </div>
              </div>
            )}
            
            <Button 
              fullWidth 
              onClick={handleFinalizeOrder} 
              className="py-5 shadow-xl shadow-primary/20"
              disabled={isFinalizing}
            >
              {isFinalizing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  Enviar Pedido
                  <CheckCircle2 className="w-6 h-6" />
                </>
              )}
            </Button>
          </div>
        );

      case 'CONFIRMATION':
        return (
          <div className="p-6 flex flex-col items-center justify-center min-h-[80vh] gap-8 text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12" />
            </motion.div>
            
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-black text-gray-900">Pedido Enviado!</h2>
              <p className="text-gray-500 leading-relaxed">
                Seu pedido foi recebido com sucesso. Entraremos em contato pelo WhatsApp para confirmar os detalhes e o pagamento.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 w-full">
              <Button fullWidth className="bg-green-500 hover:bg-green-600" onClick={openWhatsApp}>
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </Button>
              <Button variant="outline" fullWidth onClick={() => setCurrentScreen('HOME')}>
                Voltar para a Loja
              </Button>
            </div>
          </div>
        );
    }
  };

  const getHeaderTitle = () => {
    const storeName = storeConfig?.nome_fantasia || 'Mimo & Presentes';
    switch (currentScreen) {
      case 'HOME': return storeName;
      case 'DETAILS': return 'Detalhes';
      case 'CART': return 'Carrinho';
      case 'CHECKOUT': return 'Entrega';
      case 'PAYMENT': return 'Pagamento';
      case 'CONFIRMATION': return 'Sucesso';
      default: return storeName;
    }
  };

  if (shopNotFound) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4 text-center">
        <div className="flex flex-col gap-6 max-w-md">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ShoppingBag className="w-12 h-12 text-gray-300" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-text-main">Loja não encontrada</h2>
            <p className="text-text-main/60">O endereço que você tentou acessar não pertence a nenhuma loja ativa.</p>
          </div>
          <Button onClick={() => navigate('/login')} variant="primary">
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  if (loading && !storeConfig) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-text-main/60 font-medium">Carregando loja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary font-sans text-text-main selection:bg-primary/10 selection:text-primary">
      <Header 
        title={getHeaderTitle()} 
        showBack={currentScreen !== 'HOME' && currentScreen !== 'CONFIRMATION'}
        onBack={navigateBack}
        cartCount={cartCount}
        onCartClick={currentScreen === 'HOME' || currentScreen === 'DETAILS' ? () => setCurrentScreen('CART') : undefined}
      />
      
      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Cart Button for Home Screen */}
      {currentScreen === 'HOME' && cartCount > 0 && (
        <motion.button
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          onClick={() => setCurrentScreen('CART')}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-white p-4 md:px-8 md:py-5 rounded-full md:rounded-3xl shadow-2xl shadow-primary/40 flex items-center gap-4 z-50 active:scale-95 transition-all"
        >
          <div className="relative">
            <ShoppingCart className="w-7 h-7" />
            <span className="absolute -top-3 -right-3 bg-white text-primary text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-primary">
              {cartCount}
            </span>
          </div>
          <span className="hidden md:block font-extrabold text-base uppercase tracking-wider">Ver Carrinho</span>
        </motion.button>
      )}

      {/* Toast Notification / Success Modal */}
      <AnimatePresence>
        {toast && (
          <>
            {toast === 'Produto adicionado ao carrinho com sucesso' ? (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setToast(null)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />
                
                {/* Modal Content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col items-center text-center gap-8"
                >
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <h3 className="text-2xl font-black text-text-main">Presente Adicionado!</h3>
                    <p className="text-text-main/60 font-medium leading-relaxed">
                      Seu mimo foi adicionado ao carrinho com sucesso. O que deseja fazer agora?
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <Button 
                      variant="outline" 
                      fullWidth 
                      onClick={() => {
                        setToast(null);
                        setCurrentScreen('HOME');
                      }}
                      className="order-2 sm:order-1 py-4"
                    >
                      Continuar comprando
                    </Button>
                    <Button 
                      variant="primary" 
                      fullWidth 
                      onClick={() => {
                        setToast(null);
                        setCurrentScreen('CART');
                      }}
                      className="order-1 sm:order-2 py-4"
                    >
                      Ir para o carrinho
                    </Button>
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Simple Toast for other messages */
              <motion.div
                initial={{ opacity: 0, y: 50, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 50, x: '-50%' }}
                className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-bold shadow-2xl z-[60] whitespace-nowrap"
              >
                {toast}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
