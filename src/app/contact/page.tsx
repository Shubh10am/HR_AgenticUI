'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/icons/logo';

export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Mock submission
    console.log('Contact form submitted:', { name, email, subject, message });

    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: 'Message Sent (Mock)',
        description: 'Thank you for contacting us! We will get back to you shortly.',
      });
      // Clear form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-black/50 backdrop-blur-lg">
        <div className="container flex h-20 items-center justify-between mx-auto px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg text-white">HR Streamline AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-white hover:bg-neutral-800 hover:text-white hidden sm:flex">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-white text-black hover:bg-neutral-200 rounded-full">
              <Link href="/register">Try Now</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4">Contact Us</h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">Welcome to Agentic-Era. We'd love to hear from you. Please fill out the form below or reach out to us directly.</p>
        </div>
        
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
            <Card className="shadow-lg bg-neutral-900 border-neutral-800 text-white">
                <CardHeader>
                <CardTitle className="text-2xl">Send a Message</CardTitle>
                <CardDescription className="text-neutral-400">Our team will respond to you as soon as possible.</CardDescription>
                </CardHeader>
                <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        disabled={isSubmitting}
                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="company@domain.com"
                        required
                        disabled={isSubmitting}
                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                        />
                    </div>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Regarding..."
                        required
                        disabled={isSubmitting}
                        className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Your message here..."
                        className="min-h-[150px] bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                        required
                        disabled={isSubmitting}
                    />
                    </div>
                    <Button type="submit" className="w-full bg-white text-black hover:bg-neutral-200" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Message
                    </Button>
                </form>
                </CardContent>
            </Card>
            </div>

            <div className="md:col-span-1 space-y-6">
            <Card className="shadow-lg bg-neutral-900 border-neutral-800 text-white">
                <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-neutral-400 text-sm">support@agentic-hr.in</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                    <h4 className="font-semibold">Phone Number</h4>
                    <p className="text-neutral-400 text-sm">+91 6388842678</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                    <h4 className="font-semibold">Address</h4>
                    <p className="text-neutral-400 text-sm">Office 61 Satyam Home Green City Noida 201009</p>
                    </div>
                </div>
                </CardContent>
            </Card>
            </div>
        </div>
      </main>

      <footer className="border-t border-neutral-800">
        <div className="container py-6 text-center text-sm text-neutral-500 px-4 sm:px-6">
          © {new Date().getFullYear()} HR Streamline AI. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
