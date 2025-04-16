'use client';

import { useEffect } from 'react';
import useAuth, { AuthProvider } from '@/lib/hooks/useAuth';
import { getAuth, getIdToken } from 'firebase/auth';
import { RouterProvider } from 'react-aria-components';
import { useRouter } from 'next/navigation';

export default function Providers({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if(user.uid) {
  //     console.log('User: ');
  //     // check if idToken needs to be refreshed.
  //     const refreshTokenIfRequired = async () => {
  //       const isRefreshRequired = await refresh();
  //        const auth = getAuth();
  //        if (auth.currentUser && isRefreshRequired) {
  //          // refresh idToken, to call useAuth hook again.
  //          await getIdToken(auth.currentUser, isRefreshRequired);
  //        }
  //     }

  //     refreshTokenIfRequired();

  //     // fetch('/api/refresh').then(res => res.json()).then(async (refreshRequired) => {

  //     // });
  //   }
  // }, [user.uid])

  // register service worker.
  useEffect(() => {
    // register service worker. No need to check for support as > 96% browsers support it.
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => {
        console.log('Service worker registered: ', reg.scope);
        if (reg.waiting) {
          // case when new service detected but in waiting mode, we send message which will be captured by sw.js
          // to immediately called skip waiting.
          console.log('New sw waiting to register');
          reg.waiting.postMessage('SKIP_WAITING');
        }
      },
      (err) => {
        console.error('Service worker registration failed: ', err);
      }
    );
  }, []);

  return (
    <>
      <AuthProvider>
        <RouterProvider navigate={router.push}>{children}</RouterProvider>
      </AuthProvider>
    </>
  );
}
