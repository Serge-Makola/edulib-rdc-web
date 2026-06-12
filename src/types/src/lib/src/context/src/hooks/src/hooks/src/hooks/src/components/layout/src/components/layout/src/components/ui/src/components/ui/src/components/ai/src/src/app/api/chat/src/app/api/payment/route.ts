import { NextRequest, NextResponse } from 'next/server'

// Route préparée pour Maishapay — à compléter lors de l'intégration
export async function POST(req: NextRequest) {
  try {
    const { amount, orderId, customerEmail, customerName } = await req.json()

    // TODO: Intégrer l'API Maishapay ici
    // const response = await fetch('https://api.maishapay.net/v1/payments', { ... })

    return NextResponse.json({
      status: 'pending',
      message: 'Paiement en cours de configuration — contactez-nous sur WhatsApp',
      whatsapp: 'https://wa.me/243840021963',
      orderId,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
