-- Lịch sử phiên kiểm đếm chung giữa các máy (đã chạy trên Supabase ppdxqcrckbwckqzumlwy)
create table if not exists public.qr_sessions(id text primary key, data jsonb not null, updated_at timestamptz not null default now());
alter table public.qr_sessions enable row level security;
-- RPC qs_save(p_id,p_data), qs_list(), qs_del(p_id): security definer, cấp cho anon
