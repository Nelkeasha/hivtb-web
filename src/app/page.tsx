'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { isAuthenticated, getRole, roleHome } from '@/lib/auth';

const SLIDES = [
  {
    url: '/slides/dmc-hospital.jpg',
    caption: 'Your Health, Our Mission.',
  },
  {
    url: '/slides/dmc-hospital.jpg',
    caption: 'Because Every Life Matters.',
  },
];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path d="M3 16h5l2-5 3 11 3-8 2 2h6"/>
      </svg>
    ),
    title: 'Real-time adherence',
    desc: 'See who is slipping the day a dose is missed.',
  },
  {
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <circle cx="14" cy="14" r="3.5"/><path d="M14 5v3M14 20v3M5 14h3M20 14h3M8 8l2 2M18 18l2 2M20 8l-2 2M10 18l-2 2"/>
      </svg>
    ),
    title: 'AI risk scoring',
    desc: 'Advisory scores flag who may drop out. Staff decide.',
  },
  {
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path d="M4 21l5-5 4 4 8-10"/><path d="M18 10h5v5"/>
      </svg>
    ),
    title: 'Interruption tracing',
    desc: 'Late, escalated, interrupted. No one quietly lost.',
  },
  {
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path d="M19 23v-2a3.5 3.5 0 0 0-7 0v2"/><circle cx="15.5" cy="10" r="3.5"/>
      </svg>
    ),
    title: 'CHW priority lists',
    desc: 'A daily visit list, ordered by who needs attention first.',
  },
  {
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path d="M14 24a10 10 0 1 0-10-10"/><path d="M4 4v6h6"/>
      </svg>
    ),
    title: 'Offline-first mobile',
    desc: 'Works on ordinary Android phones with no signal.',
  },
  {
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-6 h-6">
        <path d="M8 10V6h12v4M14 6v18M10 24h8"/>
      </svg>
    ),
    title: 'FHIR exchange',
    desc: "Fits hospital systems and Rwanda's health data stack.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [slideIdx, setSlideIdx] = useState(0);
  const [capVisible, setCapVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Authenticated users jump straight to their role home
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(roleHome(getRole() ?? ''));
    }
  }, [router]);

  const goToSlide = useCallback((n: number) => {
    setCapVisible(false);
    setTimeout(() => {
      setSlideIdx((n + SLIDES.length) % SLIDES.length);
      setCapVisible(true);
    }, 120);
  }, []);

  const restart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => goToSlide(slideIdx + 1), 5000);
  }, [goToSlide, slideIdx]);

  useEffect(() => {
    timerRef.current = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const slide = SLIDES[slideIdx];

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: '#FCFBFA', color: '#463B36' }}>

      {/* ── NAV ──────────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid #EAE6E3', background: '#FCFBFA' }}>
        <div
          className="flex items-center justify-between"
          style={{ maxWidth: 1120, margin: '0 auto', padding: '0 32px', height: 72 }}
        >
          <div className="flex items-center gap-3">
            <Image
              src="/dmc-logo.png"
              alt="Dream Medical Center"
              width={120}
              height={50}
              style={{ objectFit: 'contain', height: 40, width: 'auto' }}
              priority
            />
          </div>
          <a
            href="https://www.dreammedicalcenter.rw"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: '#7A6E68',
              letterSpacing: '0.3px',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#C73E22'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#7A6E68'; }}
          >
            dreammedicalcenter.rw
          </a>
        </div>
      </header>

      {/* ── HERO SLIDER ──────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'min(76vh, 560px)',
          overflow: 'hidden',
          background: '#2A1510',
        }}
      >
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.url}
          alt={slide.caption}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 1.1s ease',
          }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(20,12,8,.32), rgba(20,12,8,.58))',
          }}
        />
        {/* Caption */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <h2
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              fontWeight: 700,
              color: '#fff',
              fontSize: 'clamp(28px, 5vw, 52px)',
              letterSpacing: '-0.5px',
              textShadow: '0 2px 24px rgba(0,0,0,.35)',
              textAlign: 'center',
              padding: '0 24px',
              opacity: capVisible ? 1 : 0,
              transform: capVisible ? 'none' : 'translateY(12px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            {slide.caption}
          </h2>
        </div>

        {/* Prev/Next arrows */}
        <button
          aria-label="Previous slide"
          onClick={() => { goToSlide(slideIdx - 1); restart(); }}
          style={{
            position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', zIndex: 3,
            width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,.18)', color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', backdropFilter: 'blur(4px)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4}><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <button
          aria-label="Next slide"
          onClick={() => { goToSlide(slideIdx + 1); restart(); }}
          style={{
            position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)', zIndex: 3,
            width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,.18)', color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', backdropFilter: 'blur(4px)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4}><path d="M9 6l6 6-6 6"/></svg>
        </button>

        {/* Dots */}
        <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, zIndex: 3, display: 'flex', gap: 9, justifyContent: 'center' }}>
          {SLIDES.map((_, n) => (
            <button
              key={n}
              aria-label={`Go to slide ${n + 1}`}
              onClick={() => { goToSlide(n); restart(); }}
              style={{
                width: n === slideIdx ? 26 : 11,
                height: 11,
                borderRadius: n === slideIdx ? 6 : '50%',
                border: 'none',
                cursor: 'pointer',
                background: n === slideIdx ? '#E64B2E' : 'rgba(255,255,255,.5)',
                transition: 'all 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── HERO TEXT ─────────────────────────────────────── */}
      <div style={{ padding: '76px 0 0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 32px' }}>
          <span
            style={{
              display: 'block',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: '#C73E22',
              marginBottom: 20,
            }}
          >
            Dream Medical Center · Kigali, Rwanda
          </span>
          <h1
            className="font-display"
            style={{
              fontWeight: 500,
              fontSize: 'clamp(34px, 5vw, 54px)',
              lineHeight: 1.05,
              letterSpacing: '-1.2px',
              color: '#241A16',
              marginBottom: 22,
              maxWidth: 820,
            }}
          >
            HIV &amp; TB Patient Monitoring System
          </h1>
          <p style={{ fontSize: 18, color: '#463B36', maxWidth: 600, lineHeight: 1.65 }}>
            A community health platform that helps Dream Medical Center keep HIV and TB patients in care,
            from the clinic to the household, by connecting facility clinicians with Community Health Workers in the field.
          </p>

          {/* Care-line SVG */}
          <div style={{ marginTop: 56 }}>
            <svg viewBox="0 0 1180 220" role="img" aria-label="A continuous care-line from clinic through a CHW visit back to on-treatment status" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
              <rect x="560" y="150" width="180" height="56" fill="#C0392B" opacity="0.05" rx="4" className="fade-in-delay" />
              <path
                className="draw-path"
                stroke="#9C3219"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M40,110 L150,110 L165,110 L175,86 L188,134 L200,110 L235,110
                   L250,110 L260,90 L272,130 L284,110 L330,110
                   L345,110 L355,92 L367,128 L379,110 L430,110 L470,110
                   C520,110 540,178 600,182 C645,185 660,150 690,150"
              />
              <path
                className="draw-path"
                stroke="#E64B2E"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animationDelay: '1.1s' }}
                d="M690,150 C740,150 760,110 820,110 L860,110 L872,90 L884,130 L896,110 L940,110
                   L955,110 L965,92 L977,128 L989,110 L1140,110"
              />
              <g className="fade-in-delay">
                <circle cx="40" cy="110" r="6" fill="#9C3219"/>
                <text fontFamily="'IBM Plex Mono', monospace" fontSize="10.5" letterSpacing="1" x="40" y="92" textAnchor="start" fill="#9C3219">CLINIC</text>
                <circle cx="600" cy="182" r="5" fill="#C0392B"/>
                <text fontFamily="'IBM Plex Mono', monospace" fontSize="9.5" letterSpacing=".5" x="600" y="206" textAnchor="middle" fill="#7A6E68">missed doses</text>
                <circle cx="690" cy="150" r="8" fill="#fff" stroke="#E64B2E" strokeWidth="3"/>
                <text fontFamily="'IBM Plex Mono', monospace" fontSize="10.5" letterSpacing="1" x="690" y="135" textAnchor="middle" fill="#C73E22">CHW visit</text>
                <circle cx="1140" cy="110" r="6" fill="#2E7D32"/>
                <text fontFamily="'IBM Plex Mono', monospace" fontSize="10.5" letterSpacing="1" x="1140" y="92" textAnchor="end" fill="#2E7D32">On treatment</text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* ── WHAT IT DOES ─────────────────────────────────── */}
      <div style={{ padding: '72px 0 80px', borderTop: '1px solid #EAE6E3', marginTop: 64 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 32px' }}>
          <span
            style={{
              display: 'block',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: '#C73E22',
              marginBottom: 34,
            }}
          >
            What it does
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 56px' }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 1fr',
                  gap: 16,
                  padding: '20px 0',
                  borderTop: '1px solid #EAE6E3',
                }}
              >
                <span style={{ color: '#C73E22', marginTop: 2 }}>{f.icon}</span>
                <div>
                  <h3
                    className="font-display"
                    style={{ fontWeight: 600, fontSize: 17, color: '#241A16', marginBottom: 3 }}
                  >
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#7A6E68' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ padding: '54px 0 28px', borderTop: '1px solid #EAE6E3' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr 1fr', gap: 34, marginBottom: 32 }}>
            {/* About */}
            <div>
              <Image
                src="/dmc-logo.png"
                alt="Dream Medical Center"
                width={130}
                height={54}
                style={{ objectFit: 'contain', height: 44, width: 'auto', marginBottom: 12 }}
              />
              <div
                className="font-display"
                style={{ fontStyle: 'italic', color: '#7A6E68', fontSize: 14, marginBottom: 14 }}
              >
                &ldquo;Where Science and Faith meet to bring healing&rdquo;
              </div>
              <div style={{ fontSize: 13, color: '#7A6E68', lineHeight: 1.7 }}>
                P.O. Box 6737 Kigali · KK 541 St Kagarama, Kicukiro‑Bugesera Rd
              </div>
            </div>

            {/* Hospital links */}
            <div>
              <h4
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10.5,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#7A6E68',
                  marginBottom: 13,
                }}
              >
                Hospital
              </h4>
              {['Website', 'About', 'Contact'].map(l => (
                <a
                  key={l}
                  href={`https://www.dreammedicalcenter.rw${l === 'Website' ? '' : '/' + l.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', fontSize: 13.5, color: '#241A16', marginBottom: 8, textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#C73E22'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#241A16'; }}
                >
                  {l}
                </a>
              ))}
            </div>

            {/* Reach us */}
            <div>
              <h4
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10.5,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#7A6E68',
                  marginBottom: 13,
                }}
              >
                Reach us
              </h4>
              <a
                href="tel:+250782749660"
                style={{ display: 'block', fontSize: 13.5, color: '#241A16', marginBottom: 8, textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#C73E22'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#241A16'; }}
              >
                +250 782 749 660
              </a>
              <a
                href="mailto:info@dreammedicalcenter.rw"
                style={{ display: 'block', fontSize: 13.5, color: '#241A16', textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#C73E22'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#241A16'; }}
              >
                info@dreammedicalcenter.rw
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              borderTop: '1px solid #EAE6E3',
              paddingTop: 20,
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: '#7A6E68',
            }}
          >
            <span>© 2026 Dream Medical Center · HIV &amp; TB Patient Monitoring System</span>
            <span>Final-year project · AUCA</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
