'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Crown, LogOut, Edit2, Camera, ChevronRight } from 'lucide-react'

export default function MyPage() {
  const { user, profile, logout, refreshProfile } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (profile) { setNickname(profile.nickname); setBio(profile.bio) }
  }, [user, profile, router])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('uid', user.uid)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) {
      const data = await res.json()
      await updateDoc(doc(db, 'users', user.uid), { photoURL: data.url })
      await refreshProfile()
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), { nickname, bio })
      await refreshProfile()
      setEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* プロフィールヘッダー */}
      <div className="bg-white rounded-3xl p-6 shadow-md mb-4 text-center">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 mx-auto">
            {profile?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoURL} alt={profile.nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-pink-500 text-white rounded-full p-1.5 cursor-pointer shadow-md">
            <Camera className="w-3 h-3" />
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>

        {editing ? (
          <div className="space-y-3">
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full border-2 border-pink-200 rounded-xl px-4 py-2 focus:outline-none focus:border-pink-400 text-center font-bold"
            />
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              className="w-full border-2 border-pink-200 rounded-xl px-4 py-2 focus:outline-none focus:border-pink-400 text-sm resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 border-2 border-gray-200 text-gray-500 py-2 rounded-xl text-sm">キャンセル</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 rounded-xl text-sm font-bold disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-800">{profile?.nickname}</h1>
              <button onClick={() => setEditing(true)} className="text-pink-400 hover:text-pink-600">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500">{profile?.location}</p>
            {profile?.bio && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profile.bio}</p>}
          </>
        )}

        {/* プランバッジ */}
        <div className="mt-4 inline-flex items-center gap-2">
          {profile?.isPremium ? (
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" /> プレミアム会員
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-500 text-xs font-bold px-4 py-1 rounded-full">無料プラン</span>
          )}
        </div>
      </div>

      {/* メニュー */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        {[
          { href: '/premium', icon: Crown, label: 'プレミアムに登録', color: 'text-yellow-500' },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 hover:bg-pink-50 transition">
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-white text-red-400 border-2 border-red-100 font-bold py-4 rounded-2xl hover:bg-red-50 transition"
      >
        <LogOut className="w-5 h-5" />
        ログアウト
      </button>
    </div>
  )
}
