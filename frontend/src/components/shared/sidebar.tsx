'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import React, { useState } from 'react';

import { FolderOpen, Menu, PenTool, Settings, Sidebar, X } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

enum SidebarTab {
  CREATE = 'Create',
  PROJECTS = 'Projects',
  SETTINGS = 'Settings',
}

interface SidebarTabInfo {
  value: SidebarTab;
  icon: React.ReactNode;
  path: string;
}

const sidebarTabs: SidebarTabInfo[] = [
  { value: SidebarTab.CREATE, icon: <PenTool size={16} />, path: '/' },
  {
    value: SidebarTab.PROJECTS,
    icon: <FolderOpen size={16} />,
    path: '/projects',
  },
  {
    value: SidebarTab.SETTINGS,
    icon: <Settings size={16} />,
    path: '/settings',
  },
];

interface SidebarViewProps {
  children: React.ReactNode;
}

interface SidebarItemProps {
  tab: SidebarTabInfo;
  isSelected: boolean;
  isHovered: boolean;
  isExpanded: boolean;
  onHover: (isHovering: boolean) => void;
  onMobileClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  tab,
  isSelected,
  isHovered,
  isExpanded,
  onHover,
  onMobileClick,
}) => {
  const content = (
    <div
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`transition-all duration-200 ease-in-out ${
        isExpanded
          ? 'flex w-full items-center rounded-md px-3 py-3 md:py-2'
          : 'flex h-10 w-10 items-center justify-center rounded-md md:h-8 md:w-8'
      } ${
        isSelected
          ? 'border border-blue-600/30 bg-blue-600/10 text-blue-600'
          : isHovered
            ? 'bg-gray-100 text-gray-700'
            : 'text-gray-600 hover:text-gray-700'
      } `}
    >
      {isExpanded ? (
        <div className="flex w-full items-center space-x-3 md:space-x-2">
          <span className="text-base md:text-sm">{tab.icon}</span>
          <span className="text-base font-medium md:text-sm">{tab.value}</span>
        </div>
      ) : (
        <span className="text-lg md:text-base">{tab.icon}</span>
      )}
    </div>
  );

  if (isExpanded) {
    return (
      <Link href={tab.path} className="block" onClick={onMobileClick}>
        {content}
      </Link>
    );
  }

  // For collapsed state, wrap with tooltip
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={tab.path} className="block" onClick={onMobileClick}>
          {content}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {tab.value}
      </TooltipContent>
    </Tooltip>
  );
};

const SidebarView: React.FC<SidebarViewProps> = ({ children }) => {
  const pathname = usePathname();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [hoveredTab, setHoveredTab] = useState<SidebarTab | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine the current tab based on the pathname
  const getCurrentTab = (): SidebarTab => {
    if (pathname === '/') {
      return SidebarTab.CREATE;
    } else if (pathname === '/projects' || pathname?.startsWith('/projects/')) {
      return SidebarTab.PROJECTS;
    } else if (pathname === '/settings' || pathname?.startsWith('/settings/')) {
      return SidebarTab.SETTINGS;
    }
    return SidebarTab.CREATE; // Default fallback
  };

  const handleSidebarToggle = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTabHover = (tab: SidebarTab, isHovering: boolean) => {
    setHoveredTab(isHovering ? tab : null);
  };

  const handleMobileTabClick = () => {
    setIsMobileMenuOpen(false);
  };

  const selectedTab = getCurrentTab();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black md:hidden"
          onClick={handleMobileMenuToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out md:static md:z-auto ${isSidebarExpanded ? 'w-64 md:w-56' : 'w-20 md:w-16'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} `}
      >
        {isSidebarExpanded ? (
          // Expanded sidebar content
          <div className="flex h-full flex-col">
            {/* Header with app name */}
            <div className="flex items-center justify-between px-4 py-6 md:py-8">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Image
                    src="/logo.png"
                    alt="WhisprDraw Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                  <span className="text-xl font-bold text-gray-900">WhisprDraw</span>
                </div>
              </div>
              {/* Mobile close button */}
              <button
                onClick={handleMobileMenuToggle}
                className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:hidden"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 space-y-1 px-2">
              {sidebarTabs.map((tab) => (
                <SidebarItem
                  key={tab.value}
                  tab={tab}
                  isSelected={selectedTab === tab.value}
                  isHovered={hoveredTab === tab.value}
                  isExpanded={true}
                  onHover={(isHovering) => handleTabHover(tab.value, isHovering)}
                  onMobileClick={handleMobileTabClick}
                />
              ))}
            </div>

            {/* Sidebar toggle button section */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-end">
                {/* Sidebar toggle button - hidden on mobile */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSidebarToggle}
                      className="hidden rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 md:block"
                    >
                      <Sidebar size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    Collapse sidebar
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        ) : (
          // Collapsed sidebar content
          <div className="flex h-full flex-col">
            {/* Collapsed header */}
            <div className="flex flex-col items-center pt-8 pb-6">
              <Image
                src="/logo.png"
                alt="WhisprDraw Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </div>

            {/* Navigation icons */}
            <div className="flex flex-1 flex-col items-center space-y-2 px-4">
              {sidebarTabs.map((tab) => (
                <SidebarItem
                  key={tab.value}
                  tab={tab}
                  isSelected={selectedTab === tab.value}
                  isHovered={hoveredTab === tab.value}
                  isExpanded={false}
                  onHover={(isHovering) => handleTabHover(tab.value, isHovering)}
                />
              ))}
            </div>

            {/* Sidebar toggle button section (collapsed) */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex flex-col items-center space-y-2">
                {/* Sidebar toggle button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSidebarToggle}
                      className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Sidebar size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    Expand sidebar
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content area */}
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        {/* Mobile header with hamburger menu */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleMobileMenuToggle}
              className="rounded p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="WhisprDraw Logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
              <span className="text-lg font-bold text-gray-900">WhisprDraw</span>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default SidebarView;
export { SidebarTab };
