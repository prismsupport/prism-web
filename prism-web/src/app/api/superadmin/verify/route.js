import { NextResponse } from 'next/server'

export async function POST(request) {
  const { email } = await request.json()

  const isSuperadmin =
    email?.toLowerCase() === process.env.SUPERADMIN_EMAIL?.toLowerCase()

  return NextResponse.json({ isSuperadmin })
}