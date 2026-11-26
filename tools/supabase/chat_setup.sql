-- Bộ đếm số câu hỏi AI mỗi thiết bị / mỗi ngày (chỉ hàm "chat" dùng được)
create table if not exists public.chat_usage(day date not null, dev text not null, n int not null default 0, primary key(day,dev));
alter table public.chat_usage enable row level security;
create or replace function public.chat_hit(p_day date,p_dev text,p_max_dev int,p_max_day int) returns int
language plpgsql security definer set search_path=public as $$
declare t int; d int;
begin
  select coalesce(sum(n),0) into t from chat_usage where day=p_day;
  if t>=p_max_day then return -2; end if;
  insert into chat_usage(day,dev,n) values(p_day,p_dev,1) on conflict(day,dev) do update set n=chat_usage.n+1 returning n into d;
  if d>p_max_dev then update chat_usage set n=n-1 where day=p_day and dev=p_dev; return -1; end if;
  return p_max_dev-d;
end $$;
revoke all on function public.chat_hit(date,text,int,int) from public,anon,authenticated;
grant execute on function public.chat_hit(date,text,int,int) to service_role;
