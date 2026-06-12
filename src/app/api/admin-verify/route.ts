import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { uid } = await req.json()
  const isAdmin = uid === process.env.NEXT_PUBLIC_ADMIN_UID
  return NextResponse.json({ isAdmin })
}
