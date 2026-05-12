-- 三导师 AI 学习成长系统 - Supabase 数据库 schema
-- 在 Supabase Dashboard → SQL Editor 中粘贴整个文件,点 Run。
-- 任何字段调整必须先改这里再 ALTER TABLE,不要直接在 UI 改。

-- ============================================================
-- 1. profiles 表 —— 用户基础信息 + 测试结果
-- ============================================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,

  -- 学习人格画像
  learning_profile_type text,

  -- AI 能力等级（详见 TECH.md §19）
  ai_level int,
  ai_level_name text,
  ai_level_confidence float,
  ai_level_algorithm int,        -- 算法原始结果
  ai_level_user_adjusted int,    -- 用户微调结果（只允许一次）

  -- 卡点 / 节奏 / 路径
  main_blocker text,
  preferred_pace text,
  pace_recommendation text,
  recommended_path text,

  -- 导师比例
  mentor_mix jsonb,              -- { karpathy, qian, adler } 合计 100

  -- 完整 TestResult JSON（用于调试 / 详细分析）
  test_result_full jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "users manage their own profile" on public.profiles;
create policy "users manage their own profile" on public.profiles
  for all using (auth.uid() = user_id);

-- ============================================================
-- 2. outputs 表 —— 用户输出沉淀（跨会话）
-- ============================================================
create table if not exists public.outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id text not null,
  type text default 'one_sentence',
  content text not null,
  created_at timestamptz default now()
);

create index if not exists outputs_user_id_idx on public.outputs(user_id);
create index if not exists outputs_lesson_id_idx on public.outputs(lesson_id);

alter table public.outputs enable row level security;

drop policy if exists "users manage their own outputs" on public.outputs;
create policy "users manage their own outputs" on public.outputs
  for all using (auth.uid() = user_id);

-- ============================================================
-- 3. learning_sessions 表 —— 每节学习的会话归档
-- ============================================================
create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id text not null,
  source_type text default 'built_in_course',  -- built_in_course / hot_item / material

  started_at timestamptz not null default now(),
  ended_at timestamptz,

  messages jsonb not null default '[]'::jsonb,   -- ChatMessage[]
  active_mentor text,
  mentor_turn_count int default 0,

  created_at timestamptz default now()
);

create index if not exists sessions_user_id_idx on public.learning_sessions(user_id);
create index if not exists sessions_started_at_idx on public.learning_sessions(started_at desc);

alter table public.learning_sessions enable row level security;

drop policy if exists "users manage their own sessions" on public.learning_sessions;
create policy "users manage their own sessions" on public.learning_sessions
  for all using (auth.uid() = user_id);

-- ============================================================
-- 4. updated_at 自动更新触发器（给 profiles 用）
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 5. 新用户注册时自动创建空 profile 行
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 完成!跑完后在 Table Editor 应该能看到 3 张表(profiles, outputs, learning_sessions)。
-- ============================================================
