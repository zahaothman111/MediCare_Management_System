import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowRight, Calendar, Pill, Clock, FileText } from 'lucide-react'

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: prescription } = await supabase
    .from('prescriptions')
    .select(`
      *,
      doctor:doctors(
        specialty,
        profile:profiles(full_name, phone)
      ),
      items:prescription_items(*)
    `)
    .eq('id', id)
    .single()

  if (!prescription) notFound()

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" asChild className="gap-2">
        <Link href="/patient/prescriptions">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Link>
      </Button>

      {/* Prescription Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{prescription.diagnosis}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                د. {prescription.doctor?.profile?.full_name || 'غير محدد'} - {prescription.doctor?.specialty}
              </p>
            </div>
            <Badge variant="secondary">
              <Calendar className="w-3 h-3 ml-1" />
              {new Date(prescription.created_at).toLocaleDateString('ar-SA')}
            </Badge>
          </div>
        </CardHeader>
        {prescription.notes && (
          <CardContent className="pt-0">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {prescription.notes}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="w-5 h-5" />
            الأدوية الموصوفة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescription.items && prescription.items.length > 0 ? (
            <div className="space-y-4">
              {prescription.items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      {item.medication_name}
                    </h4>
                    <Badge variant="outline">{item.dosage}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{item.frequency}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{item.duration}</span>
                    </div>
                  </div>
                  {item.instructions && (
                    <p className="mt-3 text-sm bg-background p-2 rounded">
                      <span className="font-medium">تعليمات: </span>
                      {item.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              لا توجد أدوية في هذه الوصفة
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
