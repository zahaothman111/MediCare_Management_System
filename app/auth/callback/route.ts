import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Get user profile to determine redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      // Check if doctor needs to complete profile
      if (profile?.role === 'doctor') {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', data.user.id)
          .single()

        if (!doctor) {
          // Redirect to complete doctor profile
          return NextResponse.redirect(`${origin}/doctor/complete-profile`)
        }
        return NextResponse.redirect(`${origin}/doctor`)
      }

      // Check if patient needs to complete profile
      if (profile?.role === 'patient') {
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', data.user.id)
          .single()

        if (!patient) {
          // Create patient record
          await supabase.from('patients').insert({
            user_id: data.user.id,
          })
        }
        return NextResponse.redirect(`${origin}/patient`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/error`)
}
