'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse, ResourceFormData } from '@/types';
import { validateResourceForm } from '@/lib/validations/schemas';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'administrator') {
    throw new Error('Unauthorized: Administrator access required');
  }

  return { supabase, user };
}

export async function createResource(data: ResourceFormData): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdmin();

    const errors = validateResourceForm(data);
    if (errors.length > 0) {
      return { success: false, message: errors[0].message };
    }

    const { error } = await supabase
      .from('resources')
      .insert({
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category,
        location: data.location.trim(),
        capacity: data.capacity,
        status: data.status,
      });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Resource created successfully' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create resource' };
  }
}

export async function updateResource(id: string, data: ResourceFormData): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdmin();

    const errors = validateResourceForm(data);
    if (errors.length > 0) {
      return { success: false, message: errors[0].message };
    }

    const { error } = await supabase
      .from('resources')
      .update({
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category,
        location: data.location.trim(),
        capacity: data.capacity,
        status: data.status,
      })
      .eq('id', id);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Resource updated successfully' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update resource' };
  }
}

export async function toggleResourceStatus(id: string, newStatus: 'active' | 'inactive'): Promise<ActionResponse> {
  try {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from('resources')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: `Resource ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update resource status' };
  }
}

export async function getResources(filters?: {
  search?: string;
  category?: string;
  status?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getResourceById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}
