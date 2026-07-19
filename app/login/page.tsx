import { LoginForm } from '@/app/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-8 px-6'>
      <LoginForm />
    </main>
  );
}
