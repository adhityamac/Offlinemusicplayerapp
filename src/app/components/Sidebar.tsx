import React from 'react';
import { NavLink } from 'react-router';
import { 
  Home, Compass, LayoutGrid, Mic, Radio, 
  Disc, Music2, Users, Search
} from 'lucide-react';

export function Sidebar() {
  const menuItems = [
    { to: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { to: '/discover', label: 'Discover', icon: <Compass className="w-4 h-4" /> },
    { to: '/browse', label: 'Browse', icon: <LayoutGrid className="w-4 h-4" /> },
    { to: '/podcasts', label: 'Podcasts', icon: <Mic className="w-4 h-4" />, badge: 'new' },
    { to: '/radio', label: 'Radio', icon: <Radio className="w-4 h-4" /> },
  ];

  const libraryItems = [
    { to: '/albums', label: 'Albums', icon: <Disc className="w-4 h-4" />, hasDot: true },
    { to: '/songs', label: 'Song', icon: <Music2 className="w-4 h-4" /> },
    { to: '/artists', label: 'Artists', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="w-[260px] bg-[#1A1130] flex flex-col h-full shrink-0 relative z-20 rounded-l-[2.5rem]">
      {/* Mac Controls */}
      <div className="flex gap-2 p-6">
        <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm" />
        <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm" />
        <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm" />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 px-8 mb-8">
        {/* SVG for Apple Logo */}
        <svg viewBox="0 0 384 512" className="w-5 h-5 fill-white">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
        </svg>
        <span className="font-bold text-xl text-white tracking-wide">Music</span>
      </div>

      {/* Search */}
      <div className="px-6 mb-8">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7EB3]" />
          <input
            type="text"
            placeholder="Search ..."
            className="w-full bg-[#291B4C] text-white placeholder-[#8B7EB3] rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
        <div className="mb-8">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-xs font-semibold text-[#8B7EB3]">Menu</h2>
            <span className="text-xs text-[#8B7EB3]">5</span>
          </div>
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex items-center justify-between px-6 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white'
                      : 'text-[#8B7EB3] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#20D670] rounded-r-full shadow-[0_0_10px_#20D670]" />
                    )}
                    <div className="flex items-center gap-4">
                      <span className={isActive ? 'text-white' : 'text-[#8B7EB3]'}>{item.icon}</span>
                      {item.label}
                    </div>
                    {item.badge && (
                      <span className="bg-[#FF3454] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-xs font-semibold text-[#8B7EB3]">Library</h2>
            <span className="text-xs text-[#8B7EB3]">3</span>
          </div>
          <nav className="flex flex-col gap-1">
            {libraryItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex items-center justify-between px-6 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white'
                      : 'text-[#8B7EB3] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#20D670] rounded-r-full shadow-[0_0_10px_#20D670]" />
                    )}
                    <div className="flex items-center gap-4">
                      <span className={isActive ? 'text-white' : 'text-[#8B7EB3]'}>{item.icon}</span>
                      {item.label}
                    </div>
                    {item.hasDot && !isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-6 mt-auto">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&h=100"
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-[#291B4C]"
          />
          <div>
            <h4 className="text-white text-sm font-medium">Vitaliy Dorozhko</h4>
            <p className="text-[#8B7EB3] text-xs">Premium member</p>
          </div>
        </div>
      </div>
    </div>
  );
}
