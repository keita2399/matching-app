'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Mail } from 'lucide-react'

export default function EmailVerification() {
  const { sendVerificationEmail, user } = useAuth()
  const [sent, setSent] = useState(false)
  const router = useRouter()

  const handleResend = async () => {
    await sendVerificationEmail()
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-orange-300 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-pink-100 rounded-full p-6">
            <Mail className="w-16 h-16 text-pink-500" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">メール認証 📧</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            <span className="font-semibold text-pink-500">{user?.email}</span> に<br />
            認証メールを送りました。<br />
            メール内のリンクをクリックしてください。
          </p>
        </div>

        <button
          onClick={() => router.push('/profile-setup')}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 rounded-xl hover:scale-[1.02] transition-all shadow-lg"
        >
          プロフィール設定へ →
        </button>

        <button
          onClick={handleResend}
          disabled={sent}
          className="text-sm text-pink-500 hover:underline disabled:text-gray-400"
        >
          {sent ? '再送しました ✓' : 'メールを再送する'}
        </button>
      </div>
    </div>
  )
}
