import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
    const userQuery = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : ''

    const response = await fetch('https://api.mistral.ai/v1/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.MISTRAL_API_KEY,
      },
      body: JSON.stringify({
        agent_id: process.env.MISTRAL_AGENT_ID,
        inputs: userQuery,
      }),
    })

    const data = await response.json()
    return NextResponse.json({
      debug_agent_id_present: !!process.env.MISTRAL_AGENT_ID,
      debug_api_key_present: !!process.env.MISTRAL_API_KEY,
      debug_status: response.status,
      raw: data,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
