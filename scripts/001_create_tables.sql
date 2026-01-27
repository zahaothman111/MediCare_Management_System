-- Medical App Database Schema

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null check (role in ('patient', 'doctor')),
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Doctor profiles with additional details
create table if not exists public.doctors (
  id uuid primary key references public.profiles(id) on delete cascade,
  specialty text not null,
  bio text,
  license_number text,
  consultation_fee decimal(10, 2) default 0,
  years_of_experience integer default 0,
  available_days text[] default array['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
  working_hours_start time default '09:00',
  working_hours_end time default '17:00',
  is_active boolean default true
);

-- Patient profiles with additional details
create table if not exists public.patients (
  id uuid primary key references public.profiles(id) on delete cascade,
  date_of_birth date,
  gender text check (gender in ('male', 'female')),
  blood_type text,
  allergies text[],
  chronic_conditions text[],
  emergency_contact_name text,
  emergency_contact_phone text
);

-- Appointments table
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  appointment_date date not null,
  appointment_time time not null,
  duration_minutes integer default 30,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  reason text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Prescriptions table
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  diagnosis text,
  notes text,
  created_at timestamp with time zone default now()
);

-- Prescription items (medications)
create table if not exists public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  duration text not null,
  instructions text
);

-- Medical records / history
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  record_type text not null check (record_type in ('diagnosis', 'lab_result', 'imaging', 'procedure', 'note')),
  title text not null,
  description text,
  file_url text,
  created_at timestamp with time zone default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('appointment', 'prescription', 'message', 'system')),
  is_read boolean default false,
  related_id uuid,
  created_at timestamp with time zone default now()
);

-- Messages between patients and doctors
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.medical_records enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;

-- Profiles policies
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Doctors can be viewed by all authenticated users
create policy "doctors_select_all" on public.doctors for select using (auth.uid() is not null);
create policy "doctors_insert_own" on public.doctors for insert with check (auth.uid() = id);
create policy "doctors_update_own" on public.doctors for update using (auth.uid() = id);

-- Patients policies
create policy "patients_select_own" on public.patients for select using (auth.uid() = id);
create policy "patients_insert_own" on public.patients for insert with check (auth.uid() = id);
create policy "patients_update_own" on public.patients for update using (auth.uid() = id);
-- Doctors can view their patients
create policy "patients_select_by_doctor" on public.patients for select using (
  exists (
    select 1 from public.appointments 
    where appointments.patient_id = patients.id 
    and appointments.doctor_id = auth.uid()
  )
);

-- Appointments policies
create policy "appointments_select_own" on public.appointments for select using (
  auth.uid() = patient_id or auth.uid() = doctor_id
);
create policy "appointments_insert_patient" on public.appointments for insert with check (auth.uid() = patient_id);
create policy "appointments_update_involved" on public.appointments for update using (
  auth.uid() = patient_id or auth.uid() = doctor_id
);

-- Prescriptions policies
create policy "prescriptions_select_own" on public.prescriptions for select using (
  auth.uid() = patient_id or auth.uid() = doctor_id
);
create policy "prescriptions_insert_doctor" on public.prescriptions for insert with check (auth.uid() = doctor_id);
create policy "prescriptions_update_doctor" on public.prescriptions for update using (auth.uid() = doctor_id);

-- Prescription items policies
create policy "prescription_items_select" on public.prescription_items for select using (
  exists (
    select 1 from public.prescriptions 
    where prescriptions.id = prescription_items.prescription_id 
    and (prescriptions.patient_id = auth.uid() or prescriptions.doctor_id = auth.uid())
  )
);
create policy "prescription_items_insert_doctor" on public.prescription_items for insert with check (
  exists (
    select 1 from public.prescriptions 
    where prescriptions.id = prescription_items.prescription_id 
    and prescriptions.doctor_id = auth.uid()
  )
);

-- Medical records policies
create policy "medical_records_select_own" on public.medical_records for select using (
  auth.uid() = patient_id or auth.uid() = doctor_id
);
create policy "medical_records_insert_doctor" on public.medical_records for insert with check (auth.uid() = doctor_id);

-- Notifications policies
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);

-- Messages policies
create policy "messages_select_own" on public.messages for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = sender_id);
create policy "messages_update_receiver" on public.messages for update using (auth.uid() = receiver_id);
