
'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { generateMockHierarchy, type TreeNode } from '@/lib/hierarchy';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const EmployeeNode = ({ node, currentUserEmail }: { node: TreeNode; currentUserEmail?: string | null; }) => {
  const isCurrentUser = node.email === currentUserEmail;
  return (
    <div className="relative flex flex-col items-center group">
      {/* Employee Card */}
      <div className="relative z-10">
        <Card className={cn(
          "p-2 w-48 text-center shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-105",
          isCurrentUser ? "bg-primary text-primary-foreground border-2 border-primary-foreground/50" : "bg-card"
        )}>
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border-2 border-secondary">
              <Image src={node.avatarUrl} alt={node.name} width={40} height={40} data-ai-hint={node.dataAiHint} />
              <AvatarFallback>{node.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-left overflow-hidden">
              <p className={cn("font-semibold text-sm truncate", isCurrentUser ? "" : "text-card-foreground")}>{node.name}</p>
              <p className={cn("text-xs truncate", isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground")}>{node.role}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Children Nodes */}
      {node.children && node.children.length > 0 && (
        <>
          {/* Vertical line from parent down to the horizontal connector */}
          <div className="absolute top-full h-8 w-px bg-muted-foreground/30" />
          
          <div className="mt-8 flex justify-center relative">
            {/* Horizontal line connecting all children */}
            <div className="absolute top-0 left-0 right-0 h-px bg-muted-foreground/30" />

            {node.children.map((child) => (
              <div key={child.id} className="px-4 relative flex flex-col items-center">
                {/* Vertical line from horizontal line up to child */}
                <div className="absolute bottom-full h-px w-full" />
                <div className="absolute top-0 h-px w-full" />
                <div className="absolute top-0 h-8 w-px bg-muted-foreground/30" />
                <EmployeeNode node={child} currentUserEmail={currentUserEmail} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


export default function EmployeeHierarchyPage() {
  const { user } = useAuth();
  const mockData = useMemo(() => generateMockHierarchy(), []);
  const [zoom, setZoom] = useState(1);

  // In a real app, you would fetch real hierarchy data here
  const hierarchyData = user?.organizationId === 'guest-org-id' ? mockData : mockData;

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 1.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <>
      <PageHeader
        title="Employee Hierarchy"
        description="Visualize the reporting structure of your organization."
      >
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={handleResetZoom}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </PageHeader>

      <Card className="shadow-lg h-[calc(100vh-12rem)] overflow-hidden">
        <CardContent className="p-0 h-full w-full overflow-auto">
          <div 
            className="p-8 bg-secondary/20 inline-block min-w-full"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            {hierarchyData ? (
                <div className="flex justify-center">
                    <EmployeeNode node={hierarchyData} currentUserEmail={user?.email} />
                </div>
            ) : (
                <div className="text-center text-muted-foreground">Loading hierarchy...</div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
