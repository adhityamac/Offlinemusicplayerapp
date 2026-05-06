import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { PlayerProvider } from './context/PlayerContext';

export default function App() {
  return (
    <PlayerProvider>
      <RouterProvider router={router} />
    </PlayerProvider>
  );
}
