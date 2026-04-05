'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Package, ShoppingCart, Settings, Menu, X, LogOut, Coins } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { logoutAction } from '@/actions/auth';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPaths?: string[];
}

interface NavigationProps {
  role: 'ADMINISTRATOR' | 'MANAGER' | 'MEMBER';
  userName?: string;
}

export function Navigation({ role, userName }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [compactLevel, setCompactLevel] = useState<'full' | 'medium' | 'compact' | 'icons-only'>('full');
  const navContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const adminNavItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
    {
      href: '/admin/sales-customers/sales',
      label: 'Penjualan & Member',
      icon: <ShoppingCart className="w-4 h-4" />,
      matchPaths: ['/admin/sales-customers/sales', '/admin/sales-customers/customers'],
    },
    {
      href: '/admin/inventory/products',
      label: 'Inventori',
      icon: <Package className="w-4 h-4" />,
      matchPaths: ['/admin/inventory/products', '/admin/inventory/stock', '/admin/inventory/reports'],
    },
    {
      href: '/admin/finance/cashflow',
      label: 'Keuangan',
      icon: <Coins className="w-4 h-4" />,
      matchPaths: ['/admin/finance/cashflow', '/admin/finance/reports'],
    },
    {
      href: '/admin/settings/points',
      label: 'Pengaturan',
      icon: <Settings className="w-4 h-4" />,
      matchPaths: ['/admin/settings/points', '/admin/settings/profile'],
    },
  ];

  const managerNavItems: NavItem[] = [
    { href: '/manager', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
    {
      href: '/manager/sales-customers/sales',
      label: 'Penjualan & Member',
      icon: <ShoppingCart className="w-4 h-4" />,
      matchPaths: ['/manager/sales-customers/sales', '/manager/sales-customers/customers'],
    },
    {
      href: '/manager/inventory/products',
      label: 'Inventori',
      icon: <Package className="w-4 h-4" />,
      matchPaths: ['/manager/inventory/products', '/manager/inventory/stock'],
    },
  ];

  const memberNavItems: NavItem[] = [
    { href: '/member', label: 'My Points', icon: <Home className="w-4 h-4" /> },
    { href: '/member/purchases', label: 'Riwayat Belanja', icon: <ShoppingCart className="w-4 h-4" /> },
  ];

  const navItems =
    role === 'ADMINISTRATOR' ? adminNavItems :
    role === 'MANAGER' ? managerNavItems :
    memberNavItems;

  const isNavItemActive = (item: NavItem) => {
    if (pathname === item.href) return true;
    if (item.matchPaths) return item.matchPaths.some((path) => pathname.startsWith(path));
    return false;
  };

  useEffect(() => {
    const checkNavSpace = () => {
      if (!navContainerRef.current) return;
      const container = navContainerRef.current;
      const containerWidth = container.offsetWidth;
      const screenWidth = window.innerWidth;
      const userInfoWidth = screenWidth >= 1280 ? 280 : screenWidth >= 1024 ? 160 : 0;
      const availableNavWidth = containerWidth - userInfoWidth;
      const itemCount = navItems.length;

      if (availableNavWidth >= itemCount * 140) setCompactLevel('full');
      else if (availableNavWidth >= itemCount * 100) setCompactLevel('medium');
      else if (availableNavWidth >= itemCount * 75) setCompactLevel('compact');
      else setCompactLevel('icons-only');
    };

    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(checkNavSpace, 50);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (navContainerRef.current) resizeObserver.observe(navContainerRef.current);

    checkNavSpace();
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [navItems.length]);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const getNavItemStyles = () => {
    switch (compactLevel) {
      case 'full':    return { gap: 'gap-2',   padding: 'px-4 py-2', textWidth: 'w-auto', textOpacity: 'opacity-100' };
      case 'medium':  return { gap: 'gap-2',   padding: 'px-3 py-2', textWidth: 'w-auto', textOpacity: 'opacity-100' };
      case 'compact': return { gap: 'gap-1.5', padding: 'px-2 py-2', textWidth: 'w-auto', textOpacity: 'opacity-100' };
      case 'icons-only': return { gap: 'gap-1', padding: 'p-2.5',   textWidth: 'w-0',    textOpacity: 'opacity-0' };
    }
  };

  const navStyles = getNavItemStyles();
  const showTooltip = compactLevel === 'icons-only';

  return (
    <nav className="bg-white/95 border-b border-[#a8f0f8] sticky top-0 z-40 shadow-md backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Left side - Logo and Desktop Nav */}
          <div className="flex items-center flex-1 min-w-0 gap-3 sm:gap-4 lg:gap-6">
            <div className="flex-shrink-0">
              <h1 className="text-lg font-bold text-[#028697] whitespace-nowrap">
                Sales Record
              </h1>
            </div>

            <div
              ref={navContainerRef}
              className="hidden lg:flex flex-1 items-center overflow-x-auto scrollbar-hide"
            >
              <div className={`flex items-center transition-all duration-500 ease-in-out ${navStyles.gap}`}>
                {navItems.map((item) => {
                  const isActive = isNavItemActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={showTooltip ? item.label : undefined}
                      className={`
                        relative z-10 group inline-flex items-center justify-center
                        font-medium rounded-lg transition-all duration-500 ease-in-out
                        ${navStyles.gap} ${navStyles.padding}
                        ${isActive
                          ? 'bg-[#028697] text-white shadow-lg scale-105'
                          : 'text-gray-600 hover:text-[#028697] hover:bg-[#e0f9fc] hover:scale-105'
                        }
                      `}
                    >
                      <span className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                        {item.icon}
                      </span>
                      <span className={`
                        whitespace-nowrap font-medium overflow-hidden
                        transition-all duration-500 ease-in-out
                        ${navStyles.textWidth} ${navStyles.textOpacity}
                        ${compactLevel === 'compact' ? 'text-xs' : 'text-sm'}
                      `}>
                        {item.label}
                      </span>
                      <span className={`
                        absolute inset-0 -z-10 rounded-lg
                        group-hover:opacity-100 transition-opacity duration-300
                        ${isActive ? 'bg-white/10' : 'bg-[#028697]/5'}
                      `} />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right side - User Info and Logout */}
          <div className={`
            hidden lg:flex items-center flex-shrink-0
            transition-all duration-500 ease-in-out
            ${compactLevel === 'icons-only' ? 'gap-1 ml-2' :
              compactLevel === 'compact' ? 'gap-2 ml-3' : 'gap-3 ml-6'}
          `}>
            <div className={`
              text-sm text-right transition-all duration-500 ease-in-out overflow-hidden
              ${compactLevel === 'icons-only' ? 'w-0 opacity-0' : 'opacity-100'}
            `}>
              <p className={`
                font-medium text-gray-900 whitespace-nowrap transition-all duration-300
                ${compactLevel === 'medium' ? 'text-xs' : 'text-sm'}
                hidden xl:block
              `}>
                {userName || 'User'}
              </p>
              <span className={`
                inline-flex items-center px-2 py-0.5 rounded-full font-medium
                bg-[#e0f9fc] text-[#0fa8be] whitespace-nowrap
                transition-all duration-300
                ${compactLevel === 'medium' ? 'text-[10px]' : 'text-xs'}
              `}>
                {role}
              </span>
            </div>

            <form action={logoutAction}>
              <Button
                variant="outline"
                size="sm"
                type="submit"
                className={`
                  group relative overflow-hidden whitespace-nowrap
                  border-[#a8f0f8] text-[#028697]
                  hover:bg-red-50 hover:border-red-300 hover:text-red-600
                  transition-all duration-500 ease-in-out
                  ${compactLevel === 'icons-only' ? 'px-2' : 'px-3'}
                  hover:scale-105 hover:shadow-md
                `}
              >
                <LogOut className={`
                  w-4 h-4 transition-all duration-300
                  ${compactLevel === 'icons-only' ? '' : 'xl:mr-2'}
                  group-hover:rotate-12
                `} />
                <span className={`
                  transition-all duration-500 ease-in-out overflow-hidden inline-block
                  ${compactLevel === 'icons-only' ? 'w-0 opacity-0' : 'w-0 opacity-0 xl:w-auto xl:opacity-100'}
                `}>
                  Logout
                </span>
              </Button>
            </form>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden ml-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative inline-flex items-center justify-center p-2 rounded-md transition-all duration-300 hover:scale-110 text-[#028697] hover:bg-[#e0f9fc]"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {mobileMenuOpen ? (
                <X className="w-6 h-6 transition-transform duration-300 rotate-90" />
              ) : (
                <Menu className="w-6 h-6 transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`
        lg:hidden overflow-hidden text-xs
        transition-all duration-500 ease-in-out
        ${mobileMenuOpen ? 'max-h-[800px] border-t border-[#a8f0f8] shadow-2xl' : 'max-h-0'}
      `}>
        <div className={`
          bg-white transition-all duration-400
          ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        `}>
          <div className="px-3 pt-3 pb-3 space-y-1.5">
            {navItems.map((item, index) => {
              const isActive = isNavItemActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    text-xs font-medium transition-all duration-300 ease-out
                    ${isActive
                      ? 'bg-[#028697] text-white shadow-lg scale-102'
                      : 'text-gray-700 hover:text-[#028697] hover:bg-[#e0f9fc]'
                    }
                  `}
                  style={{ transitionDelay: mobileMenuOpen ? `${index * 30}ms` : '0ms' }}
                >
                  <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="relative">
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/50 rounded-full" />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Mobile User Info and Logout */}
          <div className="pt-4 pb-4 border-t border-[#a8f0f8] bg-gradient-to-b from-[#f0fdfe] to-white">
            <div
              className="px-5 mb-3 transition-all duration-300"
              style={{ transitionDelay: mobileMenuOpen ? `${navItems.length * 30}ms` : '0ms' }}
            >
              <div className="text-sm font-bold text-gray-900">{userName || 'User'}</div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#e0f9fc] text-[#0fa8be] mt-1.5">
                {role}
              </span>
            </div>
            <div
              className="px-3 transition-all duration-300"
              style={{ transitionDelay: mobileMenuOpen ? `${(navItems.length + 1) * 30}ms` : '0ms' }}
            >
              <form action={logoutAction}>
                <Button
                  variant="outline"
                  className="w-full border-[#a8f0f8] text-[#028697] hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-300"
                  type="submit"
                >
                  <LogOut className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}