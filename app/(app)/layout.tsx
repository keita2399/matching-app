import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-orange-100">
      <main className="pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
