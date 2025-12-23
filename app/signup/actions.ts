'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@afcon.local`
}

export async function signup(formData: FormData): Promise<void> {
  const fullName = String(formData.get('full_name') || '').trim()
  const username = String(formData.get('username') || '').trim()
  const password = String(formData.get('password') || '')

  if (!fullName || !username || !password) redirect('/signup?error=missing')

  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password,
    options: { data: { full_name: fullName, username } },
  })

  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`)

  // if email confirmation is ON, session may be null → go login
  if (!data.session) redirect('/login')

  revalidatePath('/', 'layout')
  redirect('/predictions')
}
