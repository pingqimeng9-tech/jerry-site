-- ============================================================
-- Jerry.dev 用户系统数据库结构
-- 使用方法：Supabase 后台 → SQL Editor → New query → 把这整个文件粘进去 → Run
-- 可以重复运行（用了 IF NOT EXISTS / OR REPLACE），改坏了重跑一次就行
-- ============================================================

-- ---------- 0. 邮箱验证码表：只给后端(service_role)用，前端拿不到、也不需要拿到 ----------
-- 不给 anon/authenticated 任何policy，默认就是"开了RLS但没有规则=谁都读不到、写不到"，
-- 只有用 service_role key 的后端接口能绕过RLS直接操作这张表
create table if not exists public.email_otp_codes (
  email text primary key,
  code text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.email_otp_codes enable row level security;


-- ---------- 1. 用户资料表：补充 auth.users 里没有的展示信息 ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 任何登录用户都能读所有人的profile（比如评论区要显示别人的昵称/头像）
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

-- 只能改自己的profile
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- 新用户注册（不管是Google还是邮箱验证码）自动建一条profile记录
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------- 2. 积分账户表：只能被下面的RPC函数改，前端不能直接写 ----------
create table if not exists public.user_points (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_points enable row level security;

-- 只能看自己的积分，不能直接改（改积分只能通过下面的RPC函数，函数内部用security definer绕过RLS）
drop policy if exists "points_select_own" on public.user_points;
create policy "points_select_own"
  on public.user_points for select
  using (auth.uid() = user_id);


-- ---------- 3. 打卡记录：一天只能打一次卡 ----------
create table if not exists public.checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (user_id, checkin_date)
);

alter table public.checkins enable row level security;

drop policy if exists "checkins_select_own" on public.checkins;
create policy "checkins_select_own"
  on public.checkins for select
  using (auth.uid() = user_id);


-- ---------- 4. 浏览/点赞记录 ----------
create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('view', 'like')),
  target_id text not null,       -- 文章id或其他内容的标识
  created_at timestamptz not null default now(),
  unique (user_id, action, target_id)  -- 同一用户对同一内容的同一动作只记一次（view去重、like可切换）
);

alter table public.activity_log enable row level security;

drop policy if exists "activity_select_own" on public.activity_log;
create policy "activity_select_own"
  on public.activity_log for select
  using (auth.uid() = user_id);


-- ---------- 5. Zara 喂饭购买记录 ----------
create table if not exists public.zara_purchases (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  cost int not null,
  created_at timestamptz not null default now()
);

alter table public.zara_purchases enable row level security;

drop policy if exists "purchases_select_own" on public.zara_purchases;
create policy "purchases_select_own"
  on public.zara_purchases for select
  using (auth.uid() = user_id);


-- ---------- 6. 评论 ----------
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id text not null,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

-- 评论是公开内容，谁都能读（不需要登录也能看评论区）
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all"
  on public.comments for select
  using (true);

-- 只能以自己的身份发评论
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
  on public.comments for insert
  with check (auth.uid() = user_id);

-- 只能删自己的评论
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
  on public.comments for delete
  using (auth.uid() = user_id);


-- ============================================================
-- RPC 函数：所有会改积分的操作都走这里，前端只能调用函数、不能直接写表
-- security definer = 用创建者(超级权限)的身份执行，内部逻辑自己控制安全，
-- 外部调用者依然要求 auth.uid() 拿到本人身份，不能冒充别人
-- ============================================================

-- 每日打卡：一天只能领一次积分
create or replace function public.daily_checkin()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  already_checked boolean;
  reward int := 5; -- 打卡奖励积分，改这个数字就能调整
  new_total int;
begin
  if uid is null then
    raise exception '需要先登录';
  end if;

  select exists(select 1 from public.checkins where user_id = uid and checkin_date = current_date)
  into already_checked;

  if already_checked then
    select points into new_total from public.user_points where user_id = uid;
    return json_build_object('ok', false, 'reason', 'already_checked_in', 'points', coalesce(new_total, 0));
  end if;

  insert into public.checkins (user_id) values (uid);

  insert into public.user_points (user_id, points, updated_at)
  values (uid, reward, now())
  on conflict (user_id) do update
    set points = public.user_points.points + reward, updated_at = now()
  returning points into new_total;

  return json_build_object('ok', true, 'awarded', reward, 'points', new_total);
