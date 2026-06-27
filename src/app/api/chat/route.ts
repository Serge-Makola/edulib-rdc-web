import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.MISTRAL_API_KEY },
      body: JSON.stringify({ model: 'mistral-large-latest', messages, max_tokens: 2000, temperature: 0.3 }),
    })
    const data = await response.json()
    return NextResponse.json({ content: data.choices?.[0]?.message?.content ?? '' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
