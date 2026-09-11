// Shown while the dashboard's server queries run. Without this file Next has
// nothing to render during navigation, so the user sat looking at the previous
// page with no feedback until the data arrived.
//
// A skeleton rather than a spinner, laid out to match the real dashboard's
// grid, so the content doesn't jump when it swaps in.
export default function DashboardLoading() {
  return (
    <div
      className='mx-auto flex w-full max-w-5xl flex-col gap-3 p-2 sm:gap-6'
      // Announced once, politely — a screen reader shouldn't have every
      // skeleton block read out.
      role='status'
      aria-live='polite'
      aria-busy='true'
    >
      <span className='sr-only'>Loading your subscriptions…</span>

      <div className='flex w-full items-center justify-between px-3 py-2.5'>
        <div className='h-8 w-24 animate-pulse rounded-md bg-sage/60' />
        <div className='h-9 w-40 animate-pulse rounded-full bg-sage/50' />
      </div>

      <div className='grid gap-10 md:grid-cols-[420px_minmax(0,1fr)]'>
        <div className='flex flex-col gap-6'>
          {/* BleedTotal */}
          <div className='w-full rounded-2xl border border-sage/60 bg-white p-6 sm:p-7'>
            <div className='h-12 w-48 animate-pulse rounded-md bg-sage/60' />
            <div className='mt-3 h-4 w-32 animate-pulse rounded bg-sage/40' />
          </div>
          {/* UpcomingStrip */}
          <div className='flex gap-3'>
            <div className='h-20 w-32 shrink-0 animate-pulse rounded-xl bg-sage/40' />
            <div className='h-20 w-32 shrink-0 animate-pulse rounded-xl bg-sage/30' />
          </div>
          {/* InboxAddress */}
          <div className='h-16 w-full animate-pulse rounded-lg bg-sage/30' />
        </div>

        <div className='flex flex-col gap-3'>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className='flex items-center gap-3.5 rounded-2xl border border-sage/60 bg-white p-4 sm:p-5'
            >
              <div className='h-11 w-11 shrink-0 animate-pulse rounded-xl bg-sage/60' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 w-1/3 animate-pulse rounded bg-sage/60' />
                <div className='h-3 w-1/4 animate-pulse rounded bg-sage/40' />
              </div>
              <div className='h-6 w-20 animate-pulse rounded bg-sage/50' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
