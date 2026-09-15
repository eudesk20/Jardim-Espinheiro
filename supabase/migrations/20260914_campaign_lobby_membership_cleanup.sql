create or replace function public.cleanup_campaign_lobby_avatar()
returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    delete from public.campaign_lobby_avatars
      where room_id = old.room_id and user_id = old.user_id;
  elsif new.status <> 'active' or new.role not in ('player', 'owner') then
    delete from public.campaign_lobby_avatars
      where room_id = new.room_id and user_id = new.user_id;
  end if;
  return null;
end;
$$;

revoke all on function public.cleanup_campaign_lobby_avatar() from public, anon, authenticated;

create trigger cleanup_campaign_lobby_avatar_on_member
after update of status, role or delete on public.room_members
for each row execute function public.cleanup_campaign_lobby_avatar();
