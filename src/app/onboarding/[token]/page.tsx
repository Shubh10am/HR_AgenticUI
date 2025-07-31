'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Home, Phone, UploadCloud, CheckCircle } from 'lucide-react';
import Logo from '@/components/icons/logo';
import Link from 'next/link';

const FileUploadField = ({ label, id }: { label: string; id: string }) => (
    <div className="space-y-2">
        <Label htmlFor={id}>{label} (.pdf, .jpg, .png)</Label>
        <div className="flex items-center gap-2 p-2 border rounded-md bg-secondary/30">
            <UploadCloud className="h-5 w-5 text-muted-foreground"/>
            <span className="text-sm text-muted-foreground flex-grow">No file selected</span>
            <Button type="button" variant="outline" size="sm" className="flex-shrink-0">Choose File</Button>
        </div>
    </div>
);

export default function OnboardingPortalPage({ params }: { params: { token: string } }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    // Mock submission
    setTimeout(() => {
      toast({
        title: 'Information Submitted!',
        description: 'Thank you! Your details have been sent to HR for review.',
      });
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2000);
  };

  if (isSubmitted) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4"/>
              <h1 className="text-3xl font-bold mb-2">Onboarding Complete!</h1>
              <p className="text-muted-foreground mb-6 max-w-md">Your information has been successfully submitted for review. The HR team will get in touch with you regarding the next steps. Welcome aboard!</p>
              <Button asChild>
                  <Link href="/">Back to Home</Link>
              </Button>
          </div>
      )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2 mb-6 text-foreground">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg">HR Streamline AI</span>
        </Link>
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to the Team!</CardTitle>
          <CardDescription>Please complete your onboarding profile below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Information */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" type="date" required disabled={isSubmitting}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Emergency Contact</Label>
                        <Input id="emergencyContact" type="tel" required disabled={isSubmitting}/>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="address">Current Address</Label>
                    <Textarea id="address" required disabled={isSubmitting} placeholder="123 Main St, Anytown, USA 12345"/>
                </div>
            </div>

            {/* Document Uploads */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg flex items-center"><UploadCloud className="mr-2 h-5 w-5 text-primary"/>Document Upload</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FileUploadField id="pan" label="PAN Card"/>
                    <FileUploadField id="aadhar" label="Aadhar Card"/>
                    <FileUploadField id="resume" label="Updated Resume"/>
                    <FileUploadField id="photo" label="Passport Size Photo"/>
                    <FileUploadField id="education" label="Educational Certificates"/>
                    <FileUploadField id="bank" label="Bank Details (Cancelled Cheque)"/>
                </div>
                <p className="text-xs text-muted-foreground">This is a simulated upload. In a real application, you would be able to select and upload your files securely.</p>
            </div>
            
            {/* Digital Acknowledgments */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Digital Acknowledgments</h3>
                <div className="flex items-start space-x-2">
                    <Checkbox id="terms" required disabled={isSubmitting}/>
                    <div className="grid gap-1.5 leading-none">
                        <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        I acknowledge that I have read and agree to the <Link href="/legal/terms" className="text-primary underline">Company Policies</Link>, <Link href="/legal/terms" className="text-primary underline">Offer Letter</Link>, and <Link href="/legal/terms" className="text-primary underline">NDA</Link>.
                        </label>
                    </div>
                </div>
            </div>
            
            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Submit Onboarding Information"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}