'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Search, Ban, CheckCircle } from 'lucide-react'
import type { UserProfile } from '@/contexts/AuthContext'

const ADMIN_EMAILS = ['keita2399@gmail.com']

type Report = { id: string; reporterUid: string; targetUid: string; reason: string; createdAt: Date }

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'users' | 'reports'>('users')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      router.replace('/home')
      return
    }
    fetchData()
  }, [user, authLoading, router])

  const fetchData = async () => {
    const [userSnap, reportSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'))),
    ])
    setUsers(userSnap.docs.map(d => d.data() as UserProfile))
    setReports(reportSnap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() } as Report)))
    setLoading(false)
  }

  const handleBan = async (uid: string, banned: boolean) => {
    await updateDoc(doc(db, 'users', uid), { banned: !banned })
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, banned: !banned } as UserProfile & { banned: boolean } : u))
  }

  const filteredUsers = users.filter(u =>
    u.nickname?.includes(search) || u.email?.includes(search)
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🛡️ 管理画面</h1>

      {/* タブ */}
      <div className="flex gap-2 mb-6">
        {(['users', 'reports'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition ${tab === t ? 'bg-pink-500 text-white' : 'bg-white text-gray-500 hover:bg-pink-50'}`}
          >
            {t === 'users' ? `👥 ユーザー (${users.length})` : `🚨 通報 (${reports.length})`}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <>
          <div className="flex items-center bg-white rounded-xl border border-gray-200 px-3 gap-2 mb-4">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="名前・メールで検索"
              className="flex-1 py-3 focus:outline-none text-sm"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">読み込み中...</div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">ユーザー</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 hidden md:table-cell">メール</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">プラン</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className="border-t border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200">
                            {u.photoURL ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.photoURL} alt={u.nickname} className="w-full h-full object-cover" />
                            ) : <div className="w-full h-full flex items-center justify-center text-xs">👤</div>}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800">{u.nickname || '未設定'}</div>
                            <div className="text-xs text-gray-400">{u.age ? `${u.age}歳` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${u.isPremium ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                          {u.isPremium ? '💎 Premium' : 'Free'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleBan(u.uid, !!(u as UserProfile & { banned?: boolean }).banned)}
                          className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full transition ${
                            (u as UserProfile & { banned?: boolean }).banned
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-red-100 text-red-500 hover:bg-red-200'
                          }`}
                        >
                          {(u as UserProfile & { banned?: boolean }).banned ? (
                            <><CheckCircle className="w-3 h-3" /> 解除</>
                          ) : (
                            <><Ban className="w-3 h-3" /> BAN</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-16 text-gray-400">通報はありません</div>
          ) : (
            reports.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{r.createdAt?.toLocaleDateString('ja-JP')}</span>
                  <span className="bg-red-100 text-red-500 text-xs font-bold px-2 py-1 rounded-full">通報</span>
                </div>
                <p className="text-sm text-gray-700">{r.reason}</p>
                <div className="flex gap-2 mt-2 text-xs text-gray-400">
                  <span>通報者: {r.reporterUid.slice(0, 8)}...</span>
                  <span>対象: {r.targetUid.slice(0, 8)}...</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
