import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(`
      SELECT
        o.id,
        o.order_number,
        o.razorpay_order_id,
        o.razorpay_payment_id,
        o.status,
        o.total,
        o.discount,
        o.coupon_code,
        o.created_at,
        u.name  AS customer_name,
        u.email AS customer_email,
        COUNT(oi.id)::int AS item_count
      FROM orders o
      LEFT JOIN users u        ON o.user_id  = u.id
      LEFT JOIN order_items oi ON o.id       = oi.order_id
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
    `)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('GET /api/orders error:', err)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
