'use client';

import { useId, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useDialogBehavior } from './useDialogBehavior';

// Never changes, so no listener is ever needed.
const emptySubscribe = () => () => {};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  // Portals need document.body, which only exists client-side, so this must
  // render nothing until hydration. useSyncExternalStore is the canonical way
  // to ask "have we hydrated yet": the server snapshot is false and the client
  // snapshot is true, with no subscription and no setState inside an effect
  // (which the react-hooks/set-state-in-effect rule rejects).
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const titleId = useId();
  const reduceMotion = useReducedMotion();

  // Escape, focus trap, initial focus, focus restoration and body scroll lock.
  const panelRef = useDialogBehavior<HTMLDivElement>(open, onClose);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key='backdrop'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.15 }}
          onClick={onClose}
          // Rendered via createPortal directly into document.body — this is
          // the actual fix. Without a portal, this position:fixed element
          // would still be a normal DESCENDANT in the React tree, and any
          // ancestor with a CSS transform (e.g. a framer-motion wrapper like
          // AnimatedIn, which leaves `transform: translateY(0px)` applied
          // even after its entrance animation finishes) becomes the new
          // containing block for fixed descendants — silently confining the
          // "full-screen" overlay to that ancestor's bounds instead of the
          // actual viewport. A portal escapes the tree entirely, so no
          // ancestor's transform can ever affect this again.
          className='fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-ink/30 p-4 backdrop-blur-sm'
        >
          <motion.div
            key='panel'
            ref={panelRef}
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            role='dialog'
            aria-modal='true'
            // Prefer pointing at the real heading; fall back to a label only
            // when there is no title. Previously this was aria-label={title},
            // which resolved to undefined for the untitled modal in EmptyState
            // and left an aria-modal dialog with no accessible name at all.
            {...(title
              ? { 'aria-labelledby': titleId }
              : { 'aria-label': 'Dialog' })}
            // Focusable so the panel itself can receive focus when it holds no
            // focusable children.
            tabIndex={-1}
            className='my-8 flex max-h-[85vh] w-full max-w-md flex-col rounded-lg border border-sage bg-paper shadow-xl outline-none'
          >
            <div className='flex items-center justify-between border-b border-sage px-5 py-4'>
              {title && (
                <h2
                  id={titleId}
                  className='font-display font-medium text-ink'
                >
                  {title}
                </h2>
              )}
              <button
                type='button'
                onClick={onClose}
                // Padding brings the hit area to 32x32. The icon alone was
                // ~16x16, under the 24x24 WCAG 2.2 minimum, and the colour was
                // ~2.3:1 against paper.
                className='ml-auto rounded-md p-2 text-ink/60 transition-colors hover:bg-sage/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine'
                aria-label='Close'
              >
                <FiX className='h-4 w-4' />
              </button>
            </div>
            <div className='overflow-y-auto p-5'>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
