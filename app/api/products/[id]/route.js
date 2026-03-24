import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const result = await query('SELECT * FROM products WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('GET /api/products/[id] error:', err)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      name,
      description,
      price,
      original_price,
      category,
      sizes,
      stock,
      image_url,
      rating,
      review_count,
    } = body

    const result = await query(
      `UPDATE products SET
        name = $1,
        description = $2,
        price = $3,
        original_price = $4,
        category = $5,
        sizes = $6,
        stock = $7,
        image_url = $8,
        rating = $9,
        review_count = $10
       WHERE id = $11
       RETURNING *`,
      [
        name,
        description || null,
        price,
        original_price || null,
        category || null,
        sizes || [],
        stock || 0,
        image_url || null,
        rating || 0,
        review_count || 0,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('PUT /api/products/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/products/[id] error:', err)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
