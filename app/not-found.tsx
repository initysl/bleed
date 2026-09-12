import Link from 'next/link';

export default function NotFound() {
  return (
    <main className='mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center'>
      <p className='font-mono text-xs uppercase tracking-wider text-ink/50'>
        404
      </p>
      <h1 className='font-display text-2xl font-medium text-ink'>
        That page doesn&apos;t exist.
      </h1>
      <p className='font-mono text-sm text-ink/70'>
        The link may be out of date, or the page may have moved.
      </p>
      <Link
        href='/dashboard'
        className='mt-2 rounded-md bg-pine px-4 py-2 font-body text-sm font-medium text-paper transition-colors hover:bg-pine/90'
      >
        Back to dashboard
      </Link>
    </main>
  );
}
