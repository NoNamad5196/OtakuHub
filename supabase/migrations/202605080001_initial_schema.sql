create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.franchises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in ('game', 'anime', 'vtuber', 'idol', 'other')),
  color_code varchar(7) not null default '#38bdf8',
  icon_url text,
  is_public boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.user_franchises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  franchise_id uuid not null references public.franchises(id) on delete cascade,
  priority int not null default 3 check (priority between 1 and 3),
  nickname text,
  created_at timestamptz not null default now(),
  unique (user_id, franchise_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references public.franchises(id) on delete cascade,
  type text not null check (type in ('goods_release', 'preorder', 'cafe', 'popup', 'concert', 'broadcast', 'birthday', 'other')),
  title text not null,
  start_date date not null,
  end_date date,
  location text,
  source_url text,
  is_verified boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  remind_days int[] not null default array[3, 7],
  is_attending boolean not null default false,
  memo text,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  franchise_id uuid references public.franchises(id) on delete set null,
  item_name text not null,
  price int not null default 0 check (price >= 0),
  is_wishlist boolean not null default true,
  bought_at timestamptz,
  image_url text,
  memo text,
  created_at timestamptz not null default now()
);

create table public.crawl_sources (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid references public.franchises(id) on delete cascade,
  source_type text not null check (source_type in ('naver_lounge', 'dc', 'official')),
  name text not null,
  url text not null,
  keywords text[] not null default '{}',
  is_active boolean not null default true,
  last_crawled_at timestamptz,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.crawled_posts (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid references public.franchises(id) on delete set null,
  crawl_source_id uuid references public.crawl_sources(id) on delete set null,
  source text not null check (source in ('naver_lounge', 'dc', 'official')),
  title text not null,
  content text not null,
  original_url text not null unique,
  content_hash text,
  event_id uuid references public.events(id) on delete set null,
  crawled_at timestamptz not null default now()
);

create table public.event_suggestions (
  id uuid primary key default gen_random_uuid(),
  crawled_post_id uuid references public.crawled_posts(id) on delete cascade,
  franchise_id uuid references public.franchises(id) on delete set null,
  title text not null,
  event_type text not null check (event_type in ('goods_release', 'preorder', 'cafe', 'popup', 'concert', 'broadcast', 'birthday', 'other')),
  start_date date not null,
  end_date date,
  location text,
  source_url text not null,
  confidence numeric(4, 3) not null default 0 check (confidence >= 0 and confidence <= 1),
  warnings text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'ignored')),
  raw_ai jsonb,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  remind_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'dismissed')),
  created_at timestamptz not null default now()
);

create table public.crawl_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.crawl_sources(id) on delete set null,
  status text not null check (status in ('success', 'partial', 'failed')),
  posts_found int not null default 0,
  suggestions_created int not null default 0,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now()
);

create index franchises_created_by_idx on public.franchises(created_by);
create index user_franchises_user_id_idx on public.user_franchises(user_id);
create index events_franchise_start_idx on public.events(franchise_id, start_date);
create index events_verified_start_idx on public.events(is_verified, start_date);
create index user_events_user_id_idx on public.user_events(user_id);
create index collections_user_id_idx on public.collections(user_id);
create index crawl_sources_active_idx on public.crawl_sources(is_active, source_type);
create index crawled_posts_source_idx on public.crawled_posts(crawl_source_id, crawled_at desc);
create index event_suggestions_status_idx on public.event_suggestions(status, created_at desc);
create index reminders_user_status_idx on public.reminders(user_id, status, remind_at);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.franchises enable row level security;
alter table public.user_franchises enable row level security;
alter table public.events enable row level security;
alter table public.user_events enable row level security;
alter table public.collections enable row level security;
alter table public.crawl_sources enable row level security;
alter table public.crawled_posts enable row level security;
alter table public.event_suggestions enable row level security;
alter table public.reminders enable row level security;
alter table public.crawl_runs enable row level security;

grant usage on schema public to anon, authenticated, service_role;

grant select on public.franchises, public.events to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_franchises, public.user_events, public.collections, public.reminders to authenticated;
grant select, insert, update on public.crawl_sources to authenticated;
grant select on public.crawled_posts, public.crawl_runs to authenticated;
grant select, update on public.event_suggestions to authenticated;
grant all on all tables in schema public to service_role;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "franchises_read_public_or_own"
on public.franchises for select
to anon, authenticated
using (is_public or ((select auth.uid()) is not null and (select auth.uid()) = created_by));

create policy "franchises_insert_own"
on public.franchises for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = created_by);

create policy "franchises_update_own"
on public.franchises for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = created_by)
with check ((select auth.uid()) is not null and (select auth.uid()) = created_by);

create policy "user_franchises_all_own"
on public.user_franchises for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "events_read_verified_or_own"
on public.events for select
to anon, authenticated
using (is_verified or ((select auth.uid()) is not null and (select auth.uid()) = created_by));

create policy "events_insert_own"
on public.events for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = created_by);

create policy "events_update_own"
on public.events for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = created_by)
with check ((select auth.uid()) is not null and (select auth.uid()) = created_by);

create policy "user_events_all_own"
on public.user_events for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "collections_all_own"
on public.collections for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "crawl_sources_read_active_or_own"
on public.crawl_sources for select
to authenticated
using (is_active or ((select auth.uid()) is not null and (select auth.uid()) = created_by));

create policy "crawl_sources_insert_own"
on public.crawl_sources for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = created_by);

create policy "crawl_sources_update_own"
on public.crawl_sources for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = created_by)
with check ((select auth.uid()) is not null and (select auth.uid()) = created_by);

create policy "crawled_posts_read_authenticated"
on public.crawled_posts for select
to authenticated
using (true);

create policy "event_suggestions_read_authenticated"
on public.event_suggestions for select
to authenticated
using (true);

create policy "event_suggestions_review_authenticated"
on public.event_suggestions for update
to authenticated
using ((select auth.uid()) is not null)
with check (reviewed_by = (select auth.uid()));

create policy "reminders_all_own"
on public.reminders for all
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "crawl_runs_read_authenticated"
on public.crawl_runs for select
to authenticated
using (true);
