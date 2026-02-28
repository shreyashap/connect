'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MessageCircle, Shield, Zap, ArrowRight } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-[128px] animate-pulse" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-sky-500/8 blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-violet-500/8 blur-[100px] animate-pulse [animation-delay:4s]" />
      </div>

      {/* Subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Navigation */}
      <nav className="absolute top-0 z-20 flex w-full items-center justify-between px-8 py-6 md:px-16">
        <div className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 shadow-lg shadow-white/5">
            <MessageCircle className="h-5 w-5 text-zinc-900" />
          </div>
          <span className="text-lg font-bold tracking-tight">Connect</span>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="rounded-xl px-5 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg shadow-white/5 transition-all hover:bg-white hover:shadow-white/10 active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex max-w-3xl flex-col items-center px-6 text-center">
        {/* Badge */}
        <div className="mb-8 flex items-center space-x-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-zinc-400">Real-time messaging</span>
        </div>

        <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl">
          Where every
          <br />
          <span className="bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-600 bg-clip-text text-transparent">
            whisper matters
          </span>
        </h1>

        <p className="mb-10 max-w-lg text-lg leading-relaxed text-zinc-500">
          A beautifully crafted chat experience. Instant messages, real-time presence, and a design that feels like the future.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="group flex items-center space-x-2 rounded-2xl bg-zinc-100 px-8 py-3.5 text-sm font-bold text-zinc-900 shadow-[0_20px_40px_rgba(255,255,255,0.08)] transition-all hover:bg-white hover:shadow-[0_20px_60px_rgba(255,255,255,0.12)] active:scale-95"
          >
            <span>Start Chatting</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border border-white/10 px-8 py-3.5 text-sm font-medium text-zinc-400 backdrop-blur-sm transition-all hover:border-white/20 hover:text-zinc-200 active:scale-95"
          >
            I have an account
          </Link>
        </div>
      </main>

      {/* Feature Cards */}
      <section className="relative z-10 mt-28 grid w-full max-w-4xl grid-cols-1 gap-4 px-6 pb-16 md:grid-cols-3">
        {[
          {
            icon: Zap,
            title: 'Instant Delivery',
            desc: 'Messages arrive in milliseconds with real-time WebSocket connections.',
          },
          {
            icon: MessageCircle,
            title: 'Live Presence',
            desc: 'See who\'s online, typing indicators, and read receipts — all in real-time.',
          },
          {
            icon: Shield,
            title: 'Private & Secure',
            desc: 'Your conversations stay between you and the people you trust.',
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="group rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-white/10">
              <feature.icon className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-zinc-200" />
            </div>
            <h3 className="mb-1.5 text-sm font-bold tracking-tight text-zinc-200">{feature.title}</h3>
            <p className="text-xs leading-relaxed text-zinc-600">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="relative z-10 pb-8 text-center">
        <p className="text-[11px] text-zinc-700">
          Built with care. &copy; {new Date().getFullYear()} Connect
        </p>
      </footer>
    </div>
  );
}
