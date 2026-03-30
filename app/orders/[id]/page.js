'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Sidebar from '@/components/Sidebar'

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_STYLE = {
  pending:    'bg-yellow-100 text-yellow-700',
  paid:       'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
}

function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Field({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setOrder(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleStatusChange(e) {
    const newStatus = e.target.value
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      setOrder((prev) => ({ ...prev, status: newStatus }))
    } catch {
      alert('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const addr = order?.shipping_address

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Back */}
        <button
          onClick={() => router.push('/orders')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Orders
        </button>

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

        {!loading && !error && order && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Order{' '}
                  <span className="font-mono">
                    #{order.order_number || String(order.id).slice(0, 8).toUpperCase()}
                  </span>
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
              </div>

              {/* Status update */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </span>
                <select
                  value={order.status}
                  onChange={handleStatusChange}
                  disabled={updatingStatus}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: items + summary */}
              <div className="lg:col-span-2 space-y-5">
                {/* Items */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-800">
                      Items · {order.items?.length || 0}
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                        {item.product_image ? (
                          <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={item.product_image}
                              alt={item.product_name || ''}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product_name || 'Deleted product'}
                          </p>
                          {item.size && (
                            <p className="text-xs text-gray-400 mt-0.5">Size: {item.size}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-gray-900">
                            ₹{parseFloat(item.price).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-gray-400">× {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-lg shadow-sm px-5 py-4 space-y-2">
                  <h2 className="text-sm font-semibold text-gray-800 mb-3">Summary</h2>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{(parseFloat(order.total || 0) + parseFloat(order.discount || 0)).toLocaleString('en-IN')}</span>
                  </div>
                  {parseFloat(order.discount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        Discount{order.coupon_code && (
                          <span className="ml-1 font-mono text-xs bg-green-50 px-1.5 py-0.5 rounded">
                            {order.coupon_code}
                          </span>
                        )}
                      </span>
                      <span>−₹{parseFloat(order.discount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>₹{parseFloat(order.total || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Right: customer + shipping + payment */}
              <div className="space-y-5">
                {/* Customer */}
                <div className="bg-white rounded-lg shadow-sm px-5 py-4 space-y-3">
                  <h2 className="text-sm font-semibold text-gray-800">Customer</h2>
                  <Field label="Name"  value={order.customer_name} />
                  <Field label="Email" value={order.customer_email} />
                  <Field label="Phone" value={order.customer_phone} />
                </div>

                {/* Shipping address */}
                {addr && (
                  <div className="bg-white rounded-lg shadow-sm px-5 py-4 space-y-3">
                    <h2 className="text-sm font-semibold text-gray-800">Shipping Address</h2>
                    <Field label="Name"     value={addr.name} />
                    <Field label="Phone"    value={addr.phone} />
                    <Field label="Address"  value={[addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')} />
                    <Field label="Email"    value={addr.email} />
                  </div>
                )}

                {/* Payment */}
                <div className="bg-white rounded-lg shadow-sm px-5 py-4 space-y-3">
                  <h2 className="text-sm font-semibold text-gray-800">Payment</h2>
                  <Field label="Razorpay Order ID"   value={order.razorpay_order_id} />
                  <Field label="Razorpay Payment ID" value={order.razorpay_payment_id} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
