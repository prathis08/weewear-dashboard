import Sidebar from '@/components/Sidebar'
import ProductForm from '@/components/ProductForm'

export default function NewProductPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Add Product</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fill in the details to add a new product.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <ProductForm />
        </div>
      </main>
    </div>
  )
}
