// The header's unread badge listens for this event; fire it after messages are read or sent.
export const MESSAGES_CHANGED = 'messages:changed'

export const notifyUnreadChanged = () => window.dispatchEvent(new Event(MESSAGES_CHANGED))
