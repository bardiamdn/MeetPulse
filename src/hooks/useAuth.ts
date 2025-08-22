import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
        }
        
        if (mounted) {
          console.log('Initial session:', session?.user?.email || 'No user');
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }

      // Create profile if user signs up
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id);

          if (!profile || profile.length === 0) {
            await supabase.from('profiles').insert({
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name || '',
              avatar_url: session.user.user_metadata?.avatar_url || '',
            });
          }
        } catch (error) {
          console.error('Profile creation error:', error);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
};