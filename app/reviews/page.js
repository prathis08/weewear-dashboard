'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import DeleteModal from '@/components/DeleteModal'

function Stars({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-sm ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </span>
      ))}
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')

  async function fetchReviews() {
    try {
      setLoading(true)
      const res = await fetch('/api/reviews')
      if (!res.ok) throw new Error('Failed to fetch reviews')
      setReviews(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReviews() }, [])

  async function confirmDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/reviews/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete review')
      setDeleteTarget(null)
      await fetchReviews()
    } catch (err) {
      setError(err.message)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase()
    return (
      r.product_name.toLowerCase().includes(q) ||
      r.user_name.toLowerCase().includes(q) ||
      r.user_email.toLowerCase().includes(q) ||
      (r.body || '').toLowerCase().includes(q)
    )
  })

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '—'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {deleteTarget && (
        <DeleteModal
          title="Delete this review?"
          description="This will permanently remove the review and recalculate the product's rating."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {!loading && `${reviews.length} review${reviews.length !== 1 ? 's' : ''} · avg ${avgRating} ★`}
            </p>
          </div>
          <input
            type="text"
            placeholder="Search by product, user, or content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none w-72 bg-white"
          />
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 text-sm">Loading…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-400 text-sm">
              {search ? 'No reviews match your search.' : 'No reviews yet.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Review</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((review) => (
                  <tr key={review.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors align-top">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px]">
                      <span className="line-clamp-2">{review.product_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{review.user_name}</p>
                      <p className="text-xs text-gray-400">{review.user_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Stars rating={review.rating} />
                      <span className="text-xs text-gray-500 mt-0.5 block">{review.rating}/5</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      {review.body ? (
                        <p className="line-clamp-3">{review.body}</p>
                      ) : (
                        <span className="text-gray-400 italic text-xs">No text</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(review.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget({ id: review.id })}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
