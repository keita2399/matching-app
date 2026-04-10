'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collection, getDocs, query, where, doc, getDoc, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { MessageCircle } from 'lucide-react'
import type { UserProfile } from '@/contexts/AuthContext'

type ChatRoom = {
  id: string
  partner: UserProfile
  lastMessage: string
  updatedAt: Date
  unread: number
}

const FREE_MSG_LIMIT = 5

export default function ChatList() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchRooms()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchRooms = async () => {
    if (!user) return
    const snap = await getDocs(
      query(collection(db, 'chats'), where('uids', 'array-contains', user.uid), orderBy('updatedAt', 'desc'))
    )
    const list: ChatRoom[] = []
    for (const d of snap.docs) {
      const data = d.data()
      const partnerUid = data.uids.find((u: string) => u !== user.uid)
      if (!partnerUid) continue
      const profileSnap = await getDoc(doc(db, 'users', partnerUid))
      if (!profileSnap.exists()) continue
      list.push({
        id: d.id,
        partner: profileSnap.data() as UserProfile,
        lastMessage: data.lastMessage || '',
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        unread: data[`unread_${user.uid}`] || 0,
      })
    }
    setRooms(list)
    setLoading(false)
  }

  const remaining = profile?.isPremium ? '∞' : Math.max(0, FREE_MSG_LIMIT - (profile?.messageCount || 0))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-4">
        💬 チャット
      </h1>

      {!profile?.isPremium && (
        <div className="bg-white rounded-xl p-3 mb-4 flex items-center justify-between border border-pink-100">
          <span className="text-sm text-gray-600">メッセージ残り</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all"
                style={{ width: `${(Number(remaining) / FREE_MSG_LIMIT) * 100}%` }}
              />
            </div>
            <span className="font-bold text-pink-500 text-sm">{remaining}回</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-pink-400 animate-pulse">読み込み中...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-16 h-16 text-pink-200 mx-auto mb-4" />
          <p className="text-gray-400">マッチングした相手とチャットできます</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map(room => (
            <Link key={room.id} href={`/chat/${room.id}`}>
              <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 flex-shrink-0">
                  {room.partner.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={room.partner.photoURL} alt={room.partner.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800">{room.partner.nickname}</div>
                  <div className="text-sm text-gray-400 truncate">{room.lastMessage || 'マッチングしました！'}</div>
                </div>
                {room.unread > 0 && (
                  <div className="bg-pink-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                    {room.unread}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
