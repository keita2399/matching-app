'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, setDoc, getDocs, addDoc, query, collection, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Heart, MapPin, Briefcase, GraduationCap, Flag } from 'lucide-react'
import type { UserProfile } from '@/contexts/AuthContext'

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, profile } = useAuth()
  const [target, setTarget] = useState<UserProfile | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reported, setReported] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchUser()
    checkLiked()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])

  const fetchUser = async () => {
    const snap = await getDoc(doc(db, 'users', id))
    if (snap.exists()) setTarget(snap.data() as UserProfile)
  }

  const checkLiked = async () => {
    if (!user) return
    const likeSnap = await getDoc(doc(db, 'likes', `${user.uid}_${id}`))
    setLiked(likeSnap.exists())
    const countSnap = await getDocs(query(collection(db, 'likes'), where('fromUid', '==', user.uid)))
    setLikeCount(countSnap.size)
  }

  const handleLike = async () => {
    if (!user || liked) return
    if (!profile?.isPremium && likeCount >= 10) {
      router.push('/premium'); return
    }
    const likeId = `${user.uid}_${id}`
    await setDoc(doc(db, 'likes', likeId), { fromUid: user.uid, toUid: id, createdAt: new Date() })

    const reverseSnap = await getDoc(doc(db, 'likes', `${id}_${user.uid}`))
    if (reverseSnap.exists()) {
      const matchId = [user.uid, id].sort().join('_')
      await setDoc(doc(db, 'matches', matchId), { uids: [user.uid, id], createdAt: new Date() })
      await setDoc(doc(db, 'chats', matchId), { uids: [user.uid, id], lastMessage: '', updatedAt: new Date() })
    }
    setLiked(true)
  }

  const handleReport = async () => {
    if (!user || !reportReason.trim()) return
    await addDoc(collection(db, 'reports'), {
      reporterUid: user.uid, targetUid: id,
      reason: reportReason.trim(), createdAt: new Date(),
    })
    setReported(true)
    setShowReport(false)
  }

  if (!target) return <div className="flex items-center justify-center h-screen"><div className="text-pink-500 animate-pulse">読み込み中...</div></div>

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー写真 */}
      <div className="relative">
        <div className="aspect-square bg-gradient-to-br from-pink-200 to-purple-200 max-h-96 overflow-hidden">
          {target.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={target.photoURL} alt={target.nickname} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">👤</div>
          )}
        </div>
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={() => setShowReport(true)}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg"
          title="通報する"
        >
          <Flag className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* プロフィール情報 */}
      <div className="bg-white rounded-t-3xl -mt-4 relative z-10 p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{target.nickname}さん <span className="text-lg text-gray-500">({target.age}歳)</span></h1>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          {target.location && <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-pink-400" />{target.location}</div>}
          {target.job && <div className="flex items-center gap-1"><Briefcase className="w-4 h-4 text-purple-400" />{target.job}</div>}
          {target.education && <div className="flex items-center gap-1"><GraduationCap className="w-4 h-4 text-blue-400" />{target.education}</div>}
        </div>

        {target.bio && (
          <div className="bg-pink-50 rounded-xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{target.bio}</p>
          </div>
        )}

        {/* いいねボタン */}
        <div className="pt-4">
          {liked ? (
            <div className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl text-center text-lg">
              ❤️ いいね済み
            </div>
          ) : (
            <button
              onClick={handleLike}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:scale-[1.02] text-lg flex items-center justify-center gap-2"
            >
              <Heart className="w-6 h-6" fill="white" />
              いいねする 💕
            </button>
          )}
          {reported && <p className="text-center text-xs text-gray-400 mt-2">通報を受け付けました</p>}
        </div>
      </div>

      {/* 通報モーダル */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800">🚨 通報する</h2>
            <p className="text-sm text-gray-500">問題のある内容を報告してください。運営が確認します。</p>
            <div className="space-y-2">
              {['スパム・迷惑行為', '不適切な写真', '偽プロフィール', '誹謗中傷', 'その他'].map(r => (
                <button
                  key={r}
                  onClick={() => setReportReason(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition ${reportReason === r ? 'border-pink-400 bg-pink-50 font-bold text-pink-600' : 'border-gray-100 hover:border-pink-200'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={handleReport}
              disabled={!reportReason}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl disabled:opacity-40 transition"
            >
              通報する
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
