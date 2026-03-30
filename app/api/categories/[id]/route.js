import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { name, gender } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const result = await query(
      'UPDATE categories SET name = $1, gender = $2 WHERE id = $3 RETURNING *',
      [name.trim(), gender || null, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'A category with this name and gender already exists' }, { status: 409 })
    }
    console.error('PUT /api/categories/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/categories/[id] error:', err)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
