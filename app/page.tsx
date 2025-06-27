import Link from "next/link";
import { ArrowUpIcon, ArrowDownIcon, WifiIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <WifiIcon className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
              Local Transfer
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share files instantly across your local network. Fast, secure, and simple.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Send Card */}
          <Link href="/send" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2">
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <ArrowUpIcon className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Send Files</h2>
                <p className="text-gray-600 mb-6">
                  Share your files with other devices on the network
                </p>
                <div className="bg-blue-50 rounded-lg p-4 group-hover:bg-blue-100 transition-colors duration-300">
                  <span className="text-blue-700 font-semibold">Click to start sending →</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Receive Card */}
          <Link href="/receive" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:border-green-200 transform hover:-translate-y-2">
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <ArrowDownIcon className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Receive Files</h2>
                <p className="text-gray-600 mb-6">
                  Accept files from other devices on the network
                </p>
                <div className="bg-green-50 rounded-lg p-4 group-hover:bg-green-100 transition-colors duration-300">
                  <span className="text-green-700 font-semibold">Click to start receiving →</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-800 mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-600">Direct peer-to-peer transfer</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold text-gray-800 mb-2">Secure</h3>
              <p className="text-sm text-gray-600">Local network only</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-semibold text-gray-800 mb-2">Cross Platform</h3>
              <p className="text-sm text-gray-600">Works on any device</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}