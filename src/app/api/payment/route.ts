import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const { orderId } = await req.json()
  return NextResponse.json({ status: 'pending', whatsapp: 'https://wa.me/243840021963', orderId })
}
