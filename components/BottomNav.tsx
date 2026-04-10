'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, MessageCircle, MessageSquare, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  const items = [
    { href: '/home', icon: Home, label: 'ホーム' },
    { href: '/matches', icon: Heart, label: 'マッチ' },
    { href: '/chats', icon: MessageCircle, label: 'チャット' },
    { href: '/board', icon: MessageSquare, label: '掲示板' },
    { href: '/my-page', icon: User, label: 'マイページ' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-pink-300 h-20 flex items-center justify-around px-4 z-50 shadow-2xl">
      {items.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={`flex flex-col items-center gap-1 transition-all transform ${
            isActive(href)
              ? 'text-pink-600 scale-125'
              : 'text-gray-400 hover:text-pink-400 hover:scale-110'
          }`}
        >
          <div className={isActive(href) ? 'bg-gradient-to-br from-pink-100 to-purple-100 rounded-full p-2 shadow-lg' : ''}>
            <Icon className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
