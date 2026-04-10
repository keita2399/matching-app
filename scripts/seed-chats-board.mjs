import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
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

const app = initializeApp({
  credential: cert({
    projectId: 'matching-app-a39b0',
    clientEmail: envVars['FIREBASE_ADMIN_CLIENT_EMAIL'],
    privateKey: envVars['FIREBASE_ADMIN_PRIVATE_KEY'].replace(/\\n/g, '\n'),
  }),
})

const db = getFirestore(app)
const auth = getAuth(app)

const DUMMY_EMAILS = [
  'sakura@example.com','yuki@example.com','hana@example.com','mio@example.com','rin@example.com',
  'taro@example.com','kenji@example.com','sho@example.com','ryu@example.com','daiki@example.com',
]

// ダミーユーザーのUID取得
async function getDummyUids() {
  const uids = {}
  for (const email of DUMMY_EMAILS) {
    const u = await auth.getUserByEmail(email)
    uids[email] = u.uid
  }
  return uids
}

// 実ユーザー（ダミー以外）を取得
async function getRealUsers() {
  const result = await auth.listUsers(100)
  return result.users.filter(u => !DUMMY_EMAILS.includes(u.email || ''))
}

// チャットルーム作成
async function createChat(uid1, uid2, messages, minutesAgo = 60) {
  const chatId = [uid1, uid2].sort().join('_')
  const lastMsg = messages[messages.length - 1]
  const baseTime = new Date(Date.now() - minutesAgo * 60 * 1000)

  await db.collection('chats').doc(chatId).set({
    uids: [uid1, uid2],
    members: [uid1, uid2],
    lastMessage: lastMsg.text,
    updatedAt: Timestamp.fromDate(baseTime),
    [`unread_${uid1}`]: 1,
    [`unread_${uid2}`]: 0,
  })

  for (let i = 0; i < messages.length; i++) {
    const msgTime = new Date(baseTime.getTime() - (messages.length - i) * 2 * 60 * 1000)
    await db.collection('chats').doc(chatId).collection('messages').add({
      senderId: messages[i].from === 'a' ? uid1 : uid2,
      text: messages[i].text,
      createdAt: Timestamp.fromDate(msgTime),
    })
  }

  // マッチも作成
  await db.collection('matches').add({
    uids: [uid1, uid2],
    createdAt: Timestamp.fromDate(new Date(baseTime.getTime() - 30 * 60 * 1000)),
  })

  return chatId
}

