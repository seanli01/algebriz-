import { Inter } from 'next/font/google'
import './globals.css'
import { SocketProvider } from '@/components/Multiplayer/SocketContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Algebriz',
  description: 'A gameified digital quiz for practicing and studying math',
}

export default function RootLayout({ children }) {
  return (
    <SocketProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </SocketProvider>
  )
}
