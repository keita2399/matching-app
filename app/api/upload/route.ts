import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const uid = formData.get('uid') as string

  if (!file || !uid) {
    return NextResponse.json({ error: 'file and uid are required' }, { status: 400 })
  }

  const blob = await put(`avatars/${uid}`, file, {
    access: 'public',
    contentType: file.type,
  })

  return NextResponse.json({ url: blob.url })
}
