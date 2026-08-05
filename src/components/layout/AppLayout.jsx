import React, { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@/pages/AccessDenied';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { permission, loading, isAdmin, canEdit, canAccessPage } = usePermissions();
  const location = useLocation();

  // While loading permissions, show spinner
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>);

  }

  // Check if current page is accessible
  const pageAllowed = canAccessPage(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        isAdmin={isAdmin}
        canAccessPage={canAccessPage} />
      
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        collapsed ? "ml-[68px]" : "ml-[260px]"
      )}>
        <div className="p-6 max-w-[1400px] mx-auto text-[#ffffff]">
          {pageAllowed ? <Outlet context={{ isAdmin, canEdit, permission }} /> : <AccessDenied />}
        </div>
      </main>
    </div>);

}