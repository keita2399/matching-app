'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Heart, MessageCircle } from 'lucide-react'
import type { UserProfile } from '@/contexts/AuthContext'

export default function Matches() {
  const { user } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchMatches()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchMatches = async () => {
    if (!user) return
    const snap = await getDocs(query(collection(db, 'matches'), where('uids', 'array-contains', user.uid)))
    const profiles: UserProfile[] = []
    for (const d of snap.docs) {
      const otherUid = d.data().uids.find((u: string) => u !== user.uid)
      if (otherUid) {
        const profileSnap = await getDoc(doc(db, 'users', otherUid))
        if (profileSnap.exists()) profiles.push(profileSnap.data() as UserProfile)
      }
    }
    setMatches(profiles)
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🎉</div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          マッチング一覧
        </h1>
        <p className="text-gray-500 text-sm mt-1">お互いにいいねした相手です</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-pink-400 animate-pulse">読み込み中...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-pink-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">まだマッチングがありません</p>
          <p className="text-gray-300 text-sm mt-1">いいねを送ってみましょう！</p>
          <Link href="/home" className="mt-4 inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold text-sm">
            みんなを探す 💕
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(u => (
            <div key={u.uid} className="bg-white rounded-2xl p-4 shadow-md flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 flex-shrink-0">
                {u.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.photoURL} alt={u.nickname} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800">{u.nickname}</div>
                <div className="text-sm text-gray-500">{u.age}歳・{u.location}</div>
              </div>
              <Link
                href={`/chat/${[user!.uid, u.uid].sort().join('_')}`}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-3 rounded-full shadow-md hover:scale-110 transition"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
