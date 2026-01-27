import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BookAppointmentForm } from '@/components/patient/book-appointment-form'

export default async function BookAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: doctor } = await supabase
    .from('doctors')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('id', id)
    .single()

  if (!doctor) notFound()

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!patient) {
    // Create patient record if it doesn't exist
    const { data: newPatient } = await supabase
      .from('patients')
      .insert({ user_id: user.id })
      .select('id')
      .single()

    if (!newPatient) redirect('/patient')
    
    return (
      <div className="p-4 md:p-6">
        <BookAppointmentForm doctor={doctor} patientId={newPatient.id} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <BookAppointmentForm doctor={doctor} patientId={patient.id} />
    </div>
  )
}
