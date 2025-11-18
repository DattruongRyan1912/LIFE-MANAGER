import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex flex-col items-center justify-center gap-8 p-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900">
            🤖 Life Manager AI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Trợ lý AI thông minh giúp bạn quản lý cuộc sống hiệu quả hơn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
          <Link
            href="/dashboard"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-2">📊</div>
            <h2 className="text-xl font-bold mb-2">Dashboard</h2>
            <p className="text-gray-600">Xem tổng quan về ngày của bạn</p>
          </Link>

          <Link
            href="/tasks"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-xl font-bold mb-2">Tasks</h2>
            <p className="text-gray-600">Quản lý công việc hàng ngày</p>
          </Link>

          <Link
            href="/expenses"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-2">💰</div>
            <h2 className="text-xl font-bold mb-2">Expenses</h2>
            <p className="text-gray-600">Theo dõi chi tiêu cá nhân</p>
          </Link>

          <Link
            href="/assistant"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-2">🤖</div>
            <h2 className="text-xl font-bold mb-2">AI Assistant</h2>
            <p className="text-gray-600">Trò chuyện với AI trợ lý</p>
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          Powered by Groq AI • Built with Next.js & Laravel
        </div>
      </main>
    </div>
  );
}
