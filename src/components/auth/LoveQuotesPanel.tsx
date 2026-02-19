import { useState, useEffect } from 'react';

const INTERVAL_MS = 3000;
const IMAGE_INTERVAL_MS = 2000;

const BACKGROUND_IMAGES = [
  '/chat-bg.jpeg',
  '/WhatsApp Image 2026-02-19 at 21.22.46.jpeg',
  '/WhatsApp Image 2026-02-19 at 21.34.40.jpeg',
  '/WhatsApp Image 2026-02-19 at 21.34.40 (1).jpeg',
  '/WhatsApp Image 2026-02-19 at 21.34.40 (2).jpeg',
  '/WhatsApp Image 2026-02-19 at 21.34.40 (3).jpeg',
  '/WhatsApp Image 2026-02-19 at 21.34.40 (4).jpeg',
  '/WhatsApp Image 2026-02-19 at 21.34.40 (5).jpeg',
  '/WhatsApp Image 2026-02-19 at 21.34.40 (6).jpeg',
  '/WhatsApp Image 2026-02-19 at 21.34.40 (7).jpeg',
  '/WhatsApp Image 2026-02-19 at 21.34.40 (8).jpeg',
].map((path) => `url('${encodeURI(path)}')`);

const LOVE_QUOTES = [
  'Love is composed of a single soul inhabiting two bodies.',
  'The best thing to hold onto in life is each other.',
  'In you, I found the love of my life and my closest, truest friend.',
  'I love you not because of who you are, but because of who I am when I am with you.',
  'You know you\'re in love when you can\'t fall asleep because reality is finally better than your dreams.',
  'Love is when the other person\'s happiness is more important than your own.',
  'Grow old with me, the best is yet to be.',
  'I have found the one whom my soul loves.',
  'To love and be loved is to feel the sun from both sides.',
  'Love isn\'t something you find. Love is something that finds you.',
  'Where there is love there is life.',
  'The greatest happiness of life is the conviction that we are loved.',
  'Love is not just looking at each other, it\'s looking in the same direction.',
  'I would rather share one lifetime with you than face all the ages of this world alone.',
];

export function LoveQuotesPanel() {
  const [index, setIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setImageIndex((i) => (i + 1) % BACKGROUND_IMAGES.length);
    }, IMAGE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const goNext = () => {
    setIndex((i) => (i + 1) % LOVE_QUOTES.length);
    setProgress(0);
  };

  useEffect(() => {
    const id = setInterval(goNext, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setProgress(0);
    let cancelled = false;
    const start = performance.now();
    const frame = (now: number) => {
      if (cancelled) return;
      const elapsed = now - start;
      setProgress(Math.min((elapsed / INTERVAL_MS) * 100, 100));
      if (elapsed < INTERVAL_MS) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return () => { cancelled = true; };
  }, [index]);

  return (
    <div className="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-900">
      {/* Background images - cycle every 2 sec with crossfade */}
      {BACKGROUND_IMAGES.map((bg, i) => (
        <div
          key={i}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ${
            i === imageIndex ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none -z-10'
          }`}
          style={{ backgroundImage: bg }}
          aria-hidden
        />
      ))}

      {/* Glassmorphism quotes card - bottom center, wide and short */}
      <div className="absolute inset-x-4 bottom-4 md:inset-x-8 md:bottom-8 flex justify-center">
        <div className="relative w-full max-w-4xl rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl px-6 py-3 md:px-10 md:py-4 shadow-xl border border-white/60 dark:border-slate-700/50">
          {/* Circular progress indicator */}
          <div className="absolute top-2 right-3 size-6 rounded-full p-[2px] bg-slate-200/80 dark:bg-slate-700/60">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-300 dark:text-slate-600"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 15}`}
                strokeDashoffset={`${2 * Math.PI * 15 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="text-rose-500 dark:text-rose-400 transition-all duration-100"
              />
            </svg>
          </div>

          <blockquote className="text-center space-y-1 pr-8">
            <p
              key={index}
              className="text-base md:text-lg font-medium text-slate-700 dark:text-slate-200 leading-snug animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {LOVE_QUOTES[index]}
            </p>
            <footer className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
              — Love
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
