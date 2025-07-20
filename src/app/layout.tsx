
import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';

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


export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} | Agentic HR & Recruitment Automation`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: 'HR Streamline AI Team',
      url: siteConfig.url,
    }
  ],
  creator: 'HR Streamline AI Team',
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@agentic-hr', // Replace with your Twitter handle
  },
  
  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  
  // Manifest
  manifest: `${siteConfig.url}/site.webmanifest`,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
            <AppLayout>{children}</AppLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
