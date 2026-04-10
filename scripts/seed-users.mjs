import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// .env.local を手動パース
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    let val = match[2].trim()
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    envVars[match[1].trim()] = val
  }
}

const privateKey = envVars['FIREBASE_ADMIN_PRIVATE_KEY'].replace(/\\n/g, '\n')

const app = initializeApp({
  credential: cert({
    projectId: 'matching-app-a39b0',
    clientEmail: envVars['FIREBASE_ADMIN_CLIENT_EMAIL'],
    privateKey,
  }),
})

const db = getFirestore(app)
const auth = getAuth(app)

const dummyUsers = [
  { email: 'sakura@example.com', nickname: 'さくら', age: 24, gender: '女性', location: '東京都', job: '看護師', education: '大学卒', income: '300〜500万', bio: '仕事が好きです。週末は料理や映画を楽しんでいます。穏やかな人が好きです😊', photoURL: 'https://api.dicebear.com/9.x/adventurer/svg?seed=sakura' },
  { email: 'yuki@example.com', nickname: 'ゆき', age: 27, gender: '女性', location: '神奈川県', job: 'デザイナー', education: '大学卒', income: '300〜500万', bio: 'カフェ巡りとイラストが趣味です。アート好きな方と話したいです🎨', photoURL: 'https://api.dicebear.com/9.x/adventurer/svg?seed=yuki' },
  { email: 'hana@example.com', nickname: 'はな', age: 22, gender: '女性', location: '大阪府', job: '学生', education: '大学卒', income: '300万未満', bio: '大学院を目指して勉強中！旅行と音楽が大好きです✈️', photoURL: 'https://api.dicebear.com/9.x/adventurer/svg?seed=hana' },
  { email: 'mio@example.com', nickname: 'みお', age: 29, gender: '女性', location: '東京都', job: '会社員', education: '大学卒', income: '500〜700万', bio: 'IT企業で働いています。ランニングとヨガが日課です。一緒に成長できる人を探しています💪', photoURL: 'https://api.dicebear.com/9.x/adventurer/svg?seed=mio' },
  { email: 'rin@example.com', nickname: 'りん', age: 25, gender: '女性', location: '愛知県', job: '教師', education: '大学卒', income: '300〜500万', bio: '小学校の先生をしています。子ども好き、動物好きです🐶', photoURL: 'https://api.dicebear.com/9.x/adventurer/svg?seed=rin' },
  { email: 'taro@example.com', nickname: 'たろう', age: 28, gender: '男性', location: '東京都', job: 'エンジニア', education: '大学卒', income: '500〜700万', bio: 'Web系エンジニアです。休日はキャンプや登山を楽しんでいます⛺', photoURL: 'https://api.dicebear.com/9.x/adventurer/svg?seed=taro' },
  { email: 'kenji@example.com', nickname: 'けんじ', age: 31, gender: '男性', location: '東京都', job: '会社員', education: '大学院卒', income: '700〜1000万', bio: 'コンサル会社勤務です。料理が趣味で休日は自炊しています🍳', photoURL: 'https://api.dicebear.com/9.x/adventurer/svg?seed=kenji' },
  { email: 'sho@example.com', nickname: 'しょう', age: 26, gender: '男性', location: '神奈川県', job: '医師', education: '大学院卒', income: '1000万以上', bio: '研修医2年目です。忙しいですが趣味の映画鑑賞で癒されています🎬', photoURL: 'https://api.dicebear.com/9.x/adventurer/svg?seed=sho' },
  { email: 'ryu@example.com', nickname: 'りゅう', age: 30, gender: '男性', location: '大阪府', job: '自営業', education: '大学卒', income: '500〜700万', bio: 'カフェを経営しています。音楽とサーフィンが好きです🏄', photoURL: 'https://api.dicebear.com/9.x/adventurer/svg?seed=ryu' },
  { email: 'daiki@example.com', nickname: 'だいき', age: 33, gender: '男性', location: '福岡県', job: '公務員', education: '大学卒', income: '300〜500万', bio: '安定した生活を大切にしています。休日はスポーツ観戦とゴルフ⛳', photoURL: 'https://api.dicebear.com/9.x/adventurer/svg?seed=daiki' },
]

async function seed() {
  console.log('ダミーユーザーを投入中...')
  for (const u of dummyUsers) {
    try {
      const userRecord = await auth.createUser({
        email: u.email,
        password: 'password123',
        emailVerified: true,
      })
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: u.email,
        nickname: u.nickname,
        age: u.age,
        gender: u.gender,
        location: u.location,
        job: u.job,
        education: u.education,
        income: u.income,
        bio: u.bio,
        photoURL: u.photoURL,
        isPremium: false,
        createdAt: new Date(),
      })
      console.log(`✓ ${u.nickname} (${userRecord.uid})`)
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        console.log(`スキップ: ${u.email} はすでに存在します`)
      } else {
        console.error(`✗ ${u.nickname}:`, err.message)
      }
    }
  }
  console.log('完了！')
  process.exit(0)
}

seed()
