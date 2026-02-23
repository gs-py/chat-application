import type { ReactNode } from 'react';

type Props = {
  header: ReactNode;
  children: ReactNode;
};

export function MainLayout({ header, children }: Props) {
  return (
    <div className="flex h-dvh flex-col" style={{ backgroundColor: 'var(--chat-surface-secondary)' }}>
      <header
        className="shrink-0 px-3 py-2.5 sm:px-5 sm:py-3"
        style={{
          paddingTop: 'max(0.625rem, env(safe-area-inset-top))',
          backgroundColor: 'var(--chat-header-bg)',
          boxShadow: 'var(--chat-shadow-sm)',
          borderBottom: '1px solid var(--chat-border)',
        }}
      >
        {header}
      </header>
      <main className="flex-1 min-h-0 flex flex-col">{children}</main>
    </div>
  );
}
