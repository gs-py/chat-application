import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { MainLayout } from '@/components/layout/MainLayout';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { DailyLimitBadge } from '@/components/chat/DailyLimitBadge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { useMessages } from '@/hooks/useMessages';
import { useDailyLimit } from '@/hooks/useDailyLimit';
import { useProfiles, type PublicProfile } from '@/hooks/useProfiles';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  LogOut,
  User,
  Users,
  ChevronRight,
} from 'lucide-react';

type CurrentProfile = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function Chat() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profiles, loading: profilesLoading } = useProfiles();
  const [selectedOtherUserId, setSelectedOtherUserId] = useState<string | null>(
    null
  );
  const {
    conversationId,
    otherProfile,
    loading: convLoading,
    error: convError,
  } = useConversation(user?.id ?? undefined, selectedOtherUserId ?? undefined);
  const { messages, loading: messagesLoading, sendMessage } = useMessages(
    conversationId ?? null,
    user?.id
  );
  const { used, limit, loading: limitLoading, isAtLimit, refetch: refetchDailyLimit } = useDailyLimit(
    user?.id
  );
  const [currentProfile, setCurrentProfile] =
    useState<CurrentProfile | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setCurrentProfile(data ?? null));
  }, [user?.id]);

  const handleSend = async (content: string) => {
    try {
      await sendMessage(content);
      refetchDailyLimit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send';
      if (msg.includes('Daily message limit')) {
        toast.error('Daily message limit reached. Try again tomorrow.');
      } else {
        toast.error(msg);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <div className="animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700 size-12" />
          <p className="text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const headerTitle = selectedOtherUserId
    ? otherProfile?.display_name ?? otherProfile?.username ?? 'Chat'
    : 'Chat';

  return (
    <MainLayout
      header={
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-2">
            {selectedOtherUserId ? (
              <>
                <MessageCircle className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                {headerTitle}
              </>
            ) : (
              'Chat'
            )}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <DailyLimitBadge used={used} limit={limit} loading={limitLoading} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut().then(() => navigate('/login'))}
              className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <LogOut className="size-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 flex flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="size-3.5" />
              You
            </p>
            <div className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3">
              <Avatar size="sm" className="size-10 shrink-0 ring-2 ring-white dark:ring-zinc-800">
                {currentProfile?.avatar_url && (
                  <AvatarImage src={currentProfile.avatar_url} alt="" />
                )}
                <AvatarFallback className="text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {(currentProfile?.display_name ?? currentProfile?.username ?? '?').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {currentProfile?.display_name ?? currentProfile?.username ?? '…'}
                </p>
                {currentProfile?.display_name && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    @{currentProfile?.username}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-4 py-3 flex items-center gap-2 shrink-0">
              <Users className="size-3.5" />
              Start a chat
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
              {profilesLoading ? (
                <div className="px-4 py-3 flex items-center gap-2 text-zinc-500">
                  <div className="animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700 size-6" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : profiles.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-3">
                  No other users yet
                </p>
              ) : (
                <ul className="py-1 px-2">
                  {profiles.map((p) => (
                    <UserRow
                      key={p.id}
                      profile={p}
                      selected={selectedOtherUserId === p.id}
                      onSelect={() => setSelectedOtherUserId(p.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col relative bg-zinc-50 dark:bg-zinc-950">
          {!selectedOtherUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="rounded-2xl bg-zinc-100 p-8 dark:bg-zinc-800">
                <MessageCircle className="size-16 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                  Select a conversation
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                  Choose someone from the list to start chatting
                </p>
              </div>
            </div>
          ) : (
            <>
              {convError && (
                <p className="text-sm text-red-600 dark:text-red-400 px-4 py-2 bg-red-50 dark:bg-red-950/30">
                  {convError.message}
                </p>
              )}
              {conversationId && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-sm dark:opacity-25"
                    style={{ backgroundImage: `url('/chat-bg.jpeg')` }}
                    aria-hidden
                  />
                  <div className="relative z-10 flex-1 min-h-0 flex flex-col min-w-0">
                  <MessageList
                    messages={messages}
                    currentUserId={user.id}
                    currentUserProfile={currentProfile}
                    otherProfile={otherProfile ?? null}
                    loading={messagesLoading}
                  />
                  <MessageInput
                    onSend={handleSend}
                    disabled={isAtLimit}
                    placeholder={
                      isAtLimit ? 'Daily limit reached' : 'Type a message…'
                    }
                  />
                  </div>
                </div>
              )}
              {!convLoading && !conversationId && !convError && selectedOtherUserId && (
                <div className="flex-1 flex items-center justify-center gap-2 text-zinc-500">
                  <div className="animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700 size-4" />
                  <span className="text-sm">Setting up your chat…</span>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </MainLayout>
  );
}

function UserRow({
  profile,
  selected,
  onSelect,
}: {
  profile: PublicProfile;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = profile.display_name ?? profile.username;
  const sub = profile.display_name ? `@${profile.username}` : null;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
          selected
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
        )}
      >
        <Avatar size="sm" className="size-9 shrink-0 ring-2 ring-white dark:ring-zinc-800">
          {profile.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt="" />
          )}
          <AvatarFallback className="text-xs font-medium bg-zinc-200 text-zinc-600 dark:bg-zinc-600 dark:text-zinc-200">
            {label.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{label}</p>
          {sub && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{sub}</p>
          )}
        </div>
        <ChevronRight
          className={cn(
            'size-4 shrink-0',
            selected ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'
          )}
        />
      </button>
    </li>
  );
}
