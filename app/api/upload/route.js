import { NextResponse } from 'next/server'
import crypto from 'crypto'

const CLOUD_NAME = () => process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = () => process.env.CLOUDINARY_API_KEY
const API_SECRET = () => process.env.CLOUDINARY_API_SECRET

function sign(params) {
  const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
  return crypto.createHash('sha256').update(str + API_SECRET()).digest('hex')
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const timestamp = Math.round(Date.now() / 1000)
    const params = { folder: 'weewear', timestamp }
    const signature = sign(params)

    const bytes = await file.arrayBuffer()
    const blob = new Blob([bytes], { type: file.type || 'image/jpeg' })

    const upload = new FormData()
    upload.append('file', blob, file.name || 'upload.jpg')
    upload.append('folder', 'weewear')
    upload.append('timestamp', timestamp)
    upload.append('api_key', API_KEY())
    upload.append('signature', signature)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME()}/image/upload`,
      { method: 'POST', body: upload }
    )
    const result = await res.json()

    if (!res.ok) {
      console.error('Cloudinary error:', result)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { public_id } = await request.json()
    if (!public_id) {
      return NextResponse.json({ error: 'No public_id provided' }, { status: 400 })
    }

    const timestamp = Math.round(Date.now() / 1000)
    const params = { public_id, timestamp }
    const signature = sign(params)

    const body = new URLSearchParams({ public_id, timestamp, api_key: API_KEY(), signature })
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME()}/image/destroy`,
      { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    const result = await res.json()

    if (!res.ok || result.result !== 'ok') {
      console.error('Cloudinary delete error:', result)
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
