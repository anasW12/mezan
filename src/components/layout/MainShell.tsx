"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";

interface MainShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  companyName: string;
  isAdmin: boolean;
}

export function MainShell({
  children,
  userName,
  userEmail,
  companyName,
  isAdmin,
}: MainShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="bg-calm-canvas min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:ps-64">
        <Header
          onOpenMobileMenu={() => setDrawerOpen(true)}
          userName={userName}
          userEmail={userEmail}
          companyName={companyName}
          isAdmin={isAdmin}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-24 sm:p-6 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
      />
    </div>
  );
}
