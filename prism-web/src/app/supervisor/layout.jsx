'use client'

import { usePathname } from 'next/navigation'
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";

export default function SupervisorLayout({ children }) {
  const pathname = usePathname()

  if (pathname === '/supervisor/login' || pathname === '/supervisor/register') {
    return children
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
