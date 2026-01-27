import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Calendar, FileText, Clock, ArrowLeft, Stethoscope } from 'lucide-react'

export default async function PatientDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  // Get upcoming appointments
  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select(`
      *,
      doctor:doctors(
        *,
        profile:profiles(*)
      )
    `)
    .eq('patient_id', patient?.id || '')
    .in('status', ['pending', 'confirmed'])
    .gte('appointment_date', new Date().toISOString().split('T')[0])
    .order('appointment_date', { ascending: true })
    .limit(3)

  // Get recent prescriptions
  const { data: recentPrescriptions } = await supabase
    .from('prescriptions')
    .select(`
      *,
      doctor:doctors(
        profile:profiles(full_name)
      )
    `)
    .eq('patient_id', patient?.id || '')
    .order('created_at', { ascending: false })
    .limit(3)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-l from-primary/10 to-primary/5 rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">
          مرحباً، {profile?.full_name?.split(' ')[0] || 'عزيزي المريض'}
        </h1>
        <p className="text-muted-foreground">
          كيف يمكننا مساعدتك اليوم؟
        </p>
        <div className="flex gap-3 mt-4">
          <Button asChild>
            <Link href="/patient/doctors">
              <Stethoscope className="w-4 h-4 ml-2" />
              احجز موعد
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/patient/appointments">
              <Calendar className="w-4 h-4 ml-2" />
              مواعيدي
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingAppointments?.length || 0}</p>
              <p className="text-xs text-muted-foreground">مواعيد قادمة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recentPrescriptions?.length || 0}</p>
              <p className="text-xs text-muted-foreground">وصفات طبية</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">المواعيد القادمة</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/patient/appointments" className="gap-1">
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingAppointments && upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        د. {appointment.doctor?.profile?.full_name || 'غير محدد'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.doctor?.specialty || 'طب عام'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(appointment.appointment_date).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{appointment.appointment_time}</span>
                    </div>
                    <Badge className={`mt-1 ${statusColors[appointment.status]}`}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد مواعيد قادمة</p>
              <Button asChild className="mt-4 bg-transparent" variant="outline">
                <Link href="/patient/doctors">احجز موعد الآن</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Prescriptions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">الوصفات الأخيرة</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/patient/prescriptions" className="gap-1">
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentPrescriptions && recentPrescriptions.length > 0 ? (
            <div className="space-y-3">
              {recentPrescriptions.map((prescription) => (
                <Link
                  key={prescription.id}
                  href={`/patient/prescriptions/${prescription.id}`}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{prescription.diagnosis}</p>
                      <p className="text-sm text-muted-foreground">
                        د. {prescription.doctor?.profile?.full_name || 'غير محدد'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(prescription.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد وصفات طبية</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
