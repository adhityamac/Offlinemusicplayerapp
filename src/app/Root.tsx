import React from 'react';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { Outlet } from 'react-router';

export function Root() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#3B0764] via-[#1E1040] to-[#0D061F] p-5 sm:p-8 font-sans">
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B5CF6]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#6D28D9]/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[1440px] h-[92vh] bg-[#170F35]/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] flex overflow-hidden ring-1 ring-white/8">
        <Sidebar />
        <main className="flex-1 relative min-w-0 border-x border-white/5 bg-[#1E1545]/40">
          <Outlet />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}
