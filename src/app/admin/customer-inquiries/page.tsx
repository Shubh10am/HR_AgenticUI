
'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertTriangle, Trash2, Mail, CalendarCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface DemoRequest {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName: string;
  companySize: string;
  message: string;
  createdAt: string;
}

type ItemToDelete = {
  id: string;
  type: 'contact' | 'demo';
  identifier: string;
};

type ItemToView = (ContactSubmission | DemoRequest) & { type: 'contact' | 'demo' };


export default function AdminCustomerInquiriesPage() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [demos, setDemos] = useState<DemoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToView, setItemToView] = useState<ItemToView | null>(null);


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
          <TabsTrigger id="admin-inquiries-tab-contact" value="contact" className="min-w-0"><span className="truncate"><span className="hidden sm:inline">Contact Submissions</span><span className="sm:hidden">Contact</span> ({contacts.length})</span></TabsTrigger>
          <TabsTrigger id="admin-inquiries-tab-demo" value="demo" className="min-w-0"><span className="truncate"><span className="hidden sm:inline">Demo Requests</span><span className="sm:hidden">Demos</span> ({demos.length})</span></TabsTrigger>
        </TabsList>
        <TabsContent value="contact" className="mt-4">
          <Card className="shadow-inner">
            <CardHeader>
                <CardTitle className="flex items-center"><Mail className="mr-2 h-5 w-5"/> Contact Form Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table scroll>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden xl:table-cell">Phone</TableHead>
                      <TableHead className="hidden sm:table-cell">Subject</TableHead>
                      <TableHead className="hidden lg:table-cell whitespace-nowrap">Date</TableHead>
                      <TableHead className="w-12 text-right"><span className="sr-only sm:not-sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="h-24 text-center">No contact submissions found.</TableCell></TableRow>
                    ) : (
                      contacts.map((c) => (
                        <TableRow key={c._id} onClick={() => setItemToView({ ...c, type: 'contact' })} className="cursor-pointer">
                          <TableCell className="max-w-[170px] sm:max-w-[220px]">
                            <div className="truncate font-medium">{c.name}</div>
                            <div className="truncate text-xs text-muted-foreground md:hidden">{c.email}</div>
                            <div className="truncate text-xs text-muted-foreground sm:hidden">{c.subject}</div>
                            <div className="text-xs text-muted-foreground lg:hidden">{format(new Date(c.createdAt), 'd MMM yyyy')}</div>
                          </TableCell>
                          <TableCell className="hidden max-w-[240px] truncate md:table-cell">{c.email}</TableCell>
                          <TableCell className="hidden whitespace-nowrap xl:table-cell">{c.phone || 'N/A'}</TableCell>
                          <TableCell className="hidden max-w-[320px] truncate sm:table-cell">{c.subject}</TableCell>
                          <TableCell className="hidden whitespace-nowrap lg:table-cell">{format(new Date(c.createdAt), 'd MMM yyyy')}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setItemToDelete({ id: c._id, type: 'contact', identifier: c.name }); }}>
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
               <div className="rounded-md border">
                <Table scroll>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden xl:table-cell">Phone</TableHead>
                      <TableHead className="hidden sm:table-cell">Company</TableHead>
                      <TableHead className="hidden xl:table-cell whitespace-nowrap">Company Size</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                      <TableHead className="w-12 text-right"><span className="sr-only sm:not-sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demos.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="h-24 text-center">No demo requests found.</TableCell></TableRow>
                    ) : (
                      demos.map((d) => (
                        <TableRow key={d._id} onClick={() => setItemToView({ ...d, type: 'demo' })} className="cursor-pointer">
                          <TableCell className="max-w-[170px] sm:max-w-[220px]">
                            <div className="truncate font-medium">{d.name}</div>
                            <div className="truncate text-xs text-muted-foreground md:hidden">{d.email}</div>
                            <div className="truncate text-xs text-muted-foreground sm:hidden">{d.companyName}</div>
                            <div className="text-xs text-muted-foreground lg:hidden">{format(new Date(d.createdAt), 'd MMM yyyy')}</div>
                          </TableCell>
                          <TableCell className="hidden max-w-[240px] truncate md:table-cell">{d.email}</TableCell>
                          <TableCell className="hidden whitespace-nowrap xl:table-cell">{d.phone || 'N/A'}</TableCell>
                          <TableCell className="hidden max-w-[200px] truncate sm:table-cell">{d.companyName}</TableCell>
                          <TableCell className="hidden whitespace-nowrap xl:table-cell">{d.companySize}</TableCell>
                          <TableCell className="hidden whitespace-nowrap lg:table-cell">{format(new Date(d.createdAt), 'd MMM yyyy')}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setItemToDelete({ id: d._id, type: 'demo', identifier: d.name }); }}>
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

      <Dialog open={!!itemToView} onOpenChange={(open) => !open && setItemToView(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              Full submission from {itemToView?.name}.
            </DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="py-4 space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-2">
                    <strong className="col-span-1">Name:</strong>
                    <span className="col-span-2">{itemToView.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <strong className="col-span-1">Email:</strong>
                    <span className="col-span-2">{itemToView.email}</span>
                </div>
                 <div className="grid grid-cols-3 gap-2">
                    <strong className="col-span-1">Phone:</strong>
                    <span className="col-span-2">{itemToView.phone || 'N/A'}</span>
                </div>
                {itemToView.type === 'contact' && 'subject' in itemToView && (
                    <div className="grid grid-cols-3 gap-2">
                        <strong className="col-span-1">Subject:</strong>
                        <span className="col-span-2">{itemToView.subject}</span>
                    </div>
                )}
                 {itemToView.type === 'demo' && 'companyName' in itemToView && (
                    <>
                        <div className="grid grid-cols-3 gap-2">
                            <strong className="col-span-1">Company:</strong>
                            <span className="col-span-2">{itemToView.companyName}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <strong className="col-span-1">Size:</strong>
                            <span className="col-span-2">{itemToView.companySize}</span>
                        </div>
                    </>
                )}
                <div className="grid grid-cols-3 gap-2">
                    <strong className="col-span-1">Submitted:</strong>
                    <span className="col-span-2">{format(new Date(itemToView.createdAt), 'PPP p')}</span>
                </div>
                <div className="space-y-1">
                    <strong>Message:</strong>
                    <div className="p-3 bg-secondary rounded-md max-h-60 overflow-y-auto whitespace-pre-wrap">
                        {itemToView.message}
                    </div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
