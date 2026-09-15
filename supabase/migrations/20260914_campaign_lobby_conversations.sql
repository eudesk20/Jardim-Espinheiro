create table if not exists public.campaign_lobby_conversations (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('request', 'accept', 'decline', 'message')),
  body text check (body is null or char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id),
  check ((kind = 'message' and body is not null) or (kind <> 'message' and body is null))
);

create index if not exists campaign_lobby_conversations_room_time_idx
  on public.campaign_lobby_conversations(room_id, created_at desc);

alter table public.campaign_lobby_conversations enable row level security;
revoke all on public.campaign_lobby_conversations from anon;
grant select, insert on public.campaign_lobby_conversations to authenticated;
grant usage, select on sequence public.campaign_lobby_conversations_id_seq to authenticated;

create policy lobby_conversation_read_participants on public.campaign_lobby_conversations
  for select to authenticated using (
    (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()))
    and exists (select 1 from public.room_members m
      where m.room_id = campaign_lobby_conversations.room_id
        and m.user_id = (select auth.uid()) and m.status = 'active'
        and m.role in ('player', 'owner'))
  );

create policy lobby_conversation_send_active on public.campaign_lobby_conversations
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and exists (select 1 from public.room_members m
      where m.room_id = campaign_lobby_conversations.room_id
        and m.user_id = sender_id and m.status = 'active'
        and m.role in ('player', 'owner'))
    and exists (select 1 from public.room_members m
      where m.room_id = campaign_lobby_conversations.room_id
        and m.user_id = recipient_id and m.status = 'active'
        and m.role in ('player', 'owner'))
  );
