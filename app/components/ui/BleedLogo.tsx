import Image from 'next/image';
import logoLight from '@/public/bleedlogo.svg';
import logoDark from '@/public/bleedlogo-dark.svg';

/**
 * The wordmark is dark slate, which all but vanishes on the dark theme, so
 * there are two files and CSS shows whichever matches the theme.
 *
 * Both stay lazy (the default) on purpose: a lazy image under display:none is
 * never fetched, so each visitor downloads only the variant they actually see.
 * `preload` or `loading="eager"` would fetch both on every page view. Callers
 * above the fold pass `fetchPriority='high'` instead.
 *
 * bleedlogo-dark.svg is generated from the light file rather than drawn: every
 * grey is re-expressed as the same blend between the dark theme's ink and
 * paper, and the red mark is left untouched. Regenerate it if the logo changes.
 */
export function BleedLogo({
  width,
  height,
  fetchPriority,
  className = '',
}: {
  width: number;
  height?: number;
  fetchPriority?: 'high';
  className?: string;
}) {
  return (
    <>
      <Image
        src={logoLight}
        alt='Bleed logo'
        width={width}
        height={height}
        fetchPriority={fetchPriority}
        className={`dark:hidden ${className}`}
      />
      <Image
        src={logoDark}
        alt='Bleed logo'
        width={width}
        height={height}
        fetchPriority={fetchPriority}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}
