import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { FileText, Calendar, ArrowLeft } from 'lucide-react'

export default async function PrescriptionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!patient) redirect('/patient')

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select(`
      *,
      doctor:doctors(
        profile:profiles(full_name)
      ),
      items:prescription_items(*)
    `)
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الوصفات الطبية</h1>
        <p className="text-muted-foreground mt-1">جميع الوصفات الطبية الخاصة بك</p>
      </div>

      {prescriptions && prescriptions.length > 0 ? (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <Link
              key={prescription.id}
              href={`/patient/prescriptions/${prescription.id}`}
            >
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{prescription.diagnosis}</h3>
                        <p className="text-sm text-muted-foreground">
                          د. {prescription.doctor?.profile?.full_name || 'غير محدد'}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(prescription.created_at).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {prescription.items?.length || 0} أدوية
                      </span>
                      <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">لا توجد وصفات طبية</h3>
            <p className="text-sm text-muted-foreground">
              ستظهر هنا الوصفات الطبية التي يصفها لك الأطباء
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
