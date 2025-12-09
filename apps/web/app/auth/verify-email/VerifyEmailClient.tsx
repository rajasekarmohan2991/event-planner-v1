'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface VerifyEmailClientProps {
  status: 'loading' | 'success' | 'error' | 'invalid';
  message: string;
}

export default function VerifyEmailClient({ status, message }: VerifyEmailClientProps) {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-md flex-col space-y-6 text-center p-8 bg-white rounded-lg shadow-sm border"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-500" />
            <h1 className="text-2xl font-bold">Verifying your email</h1>
            <p className="text-muted-foreground">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Email Verified!</h1>
            <p className="text-muted-foreground">Your email has been successfully verified.</p>
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </>
        )}

        {(status === 'error' || status === 'invalid') && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button asChild variant="outline">
              <Link href="/">Return Home</Link>
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
