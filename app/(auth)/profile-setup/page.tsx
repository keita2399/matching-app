'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { Camera, Images } from 'lucide-react'

const STEPS = ['写真', '基本情報', '詳細情報', '自己紹介']

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [location, setLocation] = useState('')
  const [job, setJob] = useState('')
  const [education, setEducation] = useState('')
  const [income, setIncome] = useState('')
  const [bio, setBio] = useState('')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      let photoURL = `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.uid}`
      if (photo) {
        const formData = new FormData()
        formData.append('file', photo)
        formData.append('uid', user.uid)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json()
          photoURL = data.url
        }
      }
      await updateDoc(doc(db, 'users', user.uid), {
        nickname, age: parseInt(age), gender, location,
        job, education, income, bio, photoURL,
      })
      await refreshProfile()
      router.push('/home')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border-2 border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-400 transition"
  const selectClass = "w-full border-2 border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-400 transition bg-white"

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-orange-300 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6">
        {/* ステップバー */}
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded-full transition-all ${i + 1 <= step ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-200'}`} />
              <div className={`text-xs text-center mt-1 font-medium ${i + 1 === step ? 'text-pink-500' : 'text-gray-400'}`}>{s}</div>
            </div>
          ))}
        </div>

        {/* Step 1: 写真 */}
        {step === 1 && (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-gray-800">プロフィール写真 📸</h2>
            <button type="button" onClick={() => setShowPhotoMenu(true)} className="inline-block focus:outline-none">
              <div className="w-32 h-32 rounded-full border-4 border-dashed border-pink-300 flex items-center justify-center mx-auto overflow-hidden bg-pink-50 hover:bg-pink-100 transition">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Camera className="w-10 h-10 text-pink-400 mx-auto" />
                    <span className="text-xs text-pink-400">タップして選択</span>
                  </div>
                )}
              </div>
            </button>
          </div>
        )}

        {/* 写真選択メニュー */}
        {showPhotoMenu && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowPhotoMenu(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative w-full max-w-md bg-white rounded-t-3xl p-6 space-y-3" onClick={e => e.stopPropagation()}>
              <p className="text-center text-sm text-gray-500 font-medium mb-4">写真を選択</p>
              <label
                onClick={() => setShowPhotoMenu(false)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-pink-50 hover:bg-pink-100 transition cursor-pointer"
              >
                <Camera className="w-6 h-6 text-pink-500" />
                <span className="text-gray-800 font-medium">カメラで撮影</span>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
              </label>
              <label
                onClick={() => setShowPhotoMenu(false)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-purple-50 hover:bg-purple-100 transition cursor-pointer"
              >
                <Images className="w-6 h-6 text-purple-500" />
                <span className="text-gray-800 font-medium">アルバムから選択</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
              <button
                type="button"
                onClick={() => setShowPhotoMenu(false)}
                className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 基本情報 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">基本情報 👤</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
              <input value={nickname} onChange={e => setNickname(e.target.value)} className={inputClass} placeholder="例：さくら" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年齢</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} className={inputClass} placeholder="25" min="18" max="99" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className={selectClass}>
                <option value="">選択してください</option>
                <option value="男性">男性</option>
                <option value="女性">女性</option>
                <option value="その他">その他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">居住地</label>
              <select value={location} onChange={e => setLocation(e.target.value)} className={selectClass}>
                <option value="">都道府県を選択</option>
                {['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: 詳細情報 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">詳細情報 💼</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">職業</label>
              <input value={job} onChange={e => setJob(e.target.value)} className={inputClass} placeholder="例：会社員" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">学歴</label>
              <select value={education} onChange={e => setEducation(e.target.value)} className={selectClass}>
                <option value="">選択してください</option>
                <option value="高校卒">高校卒</option>
                <option value="専門学校卒">専門学校卒</option>
                <option value="短大卒">短大卒</option>
                <option value="大学卒">大学卒</option>
                <option value="大学院卒">大学院卒</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年収（任意）</label>
              <select value={income} onChange={e => setIncome(e.target.value)} className={selectClass}>
                <option value="">選択してください</option>
                <option value="300万未満">300万未満</option>
                <option value="300〜500万">300〜500万</option>
                <option value="500〜700万">500〜700万</option>
                <option value="700〜1000万">700〜1000万</option>
                <option value="1000万以上">1000万以上</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: 自己紹介 */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">自己紹介 ✍️</h2>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full border-2 border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-400 transition resize-none"
              rows={6}
              placeholder="趣味や好きなこと、どんな人と出会いたいかなど自由に書いてください ✨"
            />
          </div>
        )}

        {/* ナビゲーション */}
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 border-2 border-pink-300 text-pink-500 font-bold py-3 rounded-xl hover:bg-pink-50 transition"
            >
              ← 戻る
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition-all shadow-lg"
            >
              次へ →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition-all shadow-lg disabled:opacity-60"
            >
              {loading ? '保存中...' : '完成！💖'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
