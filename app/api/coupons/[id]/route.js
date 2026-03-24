import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const result = await query('DELETE FROM coupons WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/coupons/[id] error:', err)
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { is_active } = body

    const result = await query(
      'UPDATE coupons SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('PATCH /api/coupons/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}
