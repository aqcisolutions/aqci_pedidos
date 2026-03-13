import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, 
  Phone, 
  MapPin, 
  CreditCard, 
  User, 
  Map,
  Save,
  CheckCircle,
  Loader2,
  Building,
  FileText,
  X,
  XCircle
} from 'lucide-react';
import { getSupabase } from '../../services/supabaseClient';
import { Button } from '../../components/UI';
import { StoreConfig } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [config, setConfig] = useState<StoreConfig>({
    nome_fantasia: '',
    tipo_pessoa: 'PF',
    documento: '',
    razao_social: '',
    telefone: '',
    endereco: '',
    cidade: '',
    chave_pix: '',
    logo_url: '',
    cor_primaria: '#FF6321',
    cor_secundaria: '#F5F5F0',
    slug: '',
    subdominio: '',
    plano: 'free',
    ativo: true
  });

  useEffect(() => {
    if (profile?.empresa_id) {
      fetchConfig();
    }
  }, [profile?.empresa_id]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', profile?.empresa_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data) {
        setConfig(data);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const supabase = getSupabase();
      
      if (!config.id) {
        throw new Error('ID da empresa não encontrado. Certifique-se de que a empresa foi criada corretamente.');
      }

      // Salvar apenas os campos permitidos para o admin da loja
      const allowedData = {
        nome_fantasia: config.nome_fantasia,
        tipo_pessoa: config.tipo_pessoa,
        documento: config.documento,
        razao_social: config.razao_social,
        telefone: config.telefone,
        endereco: config.endereco,
        cidade: config.cidade,
        chave_pix: config.chave_pix
      };

      const { error } = await supabase
        .from('empresas')
        .update(allowedData)
        .eq('id', config.id);

      if (error) throw error;

      setToast({ type: 'success', message: 'Configurações salvas com sucesso' });
      setTimeout(() => setToast(null), 3000);
      
      // Refresh data
      fetchConfig();
    } catch (error) {
      console.error("Erro ao salvar configurações da loja:", error);
      setToast({ type: 'error', message: 'Não foi possível salvar as configurações' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-gray-500 font-medium">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-green-500 text-white border-green-400/20' 
                : 'bg-red-500 text-white border-red-400/20'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configurações da Loja</h1>
          <p className="text-gray-500 text-sm">Gerencie as informações públicas e de pagamento da sua loja.</p>
        </div>
        <button 
          onClick={() => navigate('/admin')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Fechar"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
        {/* Basic Info Card */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Informações da Loja</h2>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Fantasia</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={config.nome_fantasia}
                  onChange={e => setConfig({...config, nome_fantasia: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Ex: Flora Floricultura"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Pessoa</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={config.tipo_pessoa}
                    onChange={e => setConfig({...config, tipo_pessoa: e.target.value as 'PF' | 'PJ'})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                  >
                    <option value="PF">Pessoa Física (PF)</option>
                    <option value="PJ">Pessoa Jurídica (PJ)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  {config.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={config.documento}
                    onChange={e => setConfig({...config, documento: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder={config.tipo_pessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Razão Social</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={config.razao_social || ''}
                  onChange={e => setConfig({...config, razao_social: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Nome oficial da empresa"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chave PIX</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={config.chave_pix}
                  onChange={e => setConfig({...config, chave_pix: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Chave PIX para recebimento"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={config.telefone}
                  onChange={e => setConfig({...config, telefone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Localização</h2>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Endereço</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={config.endereco}
                  onChange={e => setConfig({...config, endereco: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Rua, Número, Bairro"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cidade</label>
              <div className="relative">
                <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={config.cidade}
                  onChange={e => setConfig({...config, cidade: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Cidade - UF"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end gap-4">
          <Button 
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="px-8"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 px-12"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configuração
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
