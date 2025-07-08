
import type { Metadata } from 'next';
import { Poppins, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { ClientStyleApplicator } from '@/components/client-style-applicator'; // Added import

const poppins = Poppins({
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'HR Streamline AI',
  description: 'All-in-one intelligent assistant for HR operations, powered by AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* ClientStyleApplicator should ideally be inside <html> but outside <body> if it modifies <html> classes */}
      {/* It runs client-side useEffect, so placement isn't super critical for its JS execution, but for initial class application logic. */}
      <head>
        {/* Traditional place for scripts that might modify classes early, though Next.js handles this differently.
            The component itself will run its useEffect after mount.
            Adding suppressHydrationWarning to <html> is key if its classList is modified client-side. */}
      </head>
      <body className={`${poppins.variable} ${geistMono.variable} antialiased`}>
        <ClientStyleApplicator /> {/* Add this here to run its useEffect */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider> {/* AuthProvider inside ThemeProvider */}
            <AppLayout>{children}</AppLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
