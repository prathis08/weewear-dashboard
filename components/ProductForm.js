'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function ProductForm({ product }) {
  const router = useRouter()
  const isEdit = !!product

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    original_price: product?.original_price || '',
    category: product?.category || '',
    sizes: Array.isArray(product?.sizes) ? product.sizes.join(',') : (product?.sizes || ''),
    stock: product?.stock ?? '',
    image_url: product?.image_url || '',
    rating: product?.rating ?? '',
    review_count: product?.review_count ?? '',
  })

  const [uploading, setUploading] = useState(false)
  const [imagePublicId, setImagePublicId] = useState('')
  const [imagePreview, setImagePreview] = useState(product?.image_url || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      const data = await res.json()
      setForm((prev) => ({ ...prev, image_url: data.url }))
      setImagePreview(data.url)
      setImagePublicId(data.public_id || '')
    } catch {
      setError('Image upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    // Parse sizes: comma-separated string -> array, filter empty strings
    const sizesArray = form.sizes
      ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      category: form.category || null,
      sizes: sizesArray,
      stock: form.stock !== '' ? parseInt(form.stock, 10) : 0,
      image_url: form.image_url || null,
      rating: form.rating !== '' ? parseFloat(form.rating) : 0,
      review_count: form.review_count !== '' ? parseInt(form.review_count, 10) : 0,
    }

    try {
      const url = isEdit ? `/api/products/${product.id}` : '/api/products'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save product')
      }

      router.push('/products')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Classic Cotton T-Shirt"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Product description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="999.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Original Price (₹)
          </label>
          <input
            type="number"
            name="original_price"
            value={form.original_price}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1499.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select category</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock
          </label>
          <input
            type="number"
            name="stock"
            value={form.stock}
            onChange={handleChange}
            min="0"
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sizes
            <span className="text-gray-400 font-normal ml-1">(comma-separated, e.g. S,M,L,XL or 28,30,32)</span>
          </label>
          <input
            type="text"
            name="sizes"
            value={form.sizes}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="S,M,L,XL"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rating
            <span className="text-gray-400 font-normal ml-1">(0–5)</span>
          </label>
          <input
            type="number"
            name="rating"
            value={form.rating}
            onChange={handleChange}
            min="0"
            max="5"
            step="0.1"
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="4.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Review Count
          </label>
          <input
            type="number"
            name="review_count"
            value={form.review_count}
            onChange={handleChange}
            min="0"
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Image
          </label>

          {imagePreview && (
            <div className="mb-3">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 group">
                <Image
                  src={imagePreview}
                  alt="Product preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (imagePublicId) {
                      await fetch('/api/upload', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ public_id: imagePublicId }),
                      })
                      setImagePublicId('')
                    }
                    setImagePreview('')
                    setForm((prev) => ({ ...prev, image_url: '' }))
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Hover to remove</p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 focus:outline-none"
          />

          {uploading && (
            <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
          )}

          {form.image_url && !uploading && (
            <p className="text-xs text-gray-500 mt-1 truncate">{form.image_url}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/products')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
