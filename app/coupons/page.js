'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import CouponForm from '@/components/CouponForm'
import DeleteModal from '@/components/DeleteModal'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, code }
  const [deleting, setDeleting] = useState(false)

  async function fetchCoupons() {
    try {
      setLoading(true)
      const res = await fetch('/api/coupons')
      if (!res.ok) throw new Error('Failed to fetch coupons')
      const data = await res.json()
      setCoupons(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  async function confirmDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/coupons/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete coupon')
      setDeleteTarget(null)
      await fetchCoupons()
    } catch (err) {
      setError(err.message)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggle(coupon) {
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      })
      if (!res.ok) throw new Error('Failed to update coupon')
      await fetchCoupons()
    } catch (err) {
      alert(err.message)
    }
  }

  function handleFormSuccess() {
    setShowForm(false)
    fetchCoupons()
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {deleteTarget && (
        <DeleteModal
          title={`Delete coupon "${deleteTarget.code}"?`}
          description="This action cannot be undone. The coupon will be permanently removed."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Coupons</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {!loading && `${coupons.length} coupon${coupons.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              + Add Coupon
            </button>
          )}
        </div>

        {showForm && (
          <CouponForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}

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

        {!loading && !error && coupons.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-400 text-sm">No coupons yet.</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-block mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Create your first coupon
              </button>
            )}
          </div>
        )}

        {!loading && !error && coupons.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Value</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Min Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Max Uses</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Used</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expires</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{coupon.discount_type}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : `₹${parseFloat(coupon.discount_value).toLocaleString('en-IN')}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {coupon.min_order_value > 0
                        ? `₹${parseFloat(coupon.min_order_value).toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {coupon.max_uses ?? <span className="text-gray-400">Unlimited</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{coupon.used_count ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(coupon.expires_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(coupon)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          coupon.is_active
                            ? 'bg-green-100 hover:bg-green-200 text-green-700'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget({ id: coupon.id, code: coupon.code })}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
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
