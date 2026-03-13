import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getSupabase } from '../../services/supabaseClient';
import { Order } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (profile?.empresa_id) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
  }, [profile?.empresa_id, authLoading]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('empresa_id', profile?.empresa_id);
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ordersToday = orders.filter(o => new Date(o.created_at) >= today);
  const revenueToday = ordersToday
    .filter(o => o.status !== 'cancelado')
    .reduce((acc, o) => acc + o.total, 0);
  
  const inPreparation = orders.filter(o => o.status === 'em_preparo').length;
  const finalized = orders.filter(o => o.status === 'finalizado').length;

  const stats = [
    { 
      label: 'Pedidos Hoje', 
      value: ordersToday.length.toString(), 
      icon: Package, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      filter: 'todos' 
    },
    { 
      label: 'Faturamento Hoje', 
      value: `R$ ${revenueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: DollarSign, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      filter: 'todos'
    },
    { 
      label: 'Pedidos em Preparo', 
      value: inPreparation.toString(), 
      icon: Clock, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      filter: 'em_preparo'
    },
    { 
      label: 'Pedidos Finalizados', 
      value: finalized.toString(), 
      icon: CheckCircle, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      filter: 'finalizado'
    },
  ];

  const handleCardClick = (filter: string) => {
    navigate('/admin/orders', { state: { statusFilter: filter } });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Missing Empresa ID Warning */}
      {!profile?.empresa_id && !loading && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">
            Atenção: Seu perfil não está vinculado a uma empresa. Os dados do dashboard podem estar incompletos.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 text-sm">Visão geral do desempenho da sua loja.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => handleCardClick(stat.filter)}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left transition-all hover:border-primary/30 hover:shadow-md group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
              <span className="text-2xl font-black text-gray-900">
                {loading ? '...' : stat.value}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
        <p className="text-gray-400 font-medium">Gráficos e estatísticas detalhadas estarão disponíveis em breve.</p>
      </div>
    </div>
  );
}
