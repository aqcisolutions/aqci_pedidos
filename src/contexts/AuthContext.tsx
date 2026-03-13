import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '../services/supabaseClient';

export type UserRole = 'gestor' | 'admin_loja';

interface Profile {
  id: string;
  user_id: string;
  tipo_usuario: UserRole;
  empresa_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      console.log("User autenticado:", user);
      console.log("User ID autenticado:", user?.id);
      console.log("Perfil carregado:", profile);
      console.log("tipo_usuario carregado:", profile?.tipo_usuario);
      console.log("empresa_id carregado:", profile?.empresa_id);
    }
  }, [user, profile, loading]);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("AuthProvider: Buscando perfil para user_id:", userId);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('perfis_usuario')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('AuthProvider: Erro ao buscar perfil:', error);
        setProfile(null);
      } else if (!data) {
        console.warn('AuthProvider: Perfil não encontrado para o usuário:', userId);
        setProfile(null);
      } else {
        console.log("AuthProvider: Perfil carregado com sucesso:", data);
        setProfile(data);
      }
    } catch (err) {
      console.error('AuthProvider: Erro inesperado ao buscar perfil:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
