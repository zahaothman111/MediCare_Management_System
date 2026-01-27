'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Clock, Calendar, Star } from 'lucide-react'
import type { Doctor, Profile } from '@/lib/types'

interface DoctorWithProfile extends Doctor {
  profile: Profile
}

const specialties = [
  'الكل',
  'طب عام',
  'طب الأطفال',
  'طب النساء والتوليد',
  'طب القلب',
  'طب العيون',
  'طب الأسنان',
  'طب الجلدية',
  'طب العظام',
  'طب الأعصاب',
  'طب الباطنية',
  'الطب النفسي',
  'جراحة عامة',
]

export function DoctorsList({ doctors }: { doctors: DoctorWithProfile[] }) {
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('الكل')

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(search.toLowerCase())
    const matchesSpecialty = specialty === 'الكل' || doctor.specialty === specialty
    return matchesSearch && matchesSpecialty
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن طبيب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="التخصص" />
          </SelectTrigger>
          <SelectContent>
            {specialties.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => {
            const initials = doctor.profile?.full_name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2) || 'د'

            return (
              <Card key={doctor.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={doctor.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">د. {doctor.profile?.full_name}</h3>
                        <Badge variant="secondary" className="mt-1">
                          {doctor.specialty}
                        </Badge>
                        <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>4.8</span>
                          <span className="mx-1">•</span>
                          <span>120+ مريض</span>
                        </div>
                      </div>
                    </div>

                    {doctor.bio && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {doctor.bio}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {doctor.working_hours_start} - {doctor.working_hours_end}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{doctor.available_days?.length || 0} أيام</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div>
                        <span className="text-lg font-bold text-primary">
                          {doctor.consultation_fee}
                        </span>
                        <span className="text-sm text-muted-foreground mr-1">ريال</span>
                      </div>
                      <Button asChild>
                        <Link href={`/patient/doctors/${doctor.id}/book`}>
                          احجز موعد
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">لا يوجد أطباء</h3>
            <p className="text-sm text-muted-foreground">
              جرب تغيير معايير البحث
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
