import React from 'react';

export function Settings() {
  return (
    <div className="flex flex-col h-full bg-gray-950">
      <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50 px-8 h-20 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6 pb-6">
        <div className="max-w-2xl">
          <div className="mb-10">
            <h3 className="text-lg font-medium text-white mb-4">Account</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center gap-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg">
                JD
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium">Jane Doe</h4>
                <p className="text-gray-400 text-sm mb-3">jane.doe@example.com</p>
                <button className="text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-lg font-medium text-white mb-4">Playback</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-white text-sm font-medium">Audio Quality</h4>
                  <p className="text-gray-400 text-xs mt-1">Select the default audio quality</p>
                </div>
                <select className="bg-gray-800 text-white text-sm rounded-lg border-none px-3 py-2 outline-none cursor-pointer">
                  <option>High (320kbps)</option>
                  <option>Standard (160kbps)</option>
                  <option>Data Saver</option>
                </select>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-white text-sm font-medium">Gapless Playback</h4>
                  <p className="text-gray-400 text-xs mt-1">Eliminate silence between tracks</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-white text-sm font-medium">Hardware Acceleration</h4>
                  <p className="text-gray-400 text-xs mt-1">Use hardware for smoother rendering</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
