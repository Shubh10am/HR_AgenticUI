
'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertTriangle, MoreHorizontal, Trash2, Mail, CalendarCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface DemoRequest {
  _id: string;
  name: string;
  email: string;
  companyName: string;
  companySize: string;
  message: string;
  createdAt: string;
}

type ItemToDelete = {
  id: string;
  type: 'contact' | 'demo';
  identifier: string; // e.g., name or email
};

export default function AdminCustomerInquiriesPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [demos, setDemos] = useState<DemoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();
  const { token } = useAuth();

  const fetchData = useCallback(async () => {
    if (!token) {
      setError('Authentication token not found.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [contactsRes, demosRes] = await Promise.all([
        fetch('/api/admin/customer-inquiries?type=contact', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/admin/customer-inquiries?type=demo', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!contactsRes.ok || !demosRes.ok) {
        throw new Error('Failed to fetch customer inquiries.');
      }
      const contactsData = await contactsRes.json();
      const demosData = await demosRes.json();
      setContacts(contactsData);
      setDemos(demosData);
    } catch (e: any) {
      setError(e.message);
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!itemToDelete || !token) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/customer-inquiries/${itemToDelete.id}?type=${itemToDelete.type}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast({ title: 'Success', description: `Inquiry from ${itemToDelete.identifier} has been deleted.` });
      fetchData(); // Refresh list
    } catch (e: any) {
      toast({ title: 'Error Deleting Inquiry', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading inquiries...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="mt-2 text-destructive font-semibold">Failed to load inquiries</p>
          <p className="text-sm text-destructive/80">{error}</p>
        </div>
      );
    }

    return (
      <Tabs defaultValue="contact">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contact">Contact Submissions ({contacts.length})</TabsTrigger>
          <TabsTrigger value="demo">Demo Requests ({demos.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="contact" className="mt-4">
          <Card className="shadow-inner">
            <CardHeader>
                <CardTitle className="flex items-center"><Mail className="mr-2 h-5 w-5"/> Contact Form Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="h-24 text-center">No contact submissions found.</TableCell></TableRow>
                    ) : (
                      contacts.map((c) => (
                        <TableRow key={c._id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell className="max-w-xs truncate">{c.subject}</TableCell>
                          <TableCell>{format(new Date(c.createdAt), 'PPP')}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => setItemToDelete({ id: c._id, type: 'contact', identifier: c.name })}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="demo" className="mt-4">
           <Card className="shadow-inner">
            <CardHeader>
                 <CardTitle className="flex items-center"><CalendarCheck className="mr-2 h-5 w-5"/> Demo Requests</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Company Size</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demos.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="h-24 text-center">No demo requests found.</TableCell></TableRow>
                    ) : (
                      demos.map((d) => (
                        <TableRow key={d._id}>
                          <TableCell className="font-medium">{d.name}</TableCell>
                          <TableCell>{d.email}</TableCell>
                          <TableCell>{d.companyName}</TableCell>
                          <TableCell>{d.companySize}</TableCell>
                          <TableCell>{format(new Date(d.createdAt), 'PPP')}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => setItemToDelete({ id: d._id, type: 'demo', identifier: d.name })}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <>
      <PageHeader
        title="Customer Inquiries"
        description="View and manage submissions from your public-facing forms."
      />
      {renderContent()}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the inquiry from{" "}
              <strong>{itemToDelete?.identifier}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, delete inquiry
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
