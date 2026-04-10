'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Crown, Heart, MessageCircle, Star, ArrowLeft } from 'lucide-react'

export default function Premium() {
  const { profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (profile?.isPremium) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Crown className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">プレミアム会員です！</h1>
        <p className="text-gray-500">すべての機能をご利用いただけます</p>
        <button onClick={() => router.back()} className="mt-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-full font-bold">
          戻る
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> 戻る
      </button>

      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-yellow-400 to-orange-400 rounded-3xl p-8 text-center text-white mb-6 shadow-xl">
        <Crown className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">プレミアムプラン ✨</h1>
        <p className="opacity-90">制限なしで出会いを楽しもう</p>
        <div className="mt-4">
          <span className="text-5xl font-bold">¥2,980</span>
          <span className="text-lg opacity-80"> / 月</span>
        </div>
      </div>

      {/* 特典 */}
      <div className="space-y-3 mb-8">
        {[
          { icon: Heart, title: 'いいね無制限', desc: '気になる相手に何度でもいいねできます', color: 'text-pink-500' },
          { icon: MessageCircle, title: 'メッセージ無制限', desc: 'マッチング後のメッセージ制限がなくなります', color: 'text-purple-500' },
          { icon: Star, title: '優先表示', desc: '検索結果の上位に表示されやすくなります', color: 'text-yellow-500' },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-4">
            <div className={`p-3 rounded-full bg-gray-50 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-gray-800">{title}</div>
              <div className="text-sm text-gray-500">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-5 rounded-2xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 text-lg"
      >
        {loading ? '処理中...' : '💎 プレミアムに登録する'}
      </button>

      <p className="text-center text-xs text-gray-400 mt-4">
        いつでもキャンセル可能・自動更新あり<br />
        解約はマイページから行えます
      </p>
    </div>
  )
}
