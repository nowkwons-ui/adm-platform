import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function verifyAdmin(uid: string | null) {
  if (!uid) return false
  const admin = adminClient()
  const { data } = await admin.auth.admin.getUserById(uid)
  return data.user?.app_metadata?.role === 'ADMIN'
}

export async function GET(req: Request) {
  const uid = new URL(req.url).searchParams.get('uid')
  if (!await verifyAdmin(uid)) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const admin = adminClient()
  const { data, error } = await admin
    .from('products')
    .select('id, name, cas_no, dmf_no, manufacturer, supplier_name, standard, price_info, notes, document_path, status, rejection_reason, created_at, seller_id, profiles(company_name, manager_name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ products: data ?? [] })
}
