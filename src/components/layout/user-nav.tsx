
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User as UserIcon, LogOut, Settings, UserCircle2 } from 'lucide-react'; // Added icons
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

export default function UserNav() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null; // Don't show user nav if not logged in (AppLayout should redirect)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://placehold.co/100x100.png?text=${user?.name?.charAt(0).toUpperCase()}`} alt={user?.name || "User avatar"} data-ai-hint="user avatar" />
            <AvatarFallback>
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {user && (
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile" passHref legacyBehavior>
            <DropdownMenuItem asChild>
              <a><UserCircle2 className="mr-2 h-4 w-4" />Profile</a>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings" passHref legacyBehavior>
            <DropdownMenuItem asChild>
              <a><Settings className="mr-2 h-4 w-4" />Settings</a>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
