import { ReactNode } from 'react';

export default function GateDialog({ children }: { children: ReactNode }) {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.45)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          style={{
            width: 420,
            maxWidth: '92vw',
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 10px 30px rgba(0,0,0,.25)',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
