'use client'

import { useState } from 'react'

export default function CouponForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_value: '0',
    max_uses: '',
    expires_at: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleCodeChange(e) {
    setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value) || 0,
      min_order_value: parseFloat(form.min_order_value) || 0,
      max_uses: form.max_uses !== '' ? parseInt(form.max_uses, 10) : null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    }

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create coupon')
      }

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">New Coupon</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleCodeChange}
              required
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              placeholder="SUMMER20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <select
              name="discount_type"
              value={form.discount_type}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Value <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="discount_value"
              value={form.discount_value}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={form.discount_type === 'percentage' ? '20' : '100'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Order Value (₹)
            </label>
            <input
              type="number"
              name="min_order_value"
              value={form.min_order_value}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Uses
              <span className="text-gray-400 font-normal ml-1">(leave blank for unlimited)</span>
            </label>
            <input
              type="number"
              name="max_uses"
              value={form.max_uses}
              onChange={handleChange}
              min="1"
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Unlimited"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires At
              <span className="text-gray-400 font-normal ml-1">(leave blank for never)</span>
            </label>
            <input
              type="datetime-local"
              name="expires_at"
              value={form.expires_at}
              onChange={handleChange}
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {saving ? 'Creating...' : 'Create Coupon'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
