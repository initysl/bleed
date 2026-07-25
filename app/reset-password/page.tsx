import { ResetPasswordForm } from '@/app/features/auth/components/ResetPasswordForm';

// This page is only ever reached after /auth/confirm has already verified the
// recovery link's token_hash and established a temporary session — see the
// `next=/reset-password` param passed in resetPasswordForEmail() and the
// existing verifyOtp() logic in app/auth/confirm/route.ts.
export default function ResetPasswordPage() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-8 px-6'>
      <ResetPasswordForm />
    </main>
  );
}
