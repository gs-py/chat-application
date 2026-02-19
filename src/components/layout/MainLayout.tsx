import type { ReactNode } from 'react';

type Props = {
  header: ReactNode;
  children: ReactNode;
};

export function MainLayout({ header, children }: Props) {
  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/50">
        {header}
      </header>
      <main className="flex-1 min-h-0 flex flex-col">{children}</main>
    </div>
  );
}
