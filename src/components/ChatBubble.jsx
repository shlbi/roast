import { replaceBannedAddressWithBro } from '../lib/parse.js'

export default function ChatBubble({ role, content, tone = 'default' }) {
  return (
    <div className={`chat-row ${role}`}>
      <div className={`chat-bubble ${role} ${tone}`}>{replaceBannedAddressWithBro(content)}</div>
    </div>
  )
}
