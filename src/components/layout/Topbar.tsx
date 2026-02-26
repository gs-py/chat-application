import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function Topbar({ children }: Props) {
  return (
    <header
      className="shrink-0 px-3 py-3 sm:px-6 sm:py-3.5"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        backgroundColor: 'var(--chat-header-bg)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid var(--chat-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ maxWidth: '100%' }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {children}
        </div>
      </div>
    </header>
  );
}
