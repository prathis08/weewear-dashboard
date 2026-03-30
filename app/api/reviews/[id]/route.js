import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    // Fetch the product_id before deleting so we can recalculate
    const { rows } = await query('SELECT product_id FROM reviews WHERE id = $1', [id])
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    const productId = rows[0].product_id

    await query('DELETE FROM reviews WHERE id = $1', [id])

    // Recalculate product rating + review_count
    const agg = await query(
      'SELECT ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*) AS cnt FROM reviews WHERE product_id = $1',
      [productId]
    )
    const { avg_rating, cnt } = agg.rows[0]
    await query(
      'UPDATE products SET rating = $1, review_count = $2 WHERE id = $3',
      [parseFloat(avg_rating) || 0, parseInt(cnt) || 0, productId]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/reviews/[id] error:', err)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}
