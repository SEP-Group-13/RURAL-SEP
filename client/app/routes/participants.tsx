import type { Route } from './+types/participants'
import ParticipantTable from '~/components/ParticipantTable/ParticipantTable'
import ViewWrapper from '~/components/Views/ViewWrapper'
import { useViewHandlerState, viewHandler } from '~/data'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'RURAL Study Dashboard' }, { name: 'description', content: 'Welcome to dashboard!' }]
}

export default function HomeRoute() {
  useViewHandlerState(viewHandler)
  const view = viewHandler.getActiveView()

  return (
    <ViewWrapper>
      <ParticipantTable key={view.getId()} view={view} />
    </ViewWrapper>
  )
}
