import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
        }
        
        console.log('Initial session user:', session?.user?.email || 'No user');
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, 'User:', session?.user?.email || 'No user');
      
      setUser(session?.user ?? null);
      setLoading(false);

      // Create profile if user signs up
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: existingProfile, error: selectError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();

          // Check if profile doesn't exist (PGRST116 error means no rows found)
          if (!existingProfile || (selectError && selectError.code === 'PGRST116')) {
            try {
              const { error: insertError } = await supabase.from('profiles').insert({
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || '',
                avatar_url: session.user.user_metadata?.avatar_url || '',
              });
              
              if (insertError && insertError.code !== '23505') {
                // Only throw if it's not a duplicate key error
                throw insertError;
              } else if (insertError && insertError.code === '23505') {
                console.warn('Profile already exists for user:', session.user.email);
              } else {
                console.log('Profile created for user:', session.user.email);
              }
            } catch (insertError) {
              console.error('Profile creation error:', insertError);
            }
          } else {
            console.log('Profile already exists for user:', session.user.email);
          }
        } catch (error) {
          // Handle any other unexpected errors in profile checking/creation
          console.error('Profile handling error:', error);
        }
      }
    });

    return () => {
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
        emailRedirectTo: 'https://meeting.bardiamadani.com/',
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

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: 'https://meeting.bardiamadani.com/',
      },
    });
    return { error };
  };

  return {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resendConfirmationEmail,
  };
};
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name || '',
              avatar_url: session.user.user_metadata?.avatar_url || '',
            });
            console.log('Profile created for user:', session.user.email);
          }
        } catch (error) {
          console.error('Profile creation error:', error);
        }
      }
    });

    return () => {
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
        emailRedirectTo: 'https://meeting.bardiamadani.com/',
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

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: 'https://meeting.bardiamadani.com/',
      },
    });
    return { error };
  };

  return {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resendConfirmationEmail,
  };
};