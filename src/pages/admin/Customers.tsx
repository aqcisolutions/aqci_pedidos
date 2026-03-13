import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  Calendar,
  Loader2,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { getSupabase } from '../../services/supabaseClient';
import { Customer } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function Customers() {
  const { profile, loading: authLoading } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (profile?.empresa_id) {
        fetchCustomers();
      } else {
        setLoading(false);
      }
    }
  }, [profile?.empresa_id, authLoading]);

  const fetchCustomers = async () => {
    try {
      if (!profile?.empresa_id) return;
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Missing Empresa ID Warning */}
      {!profile?.empresa_id && !loading && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">
            Atenção: Seu perfil não está vinculado a uma empresa. Você não poderá gerenciar clientes.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Clientes</h1>
        <p className="text-gray-500 text-sm">Base de dados de clientes que já compraram na sua loja.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-gray-500 font-medium">Carregando clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Nenhum cliente encontrado</h3>
              <p className="text-gray-500 text-sm">Os clientes são cadastrados automaticamente ao realizarem um pedido.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Nome</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Contato</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Localização</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Última Compra</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                          {customer.nome.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm">{customer.nome}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{customer.email || 'Sem email'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          {customer.telefone}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {customer.cidade || 'Não informada'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(customer.created_at)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleWhatsApp(customer.telefone)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
