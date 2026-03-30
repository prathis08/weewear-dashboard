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
    const { images, ...rest } = body
    const {
      name,
      description,
      price,
      original_price,
      gender,
      category,
      sizes,
      stock,
      sizes_stock,
      size_chart_url,
      image_url,
    } = rest

    const result = await query(
      `INSERT INTO products
        (name, description, price, original_price, gender, category, sizes, stock, sizes_stock, size_chart_url, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        name,
        description || null,
        price,
        original_price || null,
        gender || null,
        category || null,
        sizes || [],
        stock || 0,
        JSON.stringify(sizes_stock || {}),
        size_chart_url || null,
        image_url || null,
      ]
    )

    const product = result.rows[0]
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await query(
          'INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3)',
          [product.id, images[i].url, i]
        )
      }
    }

    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    console.error('POST /api/products error:', err)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
