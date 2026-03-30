import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM categories ORDER BY gender NULLS LAST, name ASC'
    )
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('GET /api/categories error:', err)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, gender } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const result = await query(
      'INSERT INTO categories (name, gender) VALUES ($1, $2) RETURNING *',
      [name.trim(), gender || null]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'A category with this name and gender already exists' }, { status: 409 })
    }
    console.error('POST /api/categories error:', err)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
