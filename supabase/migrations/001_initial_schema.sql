-- Users
create table if not exists users (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  zip_code     text,
  display_name text,
  industry     text,
  created_at   timestamptz default now()
);

-- Zones
create table if not exists zones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  type        text not null,
  template_id text,
  config      jsonb default '{}',
  position    int default 0,
  enabled     boolean default true,
  created_at  timestamptz default now()
);

-- Articles
create table if not exists articles (
  id             uuid primary key default gen_random_uuid(),
  external_id    text unique not null,
  headline       text not null,
  summary        text,
  image_url      text,
  source_name    text,
  source_url     text,
  published_at   timestamptz,
  urgency_score  int default 1,
  zone_type      text,
  tags           jsonb default '[]',
  created_at     timestamptz default now()
);

-- User saves (Read Later)
create table if not exists user_saves (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  article_id uuid references articles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, article_id)
);

-- User tracked topics
create table if not exists user_tracks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  topic       text not null,
  zone_id     uuid references zones(id) on delete set null,
  deadline_at timestamptz,
  created_at  timestamptz default now()
);

-- Zone quicklook stats
create table if not exists zone_quicklook (
  id         uuid primary key default gen_random_uuid(),
  zone_type  text not null,
  label      text not null,
  value      text not null,
  sub        text,
  position   int default 0,
  updated_at timestamptz default now()
);

-- Indexes
create unique index if not exists articles_external_id_idx on articles(external_id);
create index if not exists articles_zone_published_idx on articles(zone_type, published_at desc);
create index if not exists articles_urgency_idx on articles(urgency_score desc);
create index if not exists user_saves_user_idx on user_saves(user_id);
create index if not exists user_tracks_user_idx on user_tracks(user_id);

-- RLS
alter table users enable row level security;
alter table zones enable row level security;
alter table articles enable row level security;
alter table user_saves enable row level security;
alter table user_tracks enable row level security;
alter table zone_quicklook enable row level security;

-- users: own row only
create policy "users_select_own" on users for select using (auth.uid() = id);
create policy "users_insert_own" on users for insert with check (auth.uid() = id);
create policy "users_update_own" on users for update using (auth.uid() = id);

-- zones: own rows only
create policy "zones_select_own" on zones for select using (auth.uid() = user_id);
create policy "zones_insert_own" on zones for insert with check (auth.uid() = user_id);
create policy "zones_update_own" on zones for update using (auth.uid() = user_id);
create policy "zones_delete_own" on zones for delete using (auth.uid() = user_id);

-- articles: any authenticated user can read; only service role can write
create policy "articles_select_authed" on articles for select using (auth.role() = 'authenticated');

-- user_saves: own rows only
create policy "saves_select_own" on user_saves for select using (auth.uid() = user_id);
create policy "saves_insert_own" on user_saves for insert with check (auth.uid() = user_id);
create policy "saves_delete_own" on user_saves for delete using (auth.uid() = user_id);

-- user_tracks: own rows only
create policy "tracks_select_own" on user_tracks for select using (auth.uid() = user_id);
create policy "tracks_insert_own" on user_tracks for insert with check (auth.uid() = user_id);
create policy "tracks_delete_own" on user_tracks for delete using (auth.uid() = user_id);

-- zone_quicklook: any authenticated user can read; only service role can write
create policy "quicklook_select_authed" on zone_quicklook for select using (auth.role() = 'authenticated');
