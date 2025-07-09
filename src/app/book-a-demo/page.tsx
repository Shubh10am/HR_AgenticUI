'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, Mail, Phone, MapPin, Send, Loader2, Hash, Linkedin, X, Instagram, Youtube } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/icons/logo';

export default function BookDemoPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Mock submission
    console.log('Demo request submitted:', { name, companyName, email, companySize, message });

    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: 'Demo Request Sent (Mock)',
        description: 'Thank you for your interest! Our team will reach out shortly to schedule your demo.',
      });
      // Clear form
      setName('');
      setCompanyName('');
      setEmail('');
      setCompanySize('');
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4">Book Your Demo</h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">See HR Streamline AI in action. Fill out the form to schedule a personalized demo with our team.</p>
        </div>
        
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
            <Card className="shadow-lg bg-neutral-900 border-neutral-800 text-white">
                <CardHeader>
                <CardTitle className="text-2xl">Schedule a Demo</CardTitle>
                <CardDescription className="text-neutral-400">Let's find a time that works for you.</CardDescription>
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
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Your Company Inc."
                            required
                            disabled={isSubmitting}
                            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Work Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            required
                            disabled={isSubmitting}
                            className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="companySize">Company Size</Label>
                        <Select value={companySize} onValueChange={setCompanySize} required disabled={isSubmitting}>
                            <SelectTrigger id="companySize" className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500">
                                <SelectValue placeholder="Select number of employees" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                                <SelectItem value="1-10">1-10 employees</SelectItem>
                                <SelectItem value="11-50">11-50 employees</SelectItem>
                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                <SelectItem value="201-1000">201-1000 employees</SelectItem>
                                <SelectItem value="1000+">1000+ employees</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="message">Anything specific you'd like to see? (Optional)</Label>
                    <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g., I'm interested in the recruitment automation features..."
                        className="min-h-[120px] bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                        disabled={isSubmitting}
                    />
                    </div>
                    <Button type="submit" className="w-full bg-white text-black hover:bg-neutral-200" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Calendar className="mr-2 h-4 w-4" />
                    )}
                    Request Demo
                    </Button>
                </form>
                </CardContent>
            </Card>
            </div>

            <div className="md:col-span-1 space-y-6">
            <Card className="shadow-lg bg-neutral-900 border-neutral-800 text-white">
                <CardHeader>
                <CardTitle>What to Expect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-neutral-400">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p>A personalized walkthrough of the platform based on your needs.</p>
                  </div>
                   <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p>Answers to your specific questions from a product expert.</p>
                  </div>
                   <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p>No commitment required. Just a conversation to see if we're a good fit.</p>
                  </div>
                </CardContent>
            </Card>
            <Card className="shadow-lg bg-neutral-900 border-neutral-800 text-white">
                <CardHeader>
                <CardTitle>Contact Sales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                      <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                      <h4 className="font-semibold">Email</h4>
                      <p className="text-neutral-400 text-sm">sales@agentic-hr.in</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-4">
                      <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                      <h4 className="font-semibold">Phone</h4>
                      <p className="text-neutral-400 text-sm">+91 6388842678</p>
                      </div>
                  </div>
                </CardContent>
            </Card>
            </div>
        </div>
      </main>

      <footer className="border-t border-neutral-800 bg-black text-white">
        <div className="container mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Logo className="h-8 w-8 text-primary" />
                <span className="font-bold text-lg text-white">HR Streamline AI</span>
              </Link>
              <ul className="space-y-2">
                <li><Link href="/recruitment" className="text-neutral-400 hover:text-white">For Recruitment</Link></li>
                <li><Link href="/tasks" className="text-neutral-400 hover:text-white">For Onboarding</Link></li>
                <li><Link href="/attendance-reporting" className="text-neutral-400 hover:text-white">For Reporting</Link></li>
                <li><Link href="/unified-communications" className="text-neutral-400 hover:text-white">For Communication</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Integrations</h3>
              <ul className="space-y-2">
                <li><Link href="/integrations" className="text-neutral-400 hover:text-white">Slack</Link></li>
                <li><Link href="/integrations" className="text-neutral-400 hover:text-white">Gmail</Link></li>
                <li><Link href="/integrations" className="text-neutral-400 hover:text-white">Google Calendar</Link></li>
                <li><Link href="/integrations" className="text-neutral-400 hover:text-white">GitHub</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-neutral-400 hover:text-white">Contact Us</Link></li>
                <li><Link href="#" className="text-neutral-400 hover:text-white">Blog</Link></li>
                <li><Link href="#" className="text-neutral-400 hover:text-white">Docs</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/legal/security" className="text-neutral-400 hover:text-white">Security</Link></li>
                <li><Link href="/legal/privacy" className="text-neutral-400 hover:text-white">Privacy</Link></li>
                <li><Link href="/legal/terms" className="text-neutral-400 hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-800">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between py-6 text-sm text-neutral-500 px-4 sm:px-6 sm:pr-20">
            <div className="flex items-center gap-6 order-2 sm:order-1 mt-4 sm:mt-0">
                <Link href="#" className="hover:text-white transition-colors"><Hash className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-white transition-colors"><X className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-white transition-colors"><Youtube className="h-5 w-5" /></Link>
            </div>
            <div className="order-1 sm:order-2">
              © {new Date().getFullYear()} HR Streamline AI. All Rights Reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
