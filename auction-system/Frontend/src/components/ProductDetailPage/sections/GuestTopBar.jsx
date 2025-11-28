import React from 'react'

export default function GuestTopBar({ onBack, onLogin, onRegister }) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Quay lại</span>
          </button>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="px-4 py-2 text-sm font-medium text-blue-600">
              Đăng nhập
            </button>
            <button onClick={onRegister} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">
              Đăng ký
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
