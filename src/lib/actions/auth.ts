'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { ActionResponse } from '@/types';

export async function signUp(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;

  if (!email || !password || !fullName) {
    return { success: false, message: 'All fields are required' };
  }

  if (password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'Account created successfully! You can now log in.' };
}

export async function signIn(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, message: 'Email and password are required' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'Logged in successfully' };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getCurrentProfile() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}
