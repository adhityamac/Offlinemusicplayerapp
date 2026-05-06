import React from 'react';
import { createBrowserRouter } from 'react-router';
import { Root } from './Root';
import { Home } from './views/Home';
import { Playlists } from './views/Playlists';
import { Settings } from './views/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'playlists', Component: Playlists },
      { path: 'settings', Component: Settings },
      { path: '*', Component: Home },
    ],
  },
]);