async function seed() {
  console.log('ダミーデータ投入中...')

  const dummyUids = await getDummyUids()
  const realUsers = await getRealUsers()

  const s = dummyUids['sakura@example.com']
  const y = dummyUids['yuki@example.com']
  const h = dummyUids['hana@example.com']
  const m = dummyUids['mio@example.com']
  const r = dummyUids['rin@example.com']
  const ta = dummyUids['taro@example.com']
  const k = dummyUids['kenji@example.com']
  const sh = dummyUids['sho@example.com']
  const ry = dummyUids['ryu@example.com']
  const d = dummyUids['daiki@example.com']

  // ── ダミー同士のチャット ──
  console.log('チャット作成中...')

  await createChat(s, ta, [
    { from: 'b', text: 'はじめまして！さくらさん、プロフィール見て気になって💕' },
    { from: 'a', text: 'こちらこそ！たろうさんエンジニアなんですね✨' },
    { from: 'b', text: 'はい！休日はキャンプしてます。さくらさんは料理好きって書いてましたね' },
    { from: 'a', text: 'そうなんです😊今度キャンプ飯教えてください笑' },
    { from: 'b', text: 'ぜひ！一緒に行きましょう🏕️' },
  ], 30)
  console.log('✓ さくら × たろう')

  await createChat(y, k, [
    { from: 'a', text: 'けんじさん、デザインにも興味あるんですか？' },
    { from: 'b', text: 'プレゼン資料をきれいに作りたくて。ゆきさんのプロフ見てすごいなと思って' },
    { from: 'a', text: 'ありがとうございます😊何かお役に立てたら嬉しいです' },
    { from: 'b', text: '今度ランチしながら教えてもらえますか？' },
    { from: 'a', text: 'いいですよ！カフェ好きなので🎨' },
  ], 90)
  console.log('✓ ゆき × けんじ')

  await createChat(m, sh, [
    { from: 'b', text: 'みおさん、IT企業勤めなんですね。どんな仕事してるんですか？' },
    { from: 'a', text: 'アプリのプロダクトマネージャーです。しょうさんは研修医大変そう💦' },
    { from: 'b', text: '確かに忙しいですが充実してます。休日映画見て癒されてます' },
    { from: 'a', text: 'おすすめ教えてください！私もNetflixよく見ます🎬' },
  ], 120)
  console.log('✓ みお × しょう')

  await createChat(r, ry, [
    { from: 'a', text: 'りゅうさん、大阪でカフェ経営してるんですか？すごい！' },
    { from: 'b', text: 'ありがとう😊りんさん先生してるって、毎日元気もらえそうですね' },
    { from: 'a', text: '子どもたちに毎日パワーもらってます笑 サーフィンもやるんですか？' },
    { from: 'b', text: 'はい！週末は海に行ってます🏄 りんさんも一度やってみませんか？' },
    { from: 'a', text: 'やってみたいです！怖そうだけど💦' },
    { from: 'b', text: '絶対楽しいですよ。僕が教えます！' },
  ], 200)
  console.log('✓ りん × りゅう')

  await createChat(h, d, [
    { from: 'b', text: 'はなさん、大学院受験頑張ってるんですね。偉いな〜' },
    { from: 'a', text: 'ありがとうございます💦だいきさんは公務員なんですね、安定してそう' },
    { from: 'b', text: '笑。まあそうですね。ゴルフ好きなんですが、はなさん興味ありますか？' },
    { from: 'a', text: '全然知らないです！でも興味あります⛳' },
  ], 300)
  console.log('✓ はな × だいき')

  // ── 実ユーザーとのチャット ──
  if (realUsers.length > 0) {
    const realUid = realUsers[0].uid
    console.log(`実ユーザー(${realUsers[0].email})とのチャットを作成中...`)

    await createChat(realUid, s, [
      { from: 'b', text: 'はじめまして！さくらさん、よろしくお願いします😊' },
      { from: 'a', text: 'こちらこそ！よろしくお願いします💕' },
      { from: 'b', text: '看護師さんなんですね、毎日お疲れ様です' },
      { from: 'a', text: 'ありがとうございます。あなたのプロフィール見て気になって✨' },
    ], 10)
    console.log('✓ 実ユーザー × さくら')

    await createChat(realUid, ta, [
      { from: 'b', text: 'たろうさん、エンジニアなんですね！どんな言語使ってますか？' },
      { from: 'a', text: '最近はTypeScriptとGoが多いですよ。なんで知ってるんですか？笑' },
      { from: 'b', text: '私もIT系で気になって！今度いろいろ教えてください🙏' },
    ], 5)
    console.log('✓ 実ユーザー × たろう')
  }

  // ── 掲示板投稿 ──
  console.log('掲示板投稿作成中...')

  const boardPosts = [
    { uid: s, nickname: 'さくら', photo: 'sakura', title: '趣味が合う人と話したい🌸', body: '料理と映画が好きです。おすすめのレシピや映画があればぜひ教えてください！特にイタリアンを最近練習中です🍝', daysAgo: 1 },
    { uid: ta, nickname: 'たろう', photo: 'taro', title: 'キャンプ仲間募集！⛺', body: '今月末に奥多摩でソロキャンプ予定です。もし近くに行く予定の方いたら情報交換しましょう！おすすめのキャンプ場あれば教えてください', daysAgo: 2 },
    { uid: y, nickname: 'ゆき', photo: 'yuki', title: 'カフェ好きな人集まれ☕', body: '渋谷・恵比寿あたりで最近行ってよかったカフェがあれば教えてほしいです！内装がかわいくてゆっくりできる場所を探してます🎨', daysAgo: 3 },
    { uid: sh, nickname: 'しょう', photo: 'sho', title: 'おすすめの映画教えてください🎬', body: 'Netflixで最近見て良かったのはSevered（セヴェランス）です。仕事終わりにまったり見られる作品が好きです。みなさんのおすすめは何ですか？', daysAgo: 4 },
    { uid: m, nickname: 'みお', photo: 'mio', title: '朝活してる人いますか？🌅', body: '最近朝5時半に起きてランニングを始めました。一緒に頑張れる人がいたらモチベーション上がりそう！朝活仲間募集中です💪', daysAgo: 5 },
    { uid: ry, nickname: 'りゅう', photo: 'ryu', title: '大阪でおいしいお店教えて！🍜', body: 'カフェをやってる関係でいろんなお店が気になります。大阪のおすすめグルメ情報を交換しませんか？地元民しか知らない穴場があれば特に嬉しいです', daysAgo: 6 },
    { uid: h, nickname: 'はな', photo: 'hana', title: '大学院受験の勉強法知りたいです📚', body: '来年の受験に向けて勉強中です。社会人の方で大学院に行った方、勉強のコツや両立方法があれば教えていただけると嬉しいです🙏', daysAgo: 7 },
    { uid: k, nickname: 'けんじ', photo: 'kenji', title: '週末ゴルフ行ける人いませんか⛳', body: '東京・神奈川近郊でゴルフ仲間を探しています。初心者の方も歓迎です！スコアより楽しさ重視で一緒に回りましょう', daysAgo: 8 },
  ]

  for (const post of boardPosts) {
    const createdAt = new Date(Date.now() - post.daysAgo * 24 * 60 * 60 * 1000)
    await db.collection('posts').add({
      uid: post.uid,
      nickname: post.nickname,
      photoURL: `https://api.dicebear.com/9.x/adventurer/svg?seed=${post.photo}`,
      title: post.title,
      body: post.body,
      createdAt: Timestamp.fromDate(createdAt),
    })
    console.log(`✓ 掲示板: ${post.title}`)
  }

  // Firestoreのpostsにインデックスが必要な場合のためorderBy対応
  console.log('\n全データ投入完了！')
  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })
