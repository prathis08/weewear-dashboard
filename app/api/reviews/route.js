import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(`
      SELECT
        r.id,
        r.rating,
        r.body,
        r.created_at,
        p.id   AS product_id,
        p.name AS product_name,
        u.id   AS user_id,
        u.name AS user_name,
        u.email AS user_email
      FROM reviews r
      JOIN products p ON p.id = r.product_id
      JOIN users    u ON u.id = r.user_id
      ORDER BY r.created_at DESC
    `)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('GET /api/reviews error:', err)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
