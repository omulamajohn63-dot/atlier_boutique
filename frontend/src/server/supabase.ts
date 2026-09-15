import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseConfig } from './config';

let adminClient: SupabaseClient | undefined;

export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminClient) {
    const { url, serviceRoleKey } = requireSupabaseConfig();
    adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}