import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM products ORDER BY created_at DESC'
    )
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('GET /api/products error:', err)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
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
      `INSERT INTO products
        (name, description, price, original_price, category, sizes, stock, image_url, rating, review_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      ]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err) {
    console.error('POST /api/products error:', err)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
