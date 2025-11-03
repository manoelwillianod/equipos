import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  team: 'Academia PX' | 'Design e Criação';
  whatsapp: string;
  photo_url?: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  photo_url_1: string;
  photo_url_2: string;
  photo_url_3: string;
  photo_url_4: string;
  status: 'disponível' | 'reservado' | 'em uso';
  created_at: string;
  created_by?: string;
}

export interface Kit {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by?: string;
}

export interface KitEquipment {
  id: string;
  kit_id: string;
  equipment_id: string;
}

export interface Reservation {
  id: string;
  user_id: string;
  equipment_id?: string;
  kit_id?: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'agendado' | 'em uso' | 'concluído' | 'cancelado';
  pickup_photos: string[];
  return_photos: string[];
  created_at: string;
}

export interface PurchaseRequest {
  id: string;
  user_id: string;
  equipment_name: string;
  reason: string;
  reference_link_1: string;
  reference_link_2: string;
  reference_link_3: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  created_at: string;
}
