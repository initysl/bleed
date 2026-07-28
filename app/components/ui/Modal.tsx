'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  // Portals need document.body, which only exists client-side. Guarding with
  // a mounted flag avoids a server/client mismatch on first render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key='backdrop'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
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
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            role='dialog'
            aria-modal='true'
            aria-label={title}
            className='my-8 flex max-h-[85vh] w-full max-w-md flex-col rounded-lg border border-sage bg-paper shadow-xl'
          >
            <div className='flex items-center justify-between border-b border-sage px-5 py-4'>
              {title && (
                <h2 className='font-display font-medium text-ink'>{title}</h2>
              )}
              <button
                onClick={onClose}
                className='ml-auto text-ink/40 hover:text-ink/60'
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
