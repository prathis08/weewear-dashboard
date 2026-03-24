'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ProductForm from '@/components/ProductForm'

export default function EditProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`)
        if (!res.ok) throw new Error('Product not found')
        const data = await res.json()
        setProduct(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProduct()
  }, [id])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update the product details below.</p>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {!loading && !error && product && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ProductForm product={product} />
          </div>
        )}
      </main>
    </div>
  )
}
