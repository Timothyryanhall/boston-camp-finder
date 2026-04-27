CREATE TABLE IF NOT EXISTS submissions (
  id         serial primary key,
  type       text        not null check (type in ('suggestion', 'feedback')),
  camp_name  text,
  camp_url   text,
  notes      text,
  created_at timestamptz not null default now()
);
