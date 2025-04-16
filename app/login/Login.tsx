'use client';

import React from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import useAuth from '@/lib/hooks/useAuth';
import { Button } from '@/elements/Button';
import { TextField } from '@/elements/TextField';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password should be min 8 chars.' }).max(100),
});

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false);
  const {
    handleSubmit,
    reset,
    control,
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(schema),
  });


  const [pageLoading, setPageLoading] = React.useState(true);
  const { user, loadingUser, auth } = useAuth();
  const [showEmailVerifiedError, setShowEmailVerifiedError] = React.useState(true);
  const [viewPass, setViewPass] = React.useState(false);

  React.useEffect(() => {
    // This is require even though we have server side auth, because service worker don't send token on initial google signup.
    // if (loadingUser) return;
    if (user?.uid && user?.emailVerified) {
      // don't use router.replace here as it will cache the page and idToken will not be picked up by service worker during initial auth.
      location.replace('/');
    } else {
      setPageLoading(false);
    }
  }, [loadingUser, user?.uid, user?.emailVerified]);

  const handleCredentialResponse = () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });
    // NOTE: signInWithPopup has much better UX and is faster than signInWithRedirect. Also we can track user if signup failed.
    signInWithPopup(auth, provider)
      .then(() => {
        console.log('Popup signed: ');
        location.replace('/');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        console.log('Error (popup-signin): ', errorCode, errorMessage, email, credential);
        // TODO: log error to server.
      });
  };

  const onSubmit = handleSubmit(async (data) => {
    if(!auth) {
      console.error('Auth is not initialized');
      return;
    }
    
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log('Cred: ', cred);
      if (!cred.user?.emailVerified) {
        // logout the user and display error & send a new verification link.
        setShowEmailVerifiedError(true);
        await sendEmailVerification(cred.user);
        // make sure to signout, so that idToken mismatch between server and client doesn't happen.
        await auth.signOut();
      } else {
        // don't use router.replace as idToken will not be picked by api during initial auth.
        location.replace('/');
      }
    } catch (e) {
      setLoading(false);
      // Don't show real message to user, as it cause brute force attack.
      // See: https://cloud.google.com/identity-platform/docs/admin/email-enumeration-protection?authuser=1
      // const message =
      //   (e as AuthError).code === 'auth/user-not-found'
      //     ? 'Email not registered.'
      //     : 'Invalid password.';

      console.error('Error signing in', e);
    } finally {
      setLoading(false);
      reset();
    }
  });

  const toggleViewPass = () => {
    setViewPass(!viewPass);
  };

  if (pageLoading) return <div>Loading...</div>;

  return (
    <main>
      <div className="max-w-md container mx-auto mt-20 mb-12">
        <header className="mb-8">
          <h1 className="mb-1 h3">Hi, Welcome back!</h1>
          <p>Sign in to your account to continue</p>
        </header>

        <form className="mb-2 flex flex-col gap-6" onSubmit={onSubmit}>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                isRequired
                type="email"
                {...field}
                isInvalid={fieldState.invalid}
                label="Email"
                validationBehavior="aria"
                errorMessage={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                isRequired
                type={viewPass ? 'text' : 'password'}
                {...field}
                isInvalid={fieldState.invalid}
                label="Password"
                validationBehavior="aria"
                errorMessage={fieldState.error?.message}
                suffix={
                  <Button isIconOnly variant="text" onPress={toggleViewPass}>
                    {viewPass ? <IconEyeOff size="20" /> : <IconEye size="20" />}
                  </Button>
                }
              />
            )}
          />

          <div className="underline text-sm text-right -mt-4">
            <Link href="/forget-pass">Forget password?</Link>
          </div>
          <Button isLoading={loading} variant="filled" className="o:h-12" type="submit">
            Sign In
          </Button>
        </form>
        <div className="relative flex place-items-center my-6">
          <small className="absolute left-1/2 -translate-x-1/2 px-3 bg-white">OR</small>
          <hr className="w-full" />
        </div>
        <Button variant="outline" onPress={handleCredentialResponse} className="w-full o:h-12 mb-4">
          Login with Google
        </Button>

        <div className="text-center">
          Don&apos;t have an account yet?{' '}
          <Link href="/signup" className="underline font-medium">
            Signup here
          </Link>
        </div>
      </div>
    </main>
  );
}
