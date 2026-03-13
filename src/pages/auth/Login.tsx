import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { getSupabase } from '../../services/supabaseClient';
import { Button } from '../../components/UI';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the redirect path from location state, or default to '/'
  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabase();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // 1. Após autenticar, obter o usuário com getUser() conforme solicitado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error("Usuário não encontrado após autenticação.");

        console.log("User ID autenticado:", user.id);

        // 2 & 3. Buscar o perfil na tabela perfis_usuario usando maybeSingle()
        const { data: profile, error: profileError } = await supabase
          .from('perfis_usuario')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // 4. Exibir no console
        console.log("Perfil encontrado:", profile);

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
          throw profileError;
        }

        // 6. Caso não encontre perfil
        if (!profile) {
          setError("Perfil do usuário não encontrado em perfis_usuario");
          setLoading(false);
          return;
        }

        // 5. Redirecionar baseado no tipo_usuario
        let targetRoute = from;
        if (from === '/') {
          if (profile.tipo_usuario === 'gestor') {
            targetRoute = '/gestor';
          } else if (profile.tipo_usuario === 'admin_loja') {
            targetRoute = '/admin';
          }
        }

        console.log("Redirecionando para:", targetRoute);
        navigate(targetRoute, { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao entrar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="flex flex-col items-center gap-4 mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <LogIn className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bem-vindo</h1>
              <p className="text-gray-500 text-sm font-medium">Entre na sua conta para continuar</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 text-red-600"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-bold leading-tight">{error}</p>
              </motion.div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-4 py-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </div>
        
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium">
            Problemas com o acesso? <br />
            <span className="text-primary font-bold cursor-pointer hover:underline">Contate o suporte</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
