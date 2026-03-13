import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Edit2, 
  Image as ImageIcon, 
  X, 
  Upload, 
  CheckCircle, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '../../services/supabaseClient';
import { Product, Category } from '../../types';
import { Button } from '../../components/UI';
import { useAuth } from '../../contexts/AuthContext';

export default function Products() {
  const { profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    ativo: true,
    categoria_id: '',
    imagem_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (profile?.empresa_id) {
        fetchProducts();
        fetchCategories();
      } else {
        setLoading(false);
      }
    }
  }, [profile?.empresa_id, authLoading]);

  const fetchProducts = async () => {
    try {
      if (!profile?.empresa_id) return;
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias(nome)')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      if (!profile?.empresa_id) return;
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nome: product.nome,
        descricao: product.descricao,
        preco: product.preco.toString(),
        ativo: product.ativo,
        categoria_id: product.categoria_id || '',
        imagem_url: product.imagem_url || ''
      });
      setImagePreview(product.imagem_url);
    } else {
      setEditingProduct(null);
      setFormData({
        nome: '',
        descricao: '',
        preco: '',
        ativo: true,
        categoria_id: '',
        imagem_url: ''
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const supabase = getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('produtos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('produtos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.empresa_id) {
      setToastMessage('Erro: ID da empresa não encontrado no seu perfil.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      setSaving(true);
      const supabase = getSupabase();
      let finalImageUrl = formData.imagem_url;

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const productData = {
        nome: formData.nome,
        descricao: formData.descricao,
        preco: parseFloat(formData.preco),
        ativo: formData.ativo,
        categoria_id: formData.categoria_id || null,
        imagem_url: finalImageUrl,
        empresa_id: profile?.empresa_id
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('produtos')
          .update(productData)
          .eq('id', editingProduct.id)
          .eq('empresa_id', profile.empresa_id);
        if (error) throw error;
        setToastMessage('Produto atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert([productData]);
        if (error) throw error;
        setToastMessage('Produto cadastrado com sucesso');
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Erro ao salvar produto. Verifique se o bucket "produtos" existe no Supabase Storage.');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Missing Empresa ID Warning */}
      {!profile?.empresa_id && !loading && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">
            Atenção: Seu perfil não está vinculado a uma empresa. Você não poderá gerenciar produtos.
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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Produtos</h1>
          <p className="text-gray-500 text-sm">Gerencie o catálogo de flores e presentes.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Produto
        </Button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-gray-500 font-medium">Carregando produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Nenhum produto encontrado</h3>
              <p className="text-gray-500 text-sm">Tente buscar por outro nome ou cadastre um novo produto.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Imagem</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Nome</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Categoria</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Preço</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Status</th>
                  <th className="pb-4 pt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-100">
                        {product.imagem_url ? (
                          <img 
                            src={product.imagem_url} 
                            alt={product.nome} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-gray-900 text-sm">{product.nome}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs text-gray-500 font-medium">
                        {(product as any).categorias?.nome || 'Sem Categoria'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-black text-primary text-sm">
                        R$ {product.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        product.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(product)}
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

      {/* Product Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 bg-gray-900 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                  </h2>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                    {editingProduct ? `ID: ${editingProduct.id.slice(0, 8)}` : 'Preencha os dados abaixo'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Image Upload */}
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Imagem do Produto</label>
                    <div className="relative aspect-square rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden group">
                      {imagePreview ? (
                        <>
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg">
                              Alterar Imagem
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                          <Upload className="w-8 h-8 text-gray-300 mb-2" />
                          <span className="text-xs font-bold text-gray-400">Clique para upload</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">Formatos aceitos: JPG, PNG. Máx 2MB.</p>
                  </div>

                  {/* Right Column: Fields */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={e => setFormData({...formData, nome: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="Ex: Buquê de Rosas Vermelhas"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.preco}
                        onChange={e => setFormData({...formData, preco: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="0,00"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                      <select
                        value={formData.categoria_id}
                        onChange={e => setFormData({...formData, categoria_id: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                      >
                        <option value="">Sem Categoria</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nome}</option>
                        ))}
                      </select>
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
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea
                    rows={4}
                    value={formData.descricao}
                    onChange={e => setFormData({...formData, descricao: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    placeholder="Descreva os detalhes do produto..."
                  />
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
                      'Salvar Produto'
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
