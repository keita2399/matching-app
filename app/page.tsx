'use client'

import Link from 'next/link'
import { Heart, Shield, Users, Sparkles, Star } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-orange-300 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-10 left-10 w-40 h-40 bg-pink-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-36 h-36 bg-orange-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="max-w-2xl w-full text-center space-y-10 relative z-10">
        <div className="space-y-6">
          <div className="flex justify-center gap-3 animate-bounce">
            <Sparkles className="w-10 h-10 text-yellow-300" />
            <Star className="w-8 h-8 text-yellow-200" />
            <Sparkles className="w-10 h-10 text-pink-300" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-2xl">
            新しい出会いを、<br />もっと身近に 💕
          </h1>
          <p className="text-xl md:text-2xl text-white drop-shadow-lg">
            安心・安全なマッチングプラットフォームで、<br />理想の相手と出会いましょう ✨
          </p>
        </div>

        <Link
          href="/signup"
          className="inline-block bg-white hover:bg-white/95 text-pink-600 px-16 py-5 rounded-full transition-all shadow-2xl hover:scale-110 text-xl font-bold"
        >
          💖 無料で登録する
        </Link>

        <div className="grid grid-cols-3 gap-6 pt-12">
          {[
            { icon: Heart, title: '簡単マッチング', desc: 'いいねを送るだけで素敵な出会いが見つかります' },
            { icon: Shield, title: '安心・安全', desc: '本人確認済みユーザーのみが利用できます' },
            { icon: Users, title: '活発なコミュニティ', desc: '掲示板で共通の趣味を持つ仲間と交流' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-white">
              <Icon className="w-8 h-8 mx-auto mb-2" />
              <div className="font-bold text-sm mb-1">{title}</div>
              <div className="text-xs opacity-90">{desc}</div>
            </div>
          ))}
        </div>

        <p className="text-white/80 text-sm">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" className="underline font-bold hover:text-white">ログイン</Link>
        </p>
      </div>
    </div>
  )
}
