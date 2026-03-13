import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MoreVertical, 
  CheckCircle2, 
  Calendar,
  MapPin,
  Shield,
  Globe,
  Hash,
  Loader2,
  X,
  Save,
  Edit2,
  XCircle,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '../../services/supabaseClient';
import { Button } from '../../components/UI';
import { StoreConfig } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function Companies() {
  const { signOut, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<StoreConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const initialFormState = {
    nome_fantasia: '',
    razao_social: '',
    tipo_pessoa: 'PF' as 'PF' | 'PJ',
    documento: '',
    telefone: '',
    endereco: '',
    cidade: '',
    chave_pix: '',
    plano: 'free',
    slug: '',
    subdominio: '',
    ativo: true,
    logo_url: '',
    cor_primaria: '#FF6321',
    cor_secundaria: '#F5F5F0'
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (company?: StoreConfig) => {
    if (company) {
      setEditingId(company.id || null);
      setFormData({
        nome_fantasia: company.nome_fantasia || '',
        razao_social: company.razao_social || '',
        tipo_pessoa: company.tipo_pessoa || 'PF',
        documento: company.documento || '',
        telefone: company.telefone || '',
        endereco: company.endereco || '',
        cidade: company.cidade || '',
        chave_pix: company.chave_pix || '',
        plano: company.plano || 'free',
        slug: company.slug || '',
        subdominio: company.subdominio || '',
        ativo: company.ativo ?? true,
        logo_url: company.logo_url || '',
        cor_primaria: company.cor_primaria || '#FF6321',
        cor_secundaria: company.cor_secundaria || '#F5F5F0'
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const supabase = getSupabase();
      
      if (editingId) {
        const { error } = await supabase
          .from('empresas')
          .update(formData)
          .eq('id', editingId);
        
        if (error) {
          console.error("Erro ao atualizar empresa:", error);
          if (error.code === '23505') {
            setToast({ type: 'error', message: 'Slug ou subdomínio já estão em uso' });
            setTimeout(() => setToast(null), 3000);
            return;
          }
          throw error;
        }
        setToast({ type: 'success', message: 'Empresa atualizada com sucesso' });
      } else {
        // Cadastro inicial - apenas campos mínimos necessários
        const payload = {
          nome_fantasia: formData.nome_fantasia,
          cidade: formData.cidade,
          plano: formData.plano,
          slug: formData.slug,
          subdominio: formData.subdominio,
          ativo: formData.ativo,
          tipo_pessoa: formData.tipo_pessoa
        };

        console.log("Payload nova empresa:", payload);

        const { error } = await supabase
          .from('empresas')
          .insert([payload]);
        
        if (error) {
          console.error("Erro ao criar empresa:", error);
          
          // Erro de duplicidade (unique constraint)
          if (error.code === '23505') {
            setToast({ type: 'error', message: 'Slug ou subdomínio já estão em uso' });
            setTimeout(() => setToast(null), 3000);
            return;
          }
          
          throw error;
        }
        
        setToast({ type: 'success', message: 'Empresa criada com sucesso' });
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingId(null);
      fetchCompanies();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      const isUpdate = !!editingId;
      setToast({ 
        type: 'error', 
        message: isUpdate ? 'Não foi possível atualizar a empresa' : 'Não foi possível criar a empresa' 
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-4 md:p-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className={`fixed top-6 right-6 z-[150] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-green-500 text-white border-green-400/20' 
                : 'bg-red-500 text-white border-red-400/20'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão de Empresas</h1>
            <p className="text-gray-500 text-sm">Gerencie todas as lojas da plataforma.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-6"
            >
              <Plus className="w-5 h-5" />
              Nova Empresa
            </Button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="p-3 text-red-500 hover:bg-red-50 rounded-2xl"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cidade</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plano</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Criação</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="text-sm text-gray-500 font-medium">Carregando empresas...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <span className="text-sm text-gray-500 font-medium">Nenhuma empresa encontrada.</span>
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                            {company.nome_fantasia.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{company.nome_fantasia}</span>
                            <span className="text-[10px] text-gray-400 font-medium tracking-tight">/{company.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-gray-600">{company.documento || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{company.cidade || 'Não informada'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          company.plano === 'pro' ? 'bg-indigo-50 text-indigo-600' :
                          company.plano === 'enterprise' ? 'bg-amber-50 text-amber-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {company.plano}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {company.ativo ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-xs font-bold text-green-600">Ativa</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-xs font-bold text-red-600">Inativa</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">
                            {company.created_at ? new Date(company.created_at).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a 
                            href={`/shop/${company.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 rounded-lg transition-all"
                            title="Ver Loja"
                          >
                            <Globe className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={() => handleOpenModal(company)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg transition-all text-xs font-bold"
                            title="Editar Empresa"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Company Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {editingId ? 'Editar Empresa' : 'Nova Empresa'}
                      </h2>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">
                        {editingId ? 'Atualizar Dados' : 'Cadastro de Loja'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Fantasia</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={formData.nome_fantasia}
                          onChange={e => setFormData({...formData, nome_fantasia: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="Ex: Flora Floricultura"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Razão Social</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.razao_social}
                          onChange={e => setFormData({...formData, razao_social: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="Nome oficial da empresa"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Pessoa</label>
                      <select
                        value={formData.tipo_pessoa}
                        onChange={e => setFormData({...formData, tipo_pessoa: e.target.value as 'PF' | 'PJ'})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                      >
                        <option value="PF">Pessoa Física (PF)</option>
                        <option value="PJ">Pessoa Jurídica (PJ)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        {formData.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}
                      </label>
                      <input
                        type="text"
                        value={formData.documento}
                        onChange={e => setFormData({...formData, documento: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder={formData.tipo_pessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefone</label>
                      <input
                        type="text"
                        value={formData.telefone}
                        onChange={e => setFormData({...formData, telefone: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chave PIX</label>
                      <input
                        type="text"
                        value={formData.chave_pix}
                        onChange={e => setFormData({...formData, chave_pix: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="Chave PIX"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Endereço</label>
                      <input
                        type="text"
                        value={formData.endereco}
                        onChange={e => setFormData({...formData, endereco: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="Rua, Número, Bairro"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cidade</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={formData.cidade}
                          onChange={e => setFormData({...formData, cidade: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="Cidade - UF"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Slug</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={formData.slug}
                          onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="minha-loja"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Plano</label>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={formData.plano}
                          onChange={e => setFormData({...formData, plano: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subdomínio</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.subdominio}
                        onChange={e => setFormData({...formData, subdominio: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="loja.exemplo.com"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL da Logo</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.logo_url}
                        onChange={e => setFormData({...formData, logo_url: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="https://exemplo.com/logo.png"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor Primária</label>
                      <input
                        type="color"
                        value={formData.cor_primaria}
                        onChange={e => setFormData({...formData, cor_primaria: e.target.value})}
                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl p-1 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor Secundária</label>
                      <input
                        type="color"
                        value={formData.cor_secundaria}
                        onChange={e => setFormData({...formData, cor_secundaria: e.target.value})}
                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl p-1 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">Empresa Ativa</span>
                      <span className="text-[10px] text-gray-400 font-medium">Define se a loja pode ser acessada</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, ativo: !formData.ativo})}
                      className={`w-12 h-6 rounded-full transition-all relative ${formData.ativo ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.ativo ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex gap-3 mt-4 sticky bottom-0 bg-white pt-2">
                    <Button 
                      type="button"
                      variant="ghost"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="flex-[2] flex items-center justify-center gap-2 py-4"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          {editingId ? 'Salvar Alterações' : 'Criar Empresa'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
