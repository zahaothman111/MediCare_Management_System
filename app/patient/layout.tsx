import React from "react"
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PatientNav } from '@/components/patient/patient-nav'

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'patient') {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientNav profile={profile} />
      <main className="pb-20 md:pb-0 md:pr-64">
        {children}
      </main>
    </div>
  )
}
