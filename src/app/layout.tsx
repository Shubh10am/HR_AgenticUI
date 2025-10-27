
'use client';

import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';
import { usePathname } from 'next/navigation';
import AuthLayout from './(auth)/layout';

const siteConfig = {
  name: 'HR Streamline AI',
  url: 'https://agentic-hr.in',
  description: 'HR Streamline AI: The leading Agentic HR platform for email automation, recruitment automation, attendance tracking, and more. Streamline your HR operations with the power of AI Agents.',
  ogImage: '	https://www.agentic-hr.in/_next/image?url=%2Fimages%2Frecruitment.jpg&w=1200&q=75',
  links: {
    linkedin: 'https://www.linkedin.com/company/agentic-hr',
  },
  keywords: [
    'Agentic HR',
    'Streamline AI',
    'HR Streamline',
    'Email Automation',
    'Recruitment Automation',
    'AI HR',
    'HR platform',
    'attendance management',
    'streamline',
    'agentichr',
  ],
};

// Moving Metadata to a client component is not ideal, but necessary for using hooks.
// We'll manage title and meta tags in a simpler way if needed.
// export const metadata: Metadata = { ... };


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/login/magic'];
  const publicPages = ['/', '/contact', '/book-a-demo'];
  const isLegalPage = pathname.startsWith('/legal');
  const isBlogPage = pathname.startsWith('/blog');
  const isDocsPage = pathname.startsWith('/docs');
  const isOnboardingPage = pathname.startsWith('/onboarding');
  const isAdminPage = pathname.startsWith('/admin');
  
  const isAuthRoute = authRoutes.some(p => pathname.startsWith(p));
  const isPublicStandalone = publicPages.includes(pathname) || isLegalPage || isBlogPage || isDocsPage || isOnboardingPage;


  const renderContent = () => {
    if (isAuthRoute) {
      return <AuthLayout>{children}</AuthLayout>;
    }
    if (isPublicStandalone) {
      return <>{children}</>;
    }
    // Admin pages have their own layout, so they don't get wrapped by AppLayout
    if (isAdminPage) {
        return <>{children}</>;
    }
    // All other pages are part of the main application and get the AppLayout
    return <AppLayout>{children}</AppLayout>;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{siteConfig.name}</title>
        <meta name="description" content={siteConfig.description} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        
        {/* Preload notification sounds */}
        <link rel="preload" href="/sound/notification.wav" as="audio" type="audio/wav" />
        <link rel="preload" href="/sound/message.wav" as="audio" type="audio/wav" />
      </head>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {renderContent()}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
