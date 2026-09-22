'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Compass, FolderOpen, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

type TabKey = 'explore' | 'profiles' | 'about';

const navItems: { key: TabKey; href: string; icon: typeof Compass; label: string }[] = [
  { key: 'explore', href: '/', icon: Compass, label: '探索' },
  { key: 'profiles', href: '/profiles', icon: FolderOpen, label: '档案' },
  { key: 'about', href: '/settings', icon: Info, label: '关于' },
];

const routeStorageKey = (key: TabKey) => `ra_tab_route_${key}`;
const scrollStorageKey = (path: string) => `ra_tab_scroll_${path}`;

function getTabKey(pathname: string, search = ''): TabKey {
  if (pathname.startsWith('/settings')) return 'about';
  if (
    pathname === '/' ||
    pathname.startsWith('/explore') ||
    pathname === '/profiles/select' ||
    (pathname === '/profiles/new' && search.includes('categories='))
  ) return 'explore';
  return 'profiles';
}

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [destinations, setDestinations] = useState<Record<TabKey, string>>({
    explore: '/',
    profiles: '/profiles',
    about: '/settings',
  });

  useEffect(() => {
    const storedDestinations = {} as Record<TabKey, string>;
    for (const item of navItems) {
      storedDestinations[item.key] = window.sessionStorage.getItem(routeStorageKey(item.key)) || item.href;
    }

    const currentPath = `${window.location.pathname}${window.location.search}`;
    const currentKey = getTabKey(window.location.pathname, window.location.search);
    storedDestinations[currentKey] = currentPath;
    window.sessionStorage.setItem(routeStorageKey(currentKey), currentPath);
    setDestinations(storedDestinations);

    const savedScroll = Number(window.sessionStorage.getItem(scrollStorageKey(currentPath)) || 0);
    if (savedScroll > 0) {
      window.requestAnimationFrame(() => window.scrollTo({ top: savedScroll }));
    }
  }, [pathname]);

  const currentTab = getTabKey(pathname, typeof window === 'undefined' ? '' : window.location.search);

  const rememberCurrentPosition = () => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const currentKey = getTabKey(window.location.pathname, window.location.search);
    window.sessionStorage.setItem(routeStorageKey(currentKey), currentPath);
    window.sessionStorage.setItem(scrollStorageKey(currentPath), String(window.scrollY));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = currentTab === item.key;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.key}
              href={destinations[item.key]}
              onClick={rememberCurrentPosition}
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
              <span className="text-xs font-medium">{t(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
