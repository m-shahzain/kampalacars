import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MessagesClient } from './messages-client'

export const metadata: Metadata = {
  title: 'Messages',
  robots: { index: false, follow: false },
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesClient />
    </Suspense>
  )
}
