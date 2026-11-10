import React from 'react';
import { createRoot } from 'react-dom/client';
import Camp from './components/camp/Camp';
import './app/globals.css';
import './app/training.css';
createRoot(document.getElementById('root')!).render(<Camp />);
