
'use client';

import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, DollarSign, List, Edit, PlusCircle } from 'lucide-react';

const plans = [
    { name: "Free", price: 0, features: ["5 AI Interviews/month", "10 Job Descriptions/month", "Basic Support"] },
    { name: "Pro", price: 49, features: ["50 AI Interviews/month", "100 Job Descriptions/month", "Email Support"] },
    { name: "Enterprise", price: 0, features: ["Unlimited AI Interviews", "Unlimited Job Descriptions", "Dedicated Support"] }
]

export default function AdminContentManagementPage() {
  return (
    <>
      <PageHeader
        title="Content & Configuration"
        description="Manage global content like email templates and subscription plans."
      />
      
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans"><DollarSign className="mr-2 h-4 w-4" />Subscription Plans</TabsTrigger>
          <TabsTrigger value="emails"><Mail className="mr-2 h-4 w-4" />Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>Define and manage subscription tiers for organizations.</CardDescription>
                </div>
                 <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Plan
                </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <Card key={plan.name} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                {plan.name}
                                <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                            </CardTitle>
                            <CardDescription>
                                {plan.price > 0 ? `$${plan.price}/month` : "Custom Pricing"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-center">
                                        <List className="mr-2 h-4 w-4 text-primary" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Manage transactional email templates sent by the system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="template-select">Select Template to Edit</Label>
                    <Select defaultValue="welcome">
                        <SelectTrigger id="template-select">
                            <SelectValue placeholder="Choose a template" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="welcome">Welcome Email</SelectItem>
                            <SelectItem value="password-reset">Password Reset</SelectItem>
                            <SelectItem value="subscription-receipt">Subscription Receipt</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email-subject">Email Subject</Label>
                    <Input id="email-subject" defaultValue="Welcome to HR Streamline AI!" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email-body">Email Body</Label>
                    <Textarea
                        id="email-body"
                        className="min-h-[250px] font-mono text-xs"
                        defaultValue="Hello {{name}},\n\nWelcome to HR Streamline AI! We're excited to have you on board.\n\nRegards,\nThe Team"
                    />
                     <p className="text-xs text-muted-foreground">Use Handlebars syntax (e.g., `{{name}}`) for dynamic content.</p>
                </div>
              <Button>Save Template</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
