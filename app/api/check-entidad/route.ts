import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const { data } = await supabase.from('entidades').select('id').eq('id', id).single()
  return NextResponse.json({ exists: !!data })
}