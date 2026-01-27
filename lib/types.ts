export type UserRole = 'patient' | 'doctor';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialty: string;
  license_number: string;
  bio: string | null;
  consultation_fee: number;
  available_days: string[];
  working_hours_start: string;
  working_hours_end: string;
  is_available: boolean;
  created_at: string;
  profile?: Profile;
}

export interface Patient {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  blood_type: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  patient?: Patient & { profile: Profile };
  doctor?: Doctor & { profile: Profile };
}

export interface Prescription {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  diagnosis: string;
  notes: string | null;
  created_at: string;
  items?: PrescriptionItem[];
  doctor?: Doctor & { profile: Profile };
  patient?: Patient & { profile: Profile };
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  record_type: string;
  title: string;
  description: string | null;
  file_url: string | null;
  created_at: string;
  doctor?: Doctor & { profile: Profile };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'appointment' | 'prescription' | 'general';
  is_read: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}
