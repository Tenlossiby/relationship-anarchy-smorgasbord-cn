'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, FolderOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Compass, label: '探索' },
  { href: '/profiles', icon: FolderOpen, label: '档案' },
  { href: '/settings', icon: Settings, label: '设置' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 transition-transform duration-200',
                isActive && 'scale-110'
              )} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
