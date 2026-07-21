import { logger } from '@/lib/logger';
export default function Custom404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-6">Page not found.</p>
        <a href="/" className="px-6 py-3 bg-purple-600 rounded-xl hover:bg-purple-700">
          Return Home
        </a>
      </div>
    </div>
  );
}