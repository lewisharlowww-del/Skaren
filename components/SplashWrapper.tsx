'use client';

import { useState } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);

  return (
    <>
      {!done && <SplashScreen onDone={() => setDone(true)} />}
      {children}
    </>
  );
}
