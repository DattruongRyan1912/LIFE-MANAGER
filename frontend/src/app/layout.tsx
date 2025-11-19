import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Life Manager AI - Trợ lý cuộc sống thông minh",
  description: "Ứng dụng quản lý cuộc sống với AI - Tasks, Expenses, Study Goals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Sidebar - Fixed Left */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="ml-64 min-h-screen">
          {/* Theme Toggle - Fixed top right */}
          <div className="fixed top-6 right-6 z-50">
            <ThemeToggle />
          </div>
          
          {/* Page Content */}
          <main className="p-8">
            {children}
          </main>
        </div>
        
        {/* Toast Notifications */}
        <Toaster />
      </body>
    </html>
  );
}
