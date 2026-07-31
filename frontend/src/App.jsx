import { InboxProvider } from './context/InboxContext.jsx'
import Inbox from './pages/Inbox.jsx'

export default function App() {
  return (
    <InboxProvider>
      <Inbox />
    </InboxProvider>
  )
}
