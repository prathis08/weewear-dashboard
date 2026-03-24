import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const sessionToken = process.env.ADMIN_SESSION_TOKEN
    const response = NextResponse.json({ ok: true })
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
