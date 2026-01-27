import { createClient } from '@/lib/supabase/server'
import { DoctorsList } from '@/components/patient/doctors-list'

export default async function DoctorsPage() {
  const supabase = await createClient()

  const { data: doctors } = await supabase
    .from('doctors')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">الأطباء المتاحون</h1>
        <p className="text-muted-foreground mt-1">اختر الطبيب المناسب واحجز موعدك</p>
      </div>
      
      <DoctorsList doctors={doctors || []} />
    </div>
  )
}
