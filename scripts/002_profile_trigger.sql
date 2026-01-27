-- Trigger to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'patient')
  )
  on conflict (id) do nothing;

  -- If user is a doctor, create doctor profile
  if coalesce(new.raw_user_meta_data ->> 'role', 'patient') = 'doctor' then
    insert into public.doctors (id, specialty)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'specialty', 'عام')
    )
    on conflict (id) do nothing;
  else
    -- If user is a patient, create patient profile
    insert into public.patients (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
