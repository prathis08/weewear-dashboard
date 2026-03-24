import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM coupons ORDER BY created_at DESC'
    )
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('GET /api/coupons error:', err)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      code,
      discount_type,
      discount_value,
      min_order_value,
      max_uses,
      expires_at,
      is_active,
    } = body

    const upperCode = (code || '').toUpperCase().trim()

    if (!upperCode) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO coupons
        (code, discount_type, discount_value, min_order_value, max_uses, expires_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        upperCode,
        discount_type || 'percentage',
        discount_value || 0,
        min_order_value || 0,
        max_uses || null,
        expires_at || null,
        is_active !== undefined ? is_active : true,
      ]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err) {
    console.error('POST /api/coupons error:', err)
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}
