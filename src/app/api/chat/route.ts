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
        agent_id: 'ag_019f32d282ee74c3a7fe0fbcea223667',
        inputs: userQuery,
      }),
    })

    const data = await response.json()

    const messageEntry = data.outputs?.find((o: any) => o.type === 'message.output')
    const contentParts = messageEntry?.content

    let textOutput = ''
    if (typeof contentParts === 'string') {
      textOutput = contentParts
    } else if (Array.isArray(contentParts)) {
      textOutput = contentParts
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('')
    }

    return NextResponse.json({ content: textOutput })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