end;
$$;


-- 记录浏览：同一篇文章只有第一次浏览给积分，重复打开不会重复加分
create or replace function public.record_view(p_post_id text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  reward int := 1;
  new_total int;
begin
  if uid is null then
    return json_build_object('ok', false, 'reason', 'not_logged_in');
  end if;

  insert into public.activity_log (user_id, action, target_id)
  values (uid, 'view', p_post_id)
  on conflict (user_id, action, target_id) do nothing;

  if not found then
    select points into new_total from public.user_points where user_id = uid;
    return json_build_object('ok', true, 'awarded', 0, 'points', coalesce(new_total, 0));
  end if;

  insert into public.user_points (user_id, points, updated_at)
  values (uid, reward, now())
  on conflict (user_id) do update
    set points = public.user_points.points + reward, updated_at = now()
  returning points into new_total;

  return json_build_object('ok', true, 'awarded', reward, 'points', new_total);
end;
$$;


-- 点赞切换：点第一次加分，取消点赞扣回对应积分（不能靠反复点赞/取消刷分，加减对称）
create or replace function public.toggle_like(p_post_id text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  reward int := 2;
  liked_now boolean;
  new_total int;
begin
  if uid is null then
    raise exception '需要先登录';
  end if;

  if exists(select 1 from public.activity_log where user_id = uid and action = 'like' and target_id = p_post_id) then
    delete from public.activity_log where user_id = uid and action = 'like' and target_id = p_post_id;
    liked_now := false;
    update public.user_points set points = greatest(0, points - reward), updated_at = now()
      where user_id = uid returning points into new_total;
  else
    insert into public.activity_log (user_id, action, target_id) values (uid, 'like', p_post_id);
    liked_now := true;
    insert into public.user_points (user_id, points, updated_at)
    values (uid, reward, now())
    on conflict (user_id) do update
      set points = public.user_points.points + reward, updated_at = now()
    returning points into new_total;
  end if;

  return json_build_object('ok', true, 'liked', liked_now, 'points', coalesce(new_total, 0));
end;
$$;


-- 喂饭消费：扣积分 + 记一条购买记录，积分不够直接报错，不会扣成负数
create or replace function public.feed_zara(p_item_id text, p_cost int)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  current_points int;
  new_total int;
begin
  if uid is null then
    raise exception '需要先登录';
  end if;

  select points into current_points from public.user_points where user_id = uid;
  current_points := coalesce(current_points, 0);

  if current_points < p_cost then
    return json_build_object('ok', false, 'reason', 'not_enough_points', 'points', current_points);
  end if;

  update public.user_points set points = points - p_cost, updated_at = now()
    where user_id = uid returning points into new_total;

  insert into public.zara_purchases (user_id, item_id, cost) values (uid, p_item_id, p_cost);

  return json_build_object('ok', true, 'points', new_total);
end;
$$;


-- 获取当前用户的完整状态（积分 + 是否今天已打卡 + 连续打卡天数），前端一次调用拿全部数据
create or replace function public.get_my_status()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  pts int;
  checked_today boolean;
  streak int;
  anchor date;
begin
  if uid is null then
    return json_build_object('logged_in', false);
  end if;

  select points into pts from public.user_points where user_id = uid;
  select exists(select 1 from public.checkins where user_id = uid and checkin_date = current_date) into checked_today;

  -- 连续打卡天数：以"今天"为基准，今天还没打卡就往前推到"昨天"当基准
  -- （这样今天还没打卡之前，昨天连续打的卡不会瞬间清零，符合"到今天结束前都还算数"的直觉）
  anchor := case when checked_today then current_date else current_date - 1 end;

  with days as (
    select checkin_date,
           checkin_date - (row_number() over (order by checkin_date desc))::int as grp
    from public.checkins
    where user_id = uid and checkin_date <= anchor
  )
  select count(*) into streak
  from days
  where grp = (select grp from days where checkin_date = anchor limit 1);

  return json_build_object(
    'logged_in', true,
    'points', coalesce(pts, 0),
    'checked_in_today', checked_today,
    'streak', coalesce(streak, 0)
  );
end;
$$;
