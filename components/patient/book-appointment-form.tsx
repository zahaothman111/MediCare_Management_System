'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { ar } from 'date-fns/locale'
import { CalendarIcon, Clock, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { Doctor, Profile } from '@/lib/types'

interface DoctorWithProfile extends Doctor {
  profile: Profile
}

const dayNames: Record<string, string> = {
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
  saturday: 'السبت',
}

const dayNumbers: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = []
  const [startHour] = start.split(':').map(Number)
  const [endHour] = end.split(':').map(Number)

  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }

  return slots
}

export function BookAppointmentForm({
  doctor,
  patientId,
}: {
  doctor: DoctorWithProfile
  patientId: string
}) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const availableDays = doctor.available_days || []
  const timeSlots = generateTimeSlots(
    doctor.working_hours_start || '09:00',
    doctor.working_hours_end || '17:00'
  )

  const isDateDisabled = (dateToCheck: Date) => {
    // Disable past dates
    if (isBefore(dateToCheck, startOfDay(new Date()))) return true
    
    // Disable dates more than 30 days in the future
    if (isBefore(addDays(new Date(), 30), dateToCheck)) return true
    
    // Disable days not in available_days
    const dayName = format(dateToCheck, 'EEEE').toLowerCase()
    return !availableDays.includes(dayName)
  }

  const initials = doctor.profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2) || 'د'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time) {
      setError('يرجى اختيار التاريخ والوقت')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase.from('appointments').insert({
        patient_id: patientId,
        doctor_id: doctor.id,
        appointment_date: format(date, 'yyyy-MM-dd'),
        appointment_time: time,
        notes: notes || null,
        status: 'pending',
      })

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/patient/appointments')
        router.refresh()
      }, 2000)
    } catch {
      setError('حدث خطأ أثناء حجز الموعد. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">تم حجز الموعد بنجاح!</h2>
          <p className="text-muted-foreground">
            سيتم إشعارك عند تأكيد الطبيب للموعد
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowRight className="w-4 h-4" />
        رجوع
      </Button>

      {/* Doctor Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={doctor.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">د. {doctor.profile?.full_name}</h2>
              <Badge variant="secondary">{doctor.specialty}</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                رسوم الاستشارة: {doctor.consultation_fee} ريال
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle>حجز موعد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Available Days Info */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">الأيام المتاحة:</p>
              <div className="flex flex-wrap gap-2">
                {availableDays.map((day) => (
                  <Badge key={day} variant="outline">
                    {dayNames[day] || day}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>اختر التاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-right',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale: ar }) : 'اختر تاريخ الموعد'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={isDateDisabled}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label>اختر الوقت</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر وقت الموعد">
                    {time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {time}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="أضف أي ملاحظات أو أعراض تود إخبار الطبيب بها"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !date || !time}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحجز...
                </>
              ) : (
                'تأكيد الحجز'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
