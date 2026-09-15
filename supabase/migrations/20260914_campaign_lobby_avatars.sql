create table if not exists public.campaign_lobby_avatars (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  seat_index smallint not null check (seat_index between 0 and 13),
  display_name text not null check (char_length(display_name) between 1 and 60),
  race_key text not null default '',
  class_key text not null default '',
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id),
  unique (room_id, seat_index)
);

create index if not exists campaign_lobby_avatars_character_idx
  on public.campaign_lobby_avatars(character_id);

alter table public.campaign_lobby_avatars enable row level security;
revoke all on public.campaign_lobby_avatars from anon;
grant select, insert, update, delete on public.campaign_lobby_avatars to authenticated;

create policy lobby_avatars_read_members on public.campaign_lobby_avatars
  for select to authenticated using (
    exists (select 1 from public.room_members m
      where m.room_id = campaign_lobby_avatars.room_id
        and m.user_id = (select auth.uid()) and m.status = 'active')
  );

create policy lobby_avatars_insert_own on public.campaign_lobby_avatars
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.room_members m
      where m.room_id = campaign_lobby_avatars.room_id and m.user_id = (select auth.uid())
        and m.status = 'active' and m.role in ('player', 'owner'))
    and exists (select 1 from public.characters c
      where c.id = character_id and c.user_id = (select auth.uid()))
  );

create policy lobby_avatars_update_own on public.campaign_lobby_avatars
  for update to authenticated using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.room_members m
      where m.room_id = campaign_lobby_avatars.room_id and m.user_id = (select auth.uid())
        and m.status = 'active' and m.role in ('player', 'owner'))
    and exists (select 1 from public.characters c
      where c.id = character_id and c.user_id = (select auth.uid()))
  );

create policy lobby_avatars_delete_own on public.campaign_lobby_avatars
  for delete to authenticated using (user_id = (select auth.uid()));
