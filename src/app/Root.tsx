import React from 'react';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { Outlet } from 'react-router';

export function Root() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#4A154B] via-[#2E1156] to-[#160632] p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[1400px] h-[90vh] bg-[#221644] rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8)] flex overflow-hidden ring-1 ring-white/5">
        <Sidebar />
        <main className="flex-1 relative min-w-0 border-r border-[#3A2766]">
          <Outlet />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}
