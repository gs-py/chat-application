import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, X, Camera, ImageIcon, Smile, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/database';
import {
  uploadChatImage,
  getImageUploadError,
} from '@/lib/chat-storage';

type Props = {
  onSend: (
    content: string,
    replyToId?: string | null,
    imageUrl?: string | null
  ) => Promise<void>;
  disabled: boolean;
  placeholder?: string;
  replyingTo?: Message | null;
  replySenderName?: string;
  onClearReply?: () => void;
  conversationId: string | null;
  userId: string | undefined;
};

export function MessageInput({
  onSend,
  disabled,
  placeholder = 'Type a message…',
  replyingTo,
  replySenderName,
  onClearReply,
  conversationId,
  userId,
}: Props) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canSend = (value.trim() || imageFile) && !sending && !disabled;

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const err = getImageUploadError(file);
    if (err) {
      setImageError(err);
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    e.target.value = '';
  };

  const clearImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageError(null);
  };

  const startCamera = () => {
    setCameraError(null);
    setShowCamera(true);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setShowCamera(false);
    setCameraError(null);
  };

  const initCamera = async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Could not access camera');
    }
  };

  useEffect(() => {
    if (showCamera) initCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [showCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.srcObject || video.readyState !== 4) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const err = getImageUploadError(file);
        if (err) {
          setImageError(err);
          stopCamera();
          return;
        }
        setImageFile(file);
        setImagePreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      },
      'image/jpeg',
      0.9
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || !conversationId || !userId) return;
    setSending(true);
    setImageError(null);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadChatImage(imageFile, conversationId, userId);
        clearImage();
      }
      await onSend(value.trim() || '', replyingTo?.id ?? null, imageUrl);
      setValue('');
      onClearReply?.();
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSending(false);
    }
  };

  const snippet = replyingTo?.content
    ? replyingTo.content.length > 60
      ? replyingTo.content.slice(0, 60) + '…'
      : replyingTo.content
    : '';

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col shrink-0"
      style={{
        backgroundColor: 'var(--chat-surface)',
        borderTop: '1px solid var(--chat-border)',
      }}
    >
      {/* Reply preview */}
      {replyingTo && (
        <div
          className="flex items-center gap-2 mx-3 sm:mx-4 mt-3 rounded-2xl overflow-hidden animate-reply-slide"
          style={{
            backgroundColor: 'var(--chat-surface-tertiary)',
          }}
        >
          <div
            className="self-stretch w-[3px] shrink-0 rounded-l-full"
            style={{ backgroundColor: 'var(--chat-accent)' }}
          />
          <div className="flex-1 min-w-0 py-2.5 pl-1.5">
            <p
              className="text-[12px] font-semibold"
              style={{ color: 'var(--chat-accent)' }}
            >
              Replying to {replySenderName ?? 'message'}
            </p>
            <p
              className="text-[13px] truncate mt-0.5"
              style={{ color: 'var(--chat-text-muted)' }}
            >
              {snippet}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 size-8 rounded-full mr-2 hover:bg-white/5"
            onClick={onClearReply}
            aria-label="Cancel reply"
          >
            <X className="size-4" style={{ color: 'var(--chat-text-muted)' }} />
          </Button>
        </div>
      )}

      {/* Image preview */}
      {imagePreviewUrl && (
        <div
          className="flex items-center gap-3 mx-3 sm:mx-4 mt-3 px-3 py-2.5 rounded-2xl"
          style={{ backgroundColor: 'var(--chat-surface-tertiary)' }}
        >
          <div className="relative shrink-0">
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="size-14 object-cover rounded-xl"
              style={{ border: '1px solid var(--chat-border)' }}
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute -top-1.5 -right-1.5 size-6 rounded-full shadow"
              onClick={clearImage}
              aria-label="Remove image"
            >
              <X className="size-3" />
            </Button>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--chat-text-muted)' }}>Image attached</p>
        </div>
      )}

      {/* Error */}
      {imageError && (
        <div className="mx-3 sm:mx-4 mt-2 px-3 py-2 text-sm rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#fca5a5' }}>
          {imageError}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex items-end gap-2.5 px-3 sm:px-4 py-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Input field container */}
        <div
          className="flex-1 flex items-end rounded-[24px] px-1.5 py-1 min-h-[46px] transition-all duration-200"
          style={{
            backgroundColor: 'var(--chat-input-bg)',
            border: '1px solid var(--chat-border)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Attachment */}
          <div className="relative shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 rounded-full hover:bg-white/5"
              onClick={() => setShowImageMenu((v) => !v)}
              disabled={disabled || !conversationId}
              aria-label="Attach image or take photo"
              aria-expanded={showImageMenu}
            >
              <Paperclip className="size-[18px] rotate-45" style={{ color: 'var(--chat-text-muted)' }} />
            </Button>
            {showImageMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden
                  onClick={() => setShowImageMenu(false)}
                />
                <div
                  className="absolute bottom-full left-0 z-50 mb-2 flex flex-col gap-0.5 rounded-2xl py-1.5 shadow-lg min-w-[180px]"
                  style={{
                    backgroundColor: 'var(--chat-surface)',
                    border: '1px solid var(--chat-border)',
                    boxShadow: 'var(--chat-shadow-md)',
                  }}
                >
                  <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-2.5 text-left text-[13px] rounded-xl mx-1.5 transition-colors hover:bg-white/5"
                    style={{ color: 'var(--chat-text-primary)' }}
                    onClick={() => {
                      startCamera();
                      setShowImageMenu(false);
                    }}
                  >
                    <Camera className="size-4" style={{ color: 'var(--chat-accent)' }} />
                    Take photo
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-2.5 text-left text-[13px] rounded-xl mx-1.5 transition-colors hover:bg-white/5"
                    style={{ color: 'var(--chat-text-primary)' }}
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowImageMenu(false);
                    }}
                  >
                    <ImageIcon className="size-4" style={{ color: 'var(--chat-accent)' }} />
                    Choose from library
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSend) handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 min-w-0 border-0 bg-transparent shadow-none px-1.5 py-2.5 text-[16px] outline-none resize-none leading-[1.4]"
            style={{ color: 'var(--chat-text-primary)', maxHeight: '120px' }}
          />

          {/* Emoji — focus input to open keyboard (mobile: user can switch to emoji; web: ready to type) */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 size-9 rounded-full hover:bg-white/5"
            disabled={disabled}
            aria-label="Open emoji keyboard"
            onClick={() => textareaRef.current?.focus()}
          >
            <Smile className="size-[18px]" style={{ color: 'var(--chat-text-muted)' }} />
          </Button>
        </div>

        {/* Send button */}
        <Button
          type="submit"
          disabled={!canSend}
          className={cn(
            'shrink-0 size-[46px] min-w-[46px] rounded-full text-white touch-manipulation animate-send-press',
            canSend ? 'send-btn-gradient' : 'disabled:opacity-30'
          )}
          style={canSend ? undefined : {
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <Send className="size-[18px]" strokeWidth={2.2} />
        </Button>
      </div>

      {/* Camera modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="rounded-3xl overflow-hidden max-w-lg w-full"
            style={{ backgroundColor: 'var(--chat-surface)', boxShadow: 'var(--chat-shadow-md)' }}
          >
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            {cameraError && (
              <p className="px-4 py-3 text-sm text-red-600">
                {cameraError}
              </p>
            )}
            <div className="flex gap-3 p-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl h-11"
                style={{ borderColor: 'var(--chat-border)' }}
                onClick={stopCamera}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl h-11 text-white"
                style={{ backgroundColor: 'var(--chat-accent)' }}
                onClick={capturePhoto}
                disabled={!!cameraError}
              >
                Capture
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
