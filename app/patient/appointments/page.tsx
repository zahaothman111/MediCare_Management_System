import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { Calendar, Clock, Stethoscope, Plus } from 'lucide-react'
import { CancelAppointmentButton } from '@/components/patient/cancel-appointment-button'

export default async function AppointmentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!patient) redirect('/patient')

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      doctor:doctors(
        *,
        profile:profiles(*)
      )
    `)
    .eq('patient_id', patient.id)
    .order('appointment_date', { ascending: false })

  const upcomingAppointments = appointments?.filter(
    (a) =>
      (a.status === 'pending' || a.status === 'confirmed') &&
      new Date(a.appointment_date) >= new Date(new Date().toDateString())
  ) || []

  const pastAppointments = appointments?.filter(
    (a) =>
      a.status === 'completed' ||
      a.status === 'cancelled' ||
      new Date(a.appointment_date) < new Date(new Date().toDateString())
  ) || []

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

  const AppointmentCard = ({ appointment }: { appointment: typeof appointments extends (infer T)[] | null ? T : never }) => {
    if (!appointment) return null
    
    const doctor = appointment.doctor as { profile: { full_name: string; avatar_url: string | null }; specialty: string } | null
    const initials = doctor?.profile?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2) || 'د'

    const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed'

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={doctor?.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">
                    د. {doctor?.profile?.full_name || 'غير محدد'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {doctor?.specialty || 'طب عام'}
                  </p>
                </div>
                <Badge className={statusColors[appointment.status]}>
                  {statusLabels[appointment.status]}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(appointment.appointment_date).toLocaleDateString('ar-SA')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{appointment.appointment_time}</span>
                </div>
              </div>

              {appointment.notes && (
                <p className="mt-2 text-sm bg-muted/50 p-2 rounded">
                  {appointment.notes}
                </p>
              )}

              {canCancel && (
                <div className="mt-3">
                  <CancelAppointmentButton appointmentId={appointment.id} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المواعيد</h1>
          <p className="text-muted-foreground mt-1">إدارة مواعيدك الطبية</p>
        </div>
        <Button asChild>
          <Link href="/patient/doctors">
            <Plus className="w-4 h-4 ml-2" />
            حجز موعد
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            القادمة ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            السابقة ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-1">لا توجد مواعيد قادمة</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  احجز موعدك الآن مع أحد الأطباء المتاحين
                </p>
                <Button asChild>
                  <Link href="/patient/doctors">
                    <Stethoscope className="w-4 h-4 ml-2" />
                    تصفح الأطباء
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-4">
          {pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-1">لا توجد مواعيد سابقة</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
