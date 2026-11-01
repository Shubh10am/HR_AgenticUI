'use client';

import { DollarSign, Mail } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailTemplatesTab from './components/email-templates-tab';
import PlansTab from './components/plans-tab';

export default function AdminContentManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Content & Configuration" description="Subscription plans and the wording of every email the platform sends." />
      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger id="admin-content-tab-plans" value="plans"><DollarSign className="mr-2 h-4 w-4" />Subscription plans</TabsTrigger>
          <TabsTrigger id="admin-content-tab-emails" value="emails"><Mail className="mr-2 h-4 w-4" />Email templates</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="mt-4"><PlansTab /></TabsContent>
        <TabsContent value="emails" className="mt-4"><EmailTemplatesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
