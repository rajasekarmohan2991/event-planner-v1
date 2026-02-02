import nextDynamic from 'next/dynamic'

const Feed = nextDynamic(() => import('@/components/dev/Feed'), { ssr: false })
export const dynamic = 'force-dynamic'

export default function SimpleFeedPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Event Planner</h1>
      <Feed />
    </div>
  )
}
