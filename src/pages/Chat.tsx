import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { useProfiles, type PublicProfile, isOnline, formatLastSeen } from '@/hooks/useProfiles';
import { usePresence } from '@/hooks/usePresence';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  LogOut,
  User,
  Users,
  Bell,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Images,
  X,
  Search,
} from 'lucide-react';
import { LoveQuotesPanel } from '@/components/auth/LoveQuotesPanel';
import type { Message } from '@/types/database';

type CurrentProfile = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profiles, loading: profilesLoading, refetch: refetchProfiles } = useProfiles();
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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showQuotesModal, setShowQuotesModal] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [messageSearchIndex, setMessageSearchIndex] = useState(0);
  const messageSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setReplyingTo(null);
    setShowMessageSearch(false);
    setMessageSearch('');
    setMessageSearchIndex(0);
  }, [conversationId]);

  const filteredProfiles = useMemo(() => {
    if (!sidebarSearch.trim()) return profiles;
    const q = sidebarSearch.toLowerCase().trim();
    return profiles.filter(
      (p) =>
        (p.display_name ?? '').toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q)
    );
  }, [profiles, sidebarSearch]);

  const messageSearchResults = useMemo(() => {
    if (!messageSearch.trim()) return [] as number[];
    const q = messageSearch.toLowerCase().trim();
    return messages.reduce<number[]>((acc, msg, i) => {
      if (msg.content.toLowerCase().includes(q)) acc.push(i);
      return acc;
    }, []);
  }, [messages, messageSearch]);

  const highlightedMessageId = messageSearchResults.length > 0
    ? messages[messageSearchResults[messageSearchIndex]]?.id ?? null
    : null;

  const toggleMessageSearch = useCallback(() => {
    setShowMessageSearch((prev) => {
      if (!prev) setTimeout(() => messageSearchInputRef.current?.focus(), 50);
      else {
        setMessageSearch('');
        setMessageSearchIndex(0);
      }
      return !prev;
    });
  }, []);

  usePresence(user?.id, refetchProfiles);
  const {
    permission,
    requestPermission,
    registerToken,
    isConfigured: pushConfigured,
  } = usePushNotifications(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && pushConfigured && permission === 'granted') registerToken();
  }, [user?.id, pushConfigured, permission, registerToken]);

  useEffect(() => {
    if (!user) return;
    const state = location.state as { openQuotesModal?: boolean } | null;
    if (state?.openQuotesModal) {
      setShowQuotesModal(true);
      navigate('/chat', { replace: true, state: {} });
    }
  }, [user, location.state, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setCurrentProfile(data ?? null));
  }, [user?.id]);

  const handleSend = async (
    content: string,
    replyToId?: string | null,
    imageUrl?: string | null
  ) => {
    try {
      await sendMessage(content, replyToId, imageUrl);
      setReplyingTo(null);
      refetchDailyLimit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send';
      if (msg.includes('Daily message limit')) {
        toast.error('Daily message limit reached. Try again tomorrow.');
      } else if (/failed to fetch|networkerror|load failed|aborted|timeout/i.test(msg)) {
        toast.error('Connection timed out. Check your network and try again.');
      } else {
        toast.error(msg);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: 'var(--chat-surface)' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="animate-pulse rounded-full size-10"
            style={{ backgroundColor: 'var(--chat-accent)', opacity: 0.2 }}
          />
          <p className="text-sm font-medium" style={{ color: 'var(--chat-text-secondary)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const headerProfile = selectedOtherUserId
    ? profiles.find((p) => p.id === selectedOtherUserId) ?? otherProfile
    : null;
  const headerTitle = headerProfile
    ? (headerProfile.display_name ?? headerProfile.username ?? 'Chat')
    : 'Chat';

  return (
    <MainLayout
      header={
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Back button (mobile only, when in chat) */}
          {selectedOtherUserId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedOtherUserId(null)}
              className="md:hidden shrink-0 size-9 -ml-1 rounded-xl"
              style={{ color: 'var(--chat-text-primary)' }}
              aria-label="Back to conversations"
            >
              <ArrowLeft className="size-5" />
            </Button>
          )}

          {/* Header content */}
          {selectedOtherUserId && headerProfile ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <Avatar size="sm" className="size-10 ring-0">
                  {headerProfile.avatar_url && (
                    <AvatarImage src={headerProfile.avatar_url} alt="" />
                  )}
                  <AvatarFallback
                    className="text-sm font-semibold text-white"
                    style={{ backgroundColor: 'var(--chat-accent)' }}
                  >
                    {(headerProfile.display_name ?? headerProfile.username ?? '?').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOnline(headerProfile.last_seen_at ?? null) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 rounded-full border-2"
                    style={{
                      backgroundColor: 'var(--chat-online)',
                      borderColor: 'var(--chat-header-bg)',
                    }}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1
                  className="font-semibold text-[16px] leading-tight truncate"
                  style={{ color: 'var(--chat-text-primary)' }}
                >
                  {headerTitle}
                </h1>
                <p
                  className="text-[12px] leading-tight mt-0.5 truncate"
                  style={{ color: isOnline(headerProfile.last_seen_at ?? null) ? 'var(--chat-online)' : 'var(--chat-text-muted)' }}
                >
                  {isOnline(headerProfile.last_seen_at ?? null)
                    ? 'Online'
                    : headerProfile.last_seen_at
                      ? `Last seen ${formatLastSeen(headerProfile.last_seen_at).toLowerCase()}`
                      : 'Offline'}
                </p>
              </div>
            </div>
          ) : (
            <h1
              className="font-semibold text-[18px] truncate flex items-center gap-2.5 min-w-0"
              style={{ color: 'var(--chat-text-primary)' }}
            >
              <MessageCircle className="size-5 shrink-0" style={{ color: 'var(--chat-accent)' }} />
              Chat
            </h1>
          )}

          {/* Right action icons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {selectedOtherUserId && conversationId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMessageSearch}
                className="rounded-xl size-9"
                style={{ color: showMessageSearch ? 'var(--chat-accent)' : 'var(--chat-text-secondary)' }}
                aria-label="Search messages"
                title="Search messages"
              >
                <Search className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuotesModal(true)}
              className="rounded-xl size-9 md:size-auto md:px-3 md:py-2"
              style={{ color: 'var(--chat-text-secondary)' }}
              aria-label="View images & quotes"
              title="View images & quotes"
            >
              <Images className="size-4 md:mr-1.5" />
              <span className="hidden md:inline text-[13px]">View</span>
            </Button>
            {pushConfigured && permission !== 'granted' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={requestPermission}
                className="rounded-xl size-9 md:size-auto md:px-3 md:py-2"
                style={{ color: 'var(--chat-text-secondary)' }}
                aria-label="Enable notifications"
                title="Enable notifications"
              >
                <Bell className="size-4 md:mr-1.5" />
              </Button>
            )}
            <DailyLimitBadge used={used} limit={limit} loading={limitLoading} />
          </div>
        </div>
      }
    >
      {/* Quotes / images modal */}
      {showQuotesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowQuotesModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Images and quotes"
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Images & quotes
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQuotesModal(false)}
                className="size-9 rounded-xl"
                aria-label="Close"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden p-4">
              <div className="h-[400px] min-h-0 rounded-xl overflow-hidden">
                <LoveQuotesPanel />
              </div>
            </div>
            <div className="shrink-0 flex flex-wrap items-center justify-end gap-2 px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowQuotesModal(false);
                  signOut().then(() => navigate('/login'));
                }}
                className="rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                aria-label="Sign out"
              >
                <LogOut className="size-4 mr-2" />
                Byeee love
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'shrink-0 flex flex-col',
            'w-full md:w-[280px] lg:w-[320px]',
            selectedOtherUserId && 'hidden md:flex'
          )}
          style={{
            backgroundColor: 'var(--chat-sidebar-bg)',
            borderRight: '1px solid var(--chat-border)',
          }}
        >
          {/* Current user card */}
          <div
            className="px-4 py-4"
            style={{ borderBottom: '1px solid var(--chat-border)' }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-2"
              style={{ color: 'var(--chat-text-muted)' }}
            >
              <User className="size-3" />
              Your Profile
            </p>
            <div
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{ backgroundColor: 'var(--chat-surface)', boxShadow: 'var(--chat-shadow-sm)' }}
            >
              <Avatar size="sm" className="size-10 shrink-0 ring-0">
                {currentProfile?.avatar_url && (
                  <AvatarImage src={currentProfile.avatar_url} alt="" />
                )}
                <AvatarFallback
                  className="text-sm font-semibold text-white"
                  style={{ backgroundColor: 'var(--chat-accent)' }}
                >
                  {(currentProfile?.display_name ?? currentProfile?.username ?? '?').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p
                  className="font-semibold text-[14px] truncate"
                  style={{ color: 'var(--chat-text-primary)' }}
                >
                  {currentProfile?.display_name ?? currentProfile?.username ?? '…'}
                </p>
                {currentProfile?.display_name && (
                  <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--chat-text-muted)' }}>
                    @{currentProfile?.username}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact list */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <p
              className="text-[11px] font-semibold uppercase tracking-widest px-4 pt-3 pb-2 flex items-center gap-2 shrink-0"
              style={{ color: 'var(--chat-text-muted)' }}
            >
              <Users className="size-3" />
              Conversations
            </p>
            <div className="px-3 pb-2 shrink-0">
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none"
                  style={{ color: 'var(--chat-text-muted)' }}
                />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Search people…"
                  className="w-full rounded-xl py-2 pl-8 pr-8 text-[13px] outline-none placeholder:text-[var(--chat-text-muted)]"
                  style={{
                    backgroundColor: 'var(--chat-surface)',
                    color: 'var(--chat-text-primary)',
                    border: '1px solid var(--chat-border)',
                  }}
                />
                {sidebarSearch && (
                  <button
                    type="button"
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5"
                    style={{ color: 'var(--chat-text-muted)' }}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scroll-touch px-2">
              {profilesLoading ? (
                <div className="px-3 py-3 flex items-center gap-3" style={{ color: 'var(--chat-text-muted)' }}>
                  <div
                    className="animate-pulse rounded-full size-8"
                    style={{ backgroundColor: 'var(--chat-border)' }}
                  />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <p className="text-sm px-3 py-3" style={{ color: 'var(--chat-text-muted)' }}>
                  {sidebarSearch ? 'No matches found' : 'No other users yet'}
                </p>
              ) : (
                <ul className="py-1 space-y-0.5">
                  {filteredProfiles.map((p) => (
                    <UserRow
                      key={p.id}
                      profile={p}
                      selected={selectedOtherUserId === p.id}
                      onSelect={() => setSelectedOtherUserId(p.id)}
                      online={isOnline(p.last_seen_at)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>

        {/* Main chat area */}
        <main
          className={cn(
            'flex-1 min-w-0 flex flex-col relative',
            !selectedOtherUserId && 'hidden md:flex'
          )}
          style={{ backgroundColor: 'var(--chat-surface-secondary)' }}
        >
          {!selectedOtherUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center animate-in fade-in duration-300">
              <div
                className="rounded-3xl p-7"
                style={{ backgroundColor: 'var(--chat-accent-light)' }}
              >
                <MessageCircle className="size-14" style={{ color: 'var(--chat-accent)', opacity: 0.7 }} />
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: 'var(--chat-text-primary)' }}>
                  Select a conversation
                </p>
                <p className="text-[14px] mt-1.5 max-w-[260px]" style={{ color: 'var(--chat-text-muted)' }}>
                  Choose someone from the sidebar to start chatting
                </p>
              </div>
            </div>
          ) : (
            <>
              {convError && (
                <p className="text-sm text-red-600 px-4 py-2 bg-red-50">
                  {convError.message}
                </p>
              )}
              {conversationId && (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
                  {/* Original background image */}
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-25 blur-sm dark:opacity-20 bg-no-repeat"
                    style={{ backgroundImage: `url('/chat-bg.jpeg')` }}
                    aria-hidden
                  />
                  <div className="relative z-10 flex-1 min-h-0 flex flex-col min-w-0">
                  {/* Message search bar */}
                  {showMessageSearch && (
                    <div
                      className="shrink-0 flex items-center gap-2 px-3 py-2 animate-in slide-in-from-top-2 duration-200"
                      style={{
                        backgroundColor: 'var(--chat-surface)',
                        borderBottom: '1px solid var(--chat-border)',
                      }}
                    >
                      <Search className="size-4 shrink-0" style={{ color: 'var(--chat-text-muted)' }} />
                      <input
                        ref={messageSearchInputRef}
                        type="text"
                        value={messageSearch}
                        onChange={(e) => {
                          setMessageSearch(e.target.value);
                          setMessageSearchIndex(0);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && messageSearchResults.length > 0) {
                            e.preventDefault();
                            setMessageSearchIndex((prev) =>
                              e.shiftKey
                                ? (prev - 1 + messageSearchResults.length) % messageSearchResults.length
                                : (prev + 1) % messageSearchResults.length
                            );
                          }
                          if (e.key === 'Escape') toggleMessageSearch();
                        }}
                        placeholder="Search in conversation…"
                        className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[var(--chat-text-muted)]"
                        style={{ color: 'var(--chat-text-primary)' }}
                      />
                      {messageSearch && (
                        <span className="text-[12px] shrink-0 tabular-nums" style={{ color: 'var(--chat-text-muted)' }}>
                          {messageSearchResults.length > 0
                            ? `${messageSearchIndex + 1}/${messageSearchResults.length}`
                            : '0 results'}
                        </span>
                      )}
                      {messageSearchResults.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg"
                            style={{ color: 'var(--chat-text-secondary)' }}
                            onClick={() =>
                              setMessageSearchIndex((prev) =>
                                (prev - 1 + messageSearchResults.length) % messageSearchResults.length
                              )
                            }
                            aria-label="Previous result"
                          >
                            <ChevronUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg"
                            style={{ color: 'var(--chat-text-secondary)' }}
                            onClick={() =>
                              setMessageSearchIndex((prev) =>
                                (prev + 1) % messageSearchResults.length
                              )
                            }
                            aria-label="Next result"
                          >
                            <ChevronDown className="size-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-lg"
                        style={{ color: 'var(--chat-text-muted)' }}
                        onClick={toggleMessageSearch}
                        aria-label="Close search"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                  <MessageList
                    messages={messages}
                    currentUserId={user.id}
                    currentUserProfile={currentProfile}
                    otherProfile={otherProfile ?? null}
                    loading={messagesLoading}
                    onReply={setReplyingTo}
                    highlightedMessageId={highlightedMessageId}
                    searchQuery={messageSearch}
                  />
                  <MessageInput
                    onSend={handleSend}
                    disabled={isAtLimit}
                    placeholder={
                      isAtLimit ? 'Daily limit reached' : 'Type a message…'
                    }
                    replyingTo={replyingTo}
                    replySenderName={
                      replyingTo
                        ? replyingTo.sender_id === user.id
                          ? (currentProfile?.display_name ?? currentProfile?.username ?? 'You')
                          : (otherProfile?.display_name ?? otherProfile?.username ?? 'Chat')
                        : undefined
                    }
                    onClearReply={() => setReplyingTo(null)}
                    conversationId={conversationId}
                    userId={user.id}
                  />
                  </div>
                </div>
              )}
              {!convLoading && !conversationId && !convError && selectedOtherUserId && (
                <div className="flex-1 flex items-center justify-center gap-2" style={{ color: 'var(--chat-text-muted)' }}>
                  <div
                    className="animate-pulse rounded-full size-4"
                    style={{ backgroundColor: 'var(--chat-accent)', opacity: 0.2 }}
                  />
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
  online,
}: {
  profile: PublicProfile;
  selected: boolean;
  onSelect: () => void;
  online: boolean;
}) {
  const label = profile.display_name ?? profile.username;
  const sub = profile.display_name ? `@${profile.username}` : null;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 touch-manipulation min-h-[52px] sm:min-h-0',
        )}
        style={{
          backgroundColor: selected ? 'var(--chat-accent-light)' : 'transparent',
          borderLeft: selected ? '3px solid var(--chat-accent)' : '3px solid transparent',
        }}
        onMouseEnter={(e) => {
          if (!selected) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--chat-surface)';
        }}
        onMouseLeave={(e) => {
          if (!selected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        }}
      >
        <div className="relative shrink-0">
          <Avatar size="sm" className="size-11 ring-0">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt="" />
            )}
            <AvatarFallback
              className="text-sm font-semibold text-white"
              style={{ backgroundColor: 'var(--chat-accent)' }}
            >
              {label.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span
            className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full"
            style={{
              backgroundColor: online ? 'var(--chat-online)' : 'var(--chat-text-muted)',
              border: `2px solid var(--chat-sidebar-bg)`,
            }}
            title={online ? 'Online' : 'Offline'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="font-medium text-[14px] truncate"
            style={{ color: selected ? 'var(--chat-accent)' : 'var(--chat-text-primary)' }}
          >
            {label}
          </p>
          {sub && (
            <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--chat-text-muted)' }}>{sub}</p>
          )}
        </div>
        <ChevronRight
          className="size-4 shrink-0"
          style={{ color: selected ? 'var(--chat-accent)' : 'var(--chat-text-muted)', opacity: 0.5 }}
        />
      </button>
    </li>
  );
}
