CREATE TABLE IF NOT EXISTS submissions (
  id            serial primary key,
  type          text        not null check (type in ('suggestion', 'feedback')),
  camp_name     text,
  camp_url      text,
  notes         text,
  created_at    timestamptz not null default now(),
  scrape_status text        check (scrape_status in ('pending', 'found', 'not_found')),
  scraped_at    timestamptz
);

-- Migration for existing databases (run once in Neon SQL editor):
-- ALTER TABLE submissions ADD COLUMN IF NOT EXISTS scrape_status text CHECK (scrape_status IN ('pending', 'found', 'not_found'));
-- ALTER TABLE submissions ADD COLUMN IF NOT EXISTS scraped_at timestamptz;
