'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function ProductForm({ product }) {
  const router = useRouter()
  const isEdit = !!product
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    original_price: product?.original_price || '',
    gender: product?.gender || '',
    category: product?.category || '',
    rating: product?.rating ?? '',
    review_count: product?.review_count ?? '',
  })

  // Per-size stock entries: [{ size: 'S', stock: '10' }, ...]
  const [sizeEntries, setSizeEntries] = useState(() => {
    const ss = product?.sizes_stock
    if (ss && typeof ss === 'object' && Object.keys(ss).length > 0) {
      return Object.entries(ss).map(([size, stock]) => ({ size, stock: String(stock) }))
    }
    if (Array.isArray(product?.sizes) && product.sizes.length > 0) {
      return product.sizes.map((size) => ({ size, stock: '' }))
    }
    return [{ size: '', stock: '' }]
  })

  const [sizeChart, setSizeChart] = useState({
    url: product?.size_chart_url || '',
    public_id: null,
  })
  const [uploadingSizeChart, setUploadingSizeChart] = useState(false)
  const sizeChartInputRef = useRef(null)

  // Each image: { url, public_id (null for existing DB images), dbId (null for new uploads) }
  const [images, setImages] = useState(() => {
    if (product?.images?.length) {
      return product.images.map(img => ({ url: img.url, public_id: null, dbId: img.id }))
    }
    if (product?.image_url) {
      return [{ url: product.image_url, public_id: null, dbId: null }]
    }
    return []
  })

  const [allCategories, setAllCategories] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setAllCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Categories filtered by selected gender: show gender-specific + unspecified (null gender)
  const filteredCategories = allCategories.filter(
    (c) => !c.gender || !form.gender || c.gender === form.gender
  )

  function handleChange(e) {
    const { name, value } = e.target
    // When gender changes, reset category if it's no longer valid
    if (name === 'gender') {
      setForm((prev) => {
        const stillValid = allCategories.some(
          (c) => c.name === prev.category && (!c.gender || !value || c.gender === value)
        )
        return { ...prev, gender: value, category: stillValid ? prev.category : '' }
      })
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  function updateSizeEntry(index, field, value) {
    setSizeEntries((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  function addSizeEntry() {
    setSizeEntries((prev) => [...prev, { size: '', stock: '' }])
  }

  function removeSizeEntry(index) {
    setSizeEntries((prev) =>
      prev.length === 1 ? [{ size: '', stock: '' }] : prev.filter((_, i) => i !== index)
    )
  }

  async function handleSizeChartChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingSizeChart(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setSizeChart({ url: data.url, public_id: data.public_id })
    } catch {
      setError('Size chart upload failed. Please try again.')
    } finally {
      setUploadingSizeChart(false)
      e.target.value = ''
    }
  }

  async function handleRemoveSizeChart() {
    if (sizeChart.public_id) {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: sizeChart.public_id }),
      })
    }
    setSizeChart({ url: '', public_id: null })
  }

  async function handleFilesChange(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    setError('')

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          const res = await fetch('/api/upload', { method: 'POST', body: formData })
          if (!res.ok) throw new Error('Upload failed')
          const data = await res.json()
          return { url: data.url, public_id: data.public_id, dbId: null }
        })
      )
      setImages((prev) => [...prev, ...uploaded])
    } catch {
      setError('One or more images failed to upload. Please try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleRemoveImage(index) {
    const img = images[index]
    if (img.public_id) {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: img.public_id }),
      })
    }
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const validEntries = sizeEntries.filter((e) => e.size.trim())
    const sizes_stock = {}
    validEntries.forEach((e) => {
      sizes_stock[e.size.trim()] = parseInt(e.stock, 10) || 0
    })
    const sizes = Object.keys(sizes_stock)
    const stock = Object.values(sizes_stock).reduce((sum, s) => sum + s, 0)

    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      gender: form.gender || null,
      category: form.category || null,
      sizes,
      stock,
      sizes_stock,
      size_chart_url: sizeChart.url || null,
      image_url: images[0]?.url || null,
      rating: form.rating !== '' ? parseFloat(form.rating) : 0,
      review_count: form.review_count !== '' ? parseInt(form.review_count, 10) : 0,
      images: images.map((img, i) => ({ url: img.url, position: i })),
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
            Gender
          </label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select gender</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Unisex">Unisex</option>
          </select>
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
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sizes &amp; Stock
          </label>

          <div className="space-y-2">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_1fr_32px] gap-2 px-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stock</span>
              <span />
            </div>

            {sizeEntries.map((entry, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
                <input
                  type="text"
                  value={entry.size}
                  onChange={(e) => updateSizeEntry(index, 'size', e.target.value.toUpperCase())}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. S, M, 30"
                />
                <input
                  type="number"
                  value={entry.stock}
                  onChange={(e) => updateSizeEntry(index, 'stock', e.target.value)}
                  min="0"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => removeSizeEntry(index)}
                  className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove size"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              onClick={addSizeEntry}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add another size
            </button>

            {sizeEntries.some((e) => e.size.trim()) && (
              <span className="text-xs text-gray-500">
                Total stock:{' '}
                <span className="font-semibold text-gray-700">
                  {sizeEntries.reduce((sum, e) => sum + (parseInt(e.stock, 10) || 0), 0)}
                </span>
              </span>
            )}
          </div>
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

        {/* Size chart */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Size Chart
          </label>

          {sizeChart.url ? (
            <div className="mb-3">
              <div className="relative inline-block rounded-lg overflow-hidden border border-gray-200 group">
                <Image
                  src={sizeChart.url}
                  alt="Size chart"
                  width={320}
                  height={200}
                  className="object-contain max-h-48 w-auto"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={handleRemoveSizeChart}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove size chart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Hover to remove</p>
            </div>
          ) : null}

          <input
            ref={sizeChartInputRef}
            type="file"
            accept="image/*"
            onChange={handleSizeChartChange}
            disabled={uploadingSizeChart}
            className="hidden"
          />
          {!sizeChart.url && (
            <button
              type="button"
              onClick={() => sizeChartInputRef.current?.click()}
              disabled={uploadingSizeChart}
              className="inline-flex items-center gap-2 border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {uploadingSizeChart ? 'Uploading...' : 'Upload size chart'}
            </button>
          )}
          {sizeChart.url && (
            <button
              type="button"
              onClick={() => sizeChartInputRef.current?.click()}
              disabled={uploadingSizeChart}
              className="inline-flex items-center gap-2 border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploadingSizeChart ? 'Uploading...' : 'Replace size chart'}
            </button>
          )}
        </div>

        {/* Multi-image section */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Photos
            {images.length > 0 && (
              <span className="text-gray-400 font-normal ml-1">
                — first image is the primary
              </span>
            )}
          </label>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((img, index) => (
                <div key={img.url + index} className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-200 group flex-shrink-0">
                  <Image
                    src={img.url}
                    alt={`Product photo ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                      Primary
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Remove photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            disabled={uploading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {uploading ? 'Uploading...' : images.length === 0 ? 'Add photos' : 'Add more photos'}
          </button>
          {uploading && (
            <p className="text-xs text-blue-600 mt-1">Uploading, please wait...</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading || uploadingSizeChart}
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
