create table if not exists hall_of_shame (
  id uuid primary key default gen_random_uuid(),
  idea_excerpt text not null,
  roast_excerpt text not null,
  score integer not null check (score >= 1 and score <= 10),
  verdict text not null,
  created_at timestamptz default now()
);

alter table hall_of_shame enable row level security;

drop policy if exists "anon insert" on hall_of_shame;
drop policy if exists "anon select" on hall_of_shame;

create policy "anon insert" on hall_of_shame for insert to anon with check (true);
create policy "anon select" on hall_of_shame for select to anon using (true);
