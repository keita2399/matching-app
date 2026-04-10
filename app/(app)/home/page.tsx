'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collection, getDocs, doc, setDoc, getDoc, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Heart, Search, SlidersHorizontal, Crown } from 'lucide-react'
import type { UserProfile } from '@/contexts/AuthContext'

const FREE_LIKE_LIMIT = 10

export default function Home() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [search, setSearch] = useState('')
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchUsers()
    fetchLikes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, 'users'))
    const list = snap.docs
      .map(d => d.data() as UserProfile)
      .filter(u => u.uid !== user?.uid && u.nickname)
    setUsers(list)
  }

  const fetchLikes = async () => {
    if (!user) return
    const snap = await getDocs(query(collection(db, 'likes'), where('fromUid', '==', user.uid)))
    const ids = new Set(snap.docs.map(d => d.data().toUid as string))
    setLikedIds(ids)
    setLikeCount(snap.size)
  }

  const handleLike = async (toUser: UserProfile) => {
    if (!user) return
    if (!profile?.isPremium && likeCount >= FREE_LIKE_LIMIT) {
      router.push('/premium'); return
    }
    if (likedIds.has(toUser.uid)) return

    const likeId = `${user.uid}_${toUser.uid}`
    await setDoc(doc(db, 'likes', likeId), {
      fromUid: user.uid, toUid: toUser.uid, createdAt: new Date(),
    })

    // 相互いいねチェック → マッチング成立
    const reverseSnap = await getDoc(doc(db, 'likes', `${toUser.uid}_${user.uid}`))
    if (reverseSnap.exists()) {
      const matchId = [user.uid, toUser.uid].sort().join('_')
      await setDoc(doc(db, 'matches', matchId), {
        uids: [user.uid, toUser.uid], createdAt: new Date(),
      })
      await setDoc(doc(db, 'chats', matchId), {
        uids: [user.uid, toUser.uid], lastMessage: '', updatedAt: new Date(),
      })
    }

    setLikedIds(prev => new Set(prev).add(toUser.uid))
    setLikeCount(c => c + 1)
  }

  const filtered = users.filter(u =>
    u.nickname?.includes(search) || u.location?.includes(search)
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          💕 みんなを探す
        </h1>
        {!profile?.isPremium && (
          <Link href="/premium" className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">
            <Crown className="w-3 h-3" /> プレミアム
          </Link>
        )}
      </div>

      {/* 検索バー */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center bg-white rounded-xl border-2 border-pink-200 px-3 gap-2">
          <Search className="w-4 h-4 text-pink-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="名前・居住地で検索"
            className="flex-1 py-3 focus:outline-none text-sm"
          />
        </div>
        <button className="bg-white border-2 border-pink-200 rounded-xl px-3 text-pink-400 hover:bg-pink-50 transition">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* いいね残数 */}
      {!profile?.isPremium && (
        <div className="bg-white rounded-xl p-3 mb-4 flex items-center justify-between border border-pink-100">
          <span className="text-sm text-gray-600">💖 いいね残り</span>
          <span className="font-bold text-pink-500">{Math.max(0, FREE_LIKE_LIMIT - likeCount)} / {FREE_LIKE_LIMIT}</span>
        </div>
      )}

      {/* ユーザーグリッド */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(u => (
          <div key={u.uid} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
            <Link href={`/user/${u.uid}`}>
              <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-purple-100">
                {u.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.photoURL} alt={u.nickname} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                )}
              </div>
            </Link>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-gray-800">{u.nickname}</div>
                  <div className="text-xs text-gray-500">{u.age}歳・{u.location}</div>
                </div>
                <button
                  onClick={() => handleLike(u)}
                  className={`rounded-full p-2 transition-all ${likedIds.has(u.uid) ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-500 hover:bg-pink-200'}`}
                >
                  <Heart className="w-4 h-4" fill={likedIds.has(u.uid) ? 'white' : 'none'} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>ユーザーが見つかりません</p>
        </div>
      )}
    </div>
  )
}
