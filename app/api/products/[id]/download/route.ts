import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: product } = await admin
    .from('products')
    .select('document_path, name')
    .eq('id', id)
    .single()

  if (!product?.document_path) {
    return NextResponse.json({ error: '첨부 문서가 없습니다.' }, { status: 404 })
  }

  const { data, error } = await admin.storage
    .from('documents')
    .createSignedUrl(product.document_path, 60 * 10) // 10분 유효

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: '다운로드 링크 생성 실패' }, { status: 500 })
  }

  const filename = product.document_path.split('/').pop() ?? `${product.name}.pdf`

  return NextResponse.json({ url: data.signedUrl, filename })
}
