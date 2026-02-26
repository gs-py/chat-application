import type { ReactNode } from 'react';
import { Topbar } from './Topbar';

type Props = {
  header: ReactNode;
  children: ReactNode;
};

export function MainLayout({ header, children }: Props) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden" style={{ backgroundColor: 'var(--chat-surface-secondary)' }}>
      <Topbar>{header}</Topbar>
      <main className="flex-1 min-h-0 flex flex-col">{children}</main>
    </div>
  );
}
