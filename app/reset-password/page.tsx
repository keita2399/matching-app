'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Mail } from 'lucide-react'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await resetPassword(email)
      setSent(true)
    } catch {
      setError('メールアドレスが見つかりません')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-orange-300 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
        <Mail className="w-16 h-16 text-pink-400 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-800">パスワードリセット</h1>

        {sent ? (
          <>
            <p className="text-gray-500 text-sm">リセットメールを送信しました。メールをご確認ください。</p>
            <Link href="/login" className="block w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl">
              ログインへ戻る
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && <div className="bg-red-50 text-red-500 text-sm px-4 py-2 rounded-xl">{error}</div>}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="登録したメールアドレス"
              className="w-full border-2 border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-400"
            />
            <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl">
              送信する
            </button>
            <Link href="/login" className="block text-center text-sm text-pink-500 hover:underline">
              ログインへ戻る
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
