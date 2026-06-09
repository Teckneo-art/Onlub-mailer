import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password === process.env.APP_PASSWORD) {
    return NextResponse.json({ ok: true, token: Buffer.from(password).toString('base64') })
  }
  return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
}
