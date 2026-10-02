// =============================================
// supabase.js — Configuración central
// =============================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nykekrnbijochjcnkrga.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3B_zCPi9bJYN6TEmoVB3jg_VJ1C45Sj';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
