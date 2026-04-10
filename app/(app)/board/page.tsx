'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, X } from 'lucide-react'

type Post = { id: string; title: string; body: string; nickname: string; photoURL: string; createdAt: Date }

export default function Board() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchPosts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchPosts = async () => {
    const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')))
    setPosts(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() } as Post)))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim() || !user || submitting) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'posts'), {
        title: title.trim(), body: body.trim(),
        uid: user.uid, nickname: profile?.nickname || '匿名',
        photoURL: profile?.photoURL || '',
        createdAt: serverTimestamp(),
      })
      setTitle(''); setBody(''); setShowModal(false)
      await fetchPosts()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 relative">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-6">
        📋 掲示板
      </h1>

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200">
                {post.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.photoURL} alt={post.nickname} className="w-full h-full object-cover" />
                ) : <div className="w-full h-full flex items-center justify-center text-sm">👤</div>}
              </div>
              <div>
                <div className="font-bold text-sm text-gray-800">{post.nickname}</div>
                <div className="text-xs text-gray-400">{post.createdAt?.toLocaleDateString('ja-JP')}</div>
              </div>
            </div>
            <h3 className="font-bold text-gray-800 mb-1">{post.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{post.body}</p>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📝</div>
            <p>まだ投稿がありません</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 投稿モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">投稿する ✍️</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="タイトル"
              className="w-full border-2 border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-400 transition"
            />
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="内容を書いてください..."
              rows={4}
              className="w-full border-2 border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-400 transition resize-none"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !body.trim()}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 hover:scale-[1.02] transition-all"
            >
              {submitting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
