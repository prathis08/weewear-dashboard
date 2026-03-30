import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const result = await query('SELECT * FROM products WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const imagesResult = await query(
      'SELECT id, url, position FROM product_images WHERE product_id = $1 ORDER BY position ASC',
      [id]
    )

    return NextResponse.json({ ...result.rows[0], images: imagesResult.rows })
  } catch (err) {
    console.error('GET /api/products/[id] error:', err)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { images, ...rest } = body
    const result = await query(
      `UPDATE products SET
        name = $1,
        description = $2,
        price = $3,
        original_price = $4,
        gender = $5,
        category = $6,
        sizes = $7,
        stock = $8,
        sizes_stock = $9,
        size_chart_url = $10,
        image_url = $11
       WHERE id = $12
       RETURNING *`,
      [
        rest.name,
        rest.description || null,
        rest.price,
        rest.original_price || null,
        rest.gender || null,
        rest.category || null,
        rest.sizes || [],
        rest.stock || 0,
        JSON.stringify(rest.sizes_stock || {}),
        rest.size_chart_url || null,
        rest.image_url || null,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await query('DELETE FROM product_images WHERE product_id = $1', [id])
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await query(
          'INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3)',
          [id, images[i].url, i]
        )
      }
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
