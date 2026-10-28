-- 클라우드 저장용 테이블 (Supabase SQL Editor에서 실행)
-- Authentication → Providers 에서 "Anonymous sign-ins" 를 켜야 한다.

create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

create policy "본인 세이브 읽기" on public.saves
  for select using (auth.uid() = user_id);

create policy "본인 세이브 쓰기" on public.saves
  for insert with check (auth.uid() = user_id);

create policy "본인 세이브 수정" on public.saves
  for update using (auth.uid() = user_id);
