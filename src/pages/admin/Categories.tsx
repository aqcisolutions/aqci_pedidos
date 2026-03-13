import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  X, 
  CheckCircle, 
  Loader2,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '../../services/supabaseClient';
import { Category } from '../../types';
import { Button } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';

export default function Categories() {
  const { profile, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    ativo: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (profile?.empresa_id) {
        fetchCategories();
      } else {
        setLoading(false);
      }
    }
  }, [profile?.empresa_id, authLoading]);

  const fetchCategories = async () => {
    if (!profile?.empresa_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        nome: category.nome,
        ativo: category.ativo
      });
    } else {
      setEditingCategory(null);
      setFormData({
        nome: '',
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const perfil = profile;
    console.log("Perfil do usuário:", perfil);

    if (!perfil?.empresa_id) {
      setToastMessage('Empresa do usuário não encontrada');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      setSaving(true);
      const supabase = getSupabase();

      const payload = {
        nome: formData.nome,
        ativo: formData.ativo,
        empresa_id: perfil.empresa_id
      };

      console.log("Payload categoria:", payload);

      if (editingCategory) {
        const { error } = await supabase
          .from('categorias')
          .update(payload)
          .eq('id', editingCategory.id);
        
        if (error) {
          console.error("Erro ao salvar categoria:", error);
          throw error;
        }
        setToastMessage('Categoria atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('categorias')
          .insert([payload]);
        
        if (error) {
          console.error("Erro ao salvar categoria:", error);
          throw error;
        }
        setToastMessage('Categoria criada com sucesso');
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      setToastMessage('Não foi possível salvar a categoria');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Missing Empresa ID Warning */}
      {!profile?.empresa_id && !loading && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
          <X className="w-5 h-5" />
          <p className="text-sm font-bold">
            Atenção: Seu perfil não está vinculado a uma empresa. Você não poderá salvar novas categorias.
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
            <span className="font-bold text-sm">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Categorias</h1>
          <p className="text-gray-500 text-sm">Organize seus produtos por grupos.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nova Categoria
        </Button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-gray-500 font-medium">Carregando categorias...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <Tag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Nenhuma categoria encontrada</h3>
              <p className="text-gray-500 text-sm">Crie categorias para organizar melhor seus produtos.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Nome</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Status</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Criação</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-bold text-gray-900 text-sm">{category.nome}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        category.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {category.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs text-gray-500">
                        {new Date(category.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(category)}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 bg-gray-900 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </h2>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                    {editingCategory ? `ID: ${editingCategory.id.slice(0, 8)}` : 'Preencha os dados abaixo'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Categoria</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Ex: Buquês, Cestas, Presentes"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, ativo: true})}
                      className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${
                        formData.ativo 
                          ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' 
                          : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      Ativo
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, ativo: false})}
                      className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${
                        !formData.ativo 
                          ? 'bg-gray-700 border-gray-700 text-white shadow-lg shadow-gray-700/20' 
                          : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      Inativo
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Categoria'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
