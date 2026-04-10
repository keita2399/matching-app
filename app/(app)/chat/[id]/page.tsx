'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  collection, addDoc, query, orderBy, onSnapshot, doc,
  getDoc, updateDoc, serverTimestamp, increment
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Send, Crown } from 'lucide-react'
import Link from 'next/link'
import type { UserProfile } from '@/contexts/AuthContext'

type Message = { id: string; text: string; fromUid: string; createdAt: Date }

const FREE_MSG_LIMIT = 5

export default function Chat() {
  const { id } = useParams<{ id: string }>()
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [partner, setPartner] = useState<UserProfile | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchPartner()
    const unsub = onSnapshot(
      query(collection(db, 'chats', id, 'messages'), orderBy('createdAt', 'asc')),
      snap => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() } as Message)))
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    )
    return unsub
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])

  const fetchPartner = async () => {
    const chatSnap = await getDoc(doc(db, 'chats', id))
    if (!chatSnap.exists()) return
    const partnerUid = chatSnap.data().uids.find((u: string) => u !== user?.uid)
    if (!partnerUid) return
    const profileSnap = await getDoc(doc(db, 'users', partnerUid))
    if (profileSnap.exists()) setPartner(profileSnap.data() as UserProfile)
  }

  const handleSend = async () => {
    if (!text.trim() || !user || sending) return
    const msgCount = profile?.messageCount || 0
    if (!profile?.isPremium && msgCount >= FREE_MSG_LIMIT) {
      router.push('/premium'); return
    }
    setSending(true)
    try {
      await addDoc(collection(db, 'chats', id, 'messages'), {
        text: text.trim(), fromUid: user.uid, createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'chats', id), {
        lastMessage: text.trim(), updatedAt: serverTimestamp(),
      })
      if (!profile?.isPremium) {
        await updateDoc(doc(db, 'users', user.uid), { messageCount: increment(1) })
        await refreshProfile()
      }
      setText('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const remaining = profile?.isPremium ? null : Math.max(0, FREE_MSG_LIMIT - (profile?.messageCount || 0))

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-pink-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-pink-500 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200">
          {partner?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.photoURL} alt={partner.nickname} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">👤</div>
          )}
        </div>
        <div>
          <div className="font-bold text-gray-800">{partner?.nickname}</div>
          <div className="text-xs text-green-400">オンライン</div>
        </div>
      </div>

      {/* 残りメッセージ数 */}
      {remaining !== null && remaining <= 3 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-amber-600">残り {remaining} 回のメッセージ</span>
          <Link href="/premium" className="flex items-center gap-1 text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full font-bold">
            <Crown className="w-3 h-3" /> 無制限に
          </Link>
        </div>
      )}

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.fromUid === user?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
              msg.fromUid === user?.uid
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-none'
                : 'bg-white text-gray-800 shadow-sm rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div className="bg-white border-t border-pink-100 px-4 py-3 flex gap-2">
        {remaining !== null && remaining === 0 ? (
          <Link href="/premium" className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold py-3 rounded-xl text-center text-sm">
            💎 プレミアムでメッセージ無制限に
          </Link>
        ) : (
          <>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="メッセージを入力..."
              className="flex-1 border-2 border-pink-200 rounded-xl px-4 py-2 focus:outline-none focus:border-pink-400 transition text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-3 rounded-xl disabled:opacity-50 transition hover:scale-105"
            >
              <Send className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
