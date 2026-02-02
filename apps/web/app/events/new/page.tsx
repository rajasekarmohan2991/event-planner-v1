import dynamic from 'next/dynamic'

const CreateEventStepperWithSidebar = dynamic(
  () => import('@/components/events/CreateEventStepperWithSidebar').then(mod => ({ default: mod.CreateEventStepperWithSidebar })),
  { ssr: false }
)

export default function CreateEventPage() {
  return <CreateEventStepperWithSidebar />
}
