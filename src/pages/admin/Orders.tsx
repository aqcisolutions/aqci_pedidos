import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  CreditCard, 
  Search,
  RefreshCw,
  Filter,
  CheckCircle,
  ChevronLeft,
  MessageCircle,
  AlertCircle,
  Check
} from 'lucide-react';
import { getSupabase } from '../../services/supabaseClient';
import { Order, OrderItem, OrderStatus, Customer } from '../../types';
import { Button } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_CONFIG: Record<OrderStatus, { label: string, color: string, bg: string }> = {
  novo: { label: 'Novo', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  em_preparo: { label: 'Em Preparo', color: 'text-blue-700', bg: 'bg-blue-100' },
  saiu_para_entrega: { label: 'Saiu para Entrega', color: 'text-purple-700', bg: 'bg-purple-100' },
  finalizado: { label: 'Finalizado', color: 'text-green-700', bg: 'bg-green-100' },
  cancelado: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function Orders() {
  const { profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState<OrderStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'todos' | 'ativos'>('ativos');
  const [showToast, setShowToast] = useState(false);
  const location = useLocation();

  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      novo: 0,
      em_preparo: 0,
      saiu_para_entrega: 0,
      finalizado: 0,
      cancelado: 0
    };
    orders.forEach(order => {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'todos') return orders;
    if (statusFilter === 'ativos') {
      return orders.filter(o => ['novo', 'em_preparo', 'saiu_para_entrega'].includes(o.status));
    }
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  useEffect(() => {
    if (!authLoading) {
      if (profile?.empresa_id) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
  }, [profile?.empresa_id, authLoading]);

  useEffect(() => {
    if (location.state?.statusFilter) {
      setStatusFilter(location.state.statusFilter);
    }
  }, [location.state]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('empresa_id', profile?.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Não foi possível carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      setLoadingItems(true);
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('pedido_itens')
        .select('*')
        .eq('pedido_id', orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (err) {
      console.error('Error fetching order items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchCustomer = async (customerId: string) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', customerId)
        .eq('empresa_id', profile?.empresa_id)
        .maybeSingle();

      if (error) throw error;
      setSelectedCustomer(data);
    } catch (err) {
      console.error('Error fetching customer:', err);
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setSelectedCustomer(null);
    setTempStatus(order.status);
    setSuccessMessage(null);
    fetchOrderItems(order.id);
    if (order.cliente_id) {
      fetchCustomer(order.cliente_id);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !tempStatus) return;

    try {
      setStatusUpdating(true);
      setSuccessMessage(null);
      const supabase = getSupabase();

      const updateData: any = { status: tempStatus };
      
      // If status is changing to finalized, reset notification status
      if (tempStatus === 'finalizado' && selectedOrder.status !== 'finalizado') {
        updateData.cliente_notificado = false;
      }

      const { error } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', selectedOrder.id)
        .eq('empresa_id', profile?.empresa_id);

      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updateData } : o));
      setSelectedOrder(prev => prev ? { ...prev, ...updateData } : null);
      
      setSuccessMessage('Status atualizado com sucesso!');
      setShowToast(true);
      
      // Close details panel after a short delay to show success message
      // ONLY if the status is NOT "finalizado"
      if (tempStatus !== 'finalizado') {
        setTimeout(() => {
          setSelectedOrder(null);
          setSuccessMessage(null);
        }, 1500);
      }

      // Hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Não foi possível atualizar o status do pedido.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const notifyCustomer = async () => {
    if (!selectedOrder) return;
    
    try {
      const supabase = getSupabase();
      
      // Update notification status in DB
      const { error } = await supabase
        .from('pedidos')
        .update({ cliente_notificado: true })
        .eq('id', selectedOrder.id)
        .eq('empresa_id', profile?.empresa_id);
        
      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, cliente_notificado: true } : o));

      const phone = selectedOrder.cliente_telefone.replace(/\D/g, '');
      const orderNumber = selectedOrder.numero_pedido;
      const message = encodeURIComponent(`Olá ${selectedOrder.cliente_nome}!\n\nSeu pedido #${orderNumber} já está pronto.\n\nObrigado por comprar conosco!`);
      
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');

      // Close modal and clear messages
      setSelectedOrder(null);
      setSelectedCustomer(null);
      setSuccessMessage(null);
      
      // Refresh list to ensure sync
      fetchOrders();
    } catch (err) {
      console.error('Error updating notification status:', err);
      alert('Erro ao atualizar status de notificação.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative">
      {/* Missing Empresa ID Warning */}
      {!profile?.empresa_id && !loading && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 mb-8">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">
            Atenção: Seu perfil não está vinculado a uma empresa. Você não poderá gerenciar pedidos.
          </p>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-6 right-6 z-[100] bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-green-400/20"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm">Status atualizado com sucesso</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pedidos</h1>
          <p className="text-gray-500 text-sm">Gerenciamento de pedidos e vendas em tempo real.</p>
        </div>
        <Button variant="outline" onClick={fetchOrders} className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Status Summary Counters */}
      {!loading && !error && orders.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          <button 
            onClick={() => setStatusFilter('todos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-sm transition-all ${
              statusFilter === 'todos' 
                ? 'bg-gray-900 border-gray-900 text-white' 
                : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
            }`}
          >
            <span className="text-xs font-black uppercase tracking-wider">
              Todos
            </span>
            <span className={`flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-lg text-xs font-black ${
              statusFilter === 'todos' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {orders.length}
            </span>
          </button>

          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <button 
              key={status}
              onClick={() => setStatusFilter(status as OrderStatus)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-sm transition-all ${
                statusFilter === status 
                  ? `${config.bg.replace('100', '200')} border-current ring-2 ring-offset-2 ring-gray-100` 
                  : `${config.bg} border-white/50 hover:border-gray-200`
              }`}
            >
              <span className={`text-xs font-black uppercase tracking-wider ${config.color}`}>
                {config.label}
              </span>
              <span className={`flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-lg bg-white/50 text-xs font-black ${config.color}`}>
                {orderCounts[status] || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Carregando pedidos...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <Button onClick={fetchOrders}>Tentar Novamente</Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-gray-100 p-12 rounded-3xl text-center shadow-sm">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Nenhum pedido encontrado</h3>
          <p className="text-gray-500">Os pedidos aparecerão aqui assim que forem realizados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Pedidos Recentes
              </h2>
              
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                >
                  {statusFilter === 'ativos' && <option value="ativos" hidden>Pedidos Ativos</option>}
                  <option value="todos">Todos</option>
                  <option value="novo">Novo</option>
                  <option value="em_preparo">Em Preparo</option>
                  <option value="saiu_para_entrega">Saiu para Entrega</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {filteredOrders.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 p-12 rounded-2xl text-center">
                  <p className="text-gray-400 font-medium text-sm">Nenhum pedido encontrado com este status.</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <motion.div
                    key={order.id}
                    layoutId={order.id}
                    onClick={() => handleOrderClick(order)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      selectedOrder?.id === order.id 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-white bg-white hover:border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pedido #{order.numero_pedido}</span>
                        <h3 className="font-bold text-gray-900 text-lg">{order.cliente_nome}</h3>
                      </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      STATUS_CONFIG[order.status]?.bg || 'bg-gray-100'
                    } ${STATUS_CONFIG[order.status]?.color || 'text-gray-600'}`}>
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {order.cliente_telefone}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(order.created_at)}
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="font-black text-primary text-lg">
                        R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <AnimatePresence mode="wait">
                {selectedOrder ? (
                  <motion.div
                    key={selectedOrder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
                  >
                    <div className="p-6 bg-gray-900 text-white">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black">Pedido #{selectedOrder.numero_pedido}</h3>
                        <button onClick={() => setSelectedOrder(null)} className="text-white/60 hover:text-white">
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status Atual</span>
                        <span className="font-bold text-sm opacity-80">{STATUS_CONFIG[selectedOrder.status]?.label}</span>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col gap-8">
                      {/* Customer Info */}
                      <div className="flex flex-col gap-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Informações do Cliente</h4>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-primary shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Nome</span>
                              <span className="font-bold text-gray-900">{selectedCustomer?.nome || selectedOrder.cliente_nome}</span>
                              {selectedCustomer && (
                                <span className="text-[10px] text-green-600 font-bold uppercase">Cliente Cadastrado</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-primary shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Telefone</span>
                              <span className="font-bold text-gray-900">{selectedCustomer?.telefone || selectedOrder.cliente_telefone}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Endereço</span>
                              <span className="font-bold text-gray-900 leading-tight">{selectedOrder.endereco}, {selectedOrder.cidade}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="flex flex-col gap-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Itens do Pedido</h4>
                        {loadingItems ? (
                          <div className="py-4 flex justify-center">
                            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {orderItems.map(item => (
                              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900 text-sm">{item.nome_produto}</span>
                                  <span className="text-[10px] text-gray-400">{item.quantidade}x R$ {item.preco_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <span className="font-black text-gray-900">
                                  R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-dashed border-gray-200">
                              <span className="font-black text-gray-900 uppercase text-xs">Total</span>
                              <span className="text-2xl font-black text-primary">
                                R$ {selectedOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Additional Info */}
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Status do Pedido</h4>
                          {selectedOrder.status === 'finalizado' && (
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              selectedOrder.cliente_notificado 
                                ? 'bg-green-50 text-green-600' 
                                : 'bg-amber-50 text-amber-600'
                            }`}>
                              {selectedOrder.cliente_notificado ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  ✅ Cliente avisado
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3" />
                                  ⚠️ Não avisado
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-2">
                            <select 
                              value={tempStatus || ''} 
                              onChange={(e) => setTempStatus(e.target.value as OrderStatus)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                            >
                              {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                            <Button 
                              onClick={updateOrderStatus} 
                              disabled={statusUpdating || tempStatus === selectedOrder.status}
                              className="w-full"
                            >
                              {statusUpdating ? 'Salvando...' : 'Salvar Status'}
                            </Button>
                            
                            {selectedOrder.status === 'finalizado' && !selectedOrder.cliente_notificado && (
                              <Button 
                                onClick={notifyCustomer}
                                className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Avisar Cliente via WhatsApp
                              </Button>
                            )}

                            {successMessage && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[10px] font-black text-green-600 uppercase tracking-widest text-center"
                              >
                                {successMessage}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delivery and Payment Info */}
                      <div className="flex flex-col gap-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Entrega e Pagamento</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[8px] text-gray-400 font-bold uppercase">Pagamento</span>
                              <span className="text-xs font-bold text-gray-900">{selectedOrder.forma_pagamento}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[8px] text-gray-400 font-bold uppercase">Horário</span>
                              <span className="text-xs font-bold text-gray-900">{selectedOrder.horario_entrega || 'Não informado'}</span>
                            </div>
                          </div>
                        </div>
                        {selectedOrder.observacao && (
                          <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                            <span className="text-[8px] text-yellow-600 font-black uppercase tracking-widest block mb-1">Observação</span>
                            <p className="text-xs text-yellow-800 font-medium">{selectedOrder.observacao}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                      <Search className="w-8 h-8" />
                    </div>
                    <p className="text-gray-400 font-medium text-sm">Selecione um pedido para ver os detalhes completos.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
