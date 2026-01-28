import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Tables } from '../types/database.types';

export type Profile = Tables<'profiles'>;

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_CATEGORIES = [
  { name: 'Учеба', color: '#8b5cf6', icon: 'book' },
  { name: 'Работа', color: '#10b981', icon: 'briefcase' },
  { name: 'Личное', color: '#f59e0b', icon: 'user' },
  { name: 'Здоровье', color: '#ef4444', icon: 'heart' }
];

const buildDefaultProfile = (user: User): Profile => {
  const usernameFromMeta =
    (user.user_metadata?.username as string | undefined) ||
    user.email?.split('@')[0] ||
    'user';

  return {
    id: user.id,
    username: usernameFromMeta,
    avatar_url: null,
    theme: 'dark',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow',
    email_notifications: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

type SessionResult = {
  data: { session: { user: User } | null };
  error: unknown | null;
};

const getSessionSafe = async (timeoutMs: number): Promise<SessionResult> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<SessionResult>((resolve) => {
    timer = setTimeout(() => resolve({ data: { session: null }, error: 'Auth timeout' }), timeoutMs);
  });

  const sessionPromise = supabase.auth.getSession().then((result) => ({
    data: { session: result.data.session as { user: User } | null },
    error: result.error ?? null
  }));

  const result = await Promise.race([sessionPromise, timeout]);
  clearTimeout(timer!);
  return result;
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = useCallback(async (authUser: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('Ошибка загрузки профиля:', error);
      return;
    }

    if (!data) {
      const payload = buildDefaultProfile(authUser);
      const { error: upsertError } = await supabase.from('profiles').upsert(payload);
      if (upsertError) {
        console.error('Ошибка создания профиля:', upsertError);
        return;
      }
      setProfile(payload);
    } else {
      setProfile(data);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const sessionResult = await getSessionSafe(15000);
        if (!mounted) return;
        setUser(sessionResult.data.session?.user ?? null);
        if (sessionResult.data.session?.user) {
          await ensureProfile(sessionResult.data.session.user);
        }
      } catch (error) {
        console.error('Ошибка инициализации сессии:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await ensureProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    hydrate();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const profilePayload: Profile = {
          id: data.user.id,
          username,
          avatar_url: null,
          theme: 'dark',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow',
          email_notifications: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await supabase.from('profiles').upsert(profilePayload);

        const { data: existingCategories } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', data.user.id)
          .limit(1);

        if (!existingCategories || existingCategories.length === 0) {
          const categoriesPayload = DEFAULT_CATEGORIES.map((category) => ({
            ...category,
            user_id: data.user!.id
          }));
          await supabase.from('categories').insert(categoriesPayload);
        }

        setProfile(profilePayload);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const updateEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Нет активной сессии');

      const payload = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      if (data) setProfile(data);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
      updateEmail,
      updateProfile
    }),
    [user, profile, loading, signIn, signUp, signOut, requestPasswordReset, updatePassword, updateEmail, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};
