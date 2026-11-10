import type { Route } from './+types/home'
import ParticipantTable from '~/components/ParticipantTable/ParticipantTable'
import ViewSelect from '~/components/ViewSelect/ViewSelect'
import { useViewHandlerState, viewHandler } from '~/data'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'RURAL Study Dashboard' }, { name: 'description', content: 'Welcome to dashboard!' }]
}

export default function HomeRoute() {
  useViewHandlerState(viewHandler)
  const view = viewHandler.getActiveView()

  return (
    <div className="p-4">
      <ViewSelect />
      <ParticipantTable key={view.getId()} view={view} />
    </div>
  )
}
