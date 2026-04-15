/**
 * pages/index.js
 * Free Mint Scanner — main UI
 */
import Head from "next/head";
import { useState, useEffect, useCallback, useRef } from "react";
import NFTCard from "../components/NFTCard";

const POLL_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL ?? "60000", 10);
const MAX_RESULTS = parseInt(process.env.NEXT_PUBLIC_MAX_RESULTS ?? "20", 10);

const CHAINS = ["all", "ethereum", "base", "polygon", "solana", "arbitrum"];

// ─── Icon components (inline SVG, no extra dep) ───────────────────────────────
const RefreshIcon = ({ spinning }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className={spinning ? "spin-slow" : ""}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const FilterIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const GridIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

// ─── Countdown bar ─────────────────────────────────────────────────────────────
function CountdownBar({ lastFetch, interval }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - lastFetch;
      const pct = Math.max(0, 100 - (elapsed / interval) * 100);
      setProgress(pct);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [lastFetch, interval]);

  return (
    <div className="h-0.5 w-full bg-border rounded-full overflow-hidden">
      <div
        className="h-full bg-acid transition-all duration-500 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatPill({ label, value }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-panel border border-border rounded-sm">
      <span className="font-display text-[10px] text-dim tracking-widest uppercase">{label}</span>
      <span className="font-display text-xs text-acid font-bold">{value}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [source, setSource] = useState("—");
  const [chainFilter, setChainFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [totalSeen, setTotalSeen] = useState(0);
  const seenIds = useRef(new Set());

  const fetchMints = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/free-mints?limit=${MAX_RESULTS}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setSource(data.source ?? "unknown");
      setLastFetch(Date.now());

      // Track new items
      let newCount = 0;
      (data.items ?? []).forEach((i) => {
        if (!seenIds.current.has(i.id)) { seenIds.current.add(i.id); newCount++; }
      });
      if (newCount > 0) setTotalSeen((p) => p + newCount);
    } catch (e) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchMints(); }, [fetchMints]);

  // Polling
  useEffect(() => {
    const id = setInterval(() => fetchMints(true), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchMints]);

  // Filtered + searched items
  const filtered = items.filter((item) => {
    const matchChain = chainFilter === "all" || item.chain === chainFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || item.name?.toLowerCase().includes(q) || item.collection?.toLowerCase().includes(q);
    return matchChain && matchSearch;
  });

  const isMock = source.includes("mock");

  return (
    <>
      <Head>
        <title>Free Mint Scanner</title>
        <meta name="description" content="Real-time scanner for free NFT mints across chains" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔍</text></svg>" />
      </Head>

      <div className="min-h-screen bg-void text-[#e8e8f0]">
        {/* ── Header ── */}
        <header className="sticky top-0 z-50 border-b border-border bg-void/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-7 h-7 rounded-sm bg-acid flex items-center justify-center">
                  <span className="font-display text-void text-sm font-bold">F</span>
                </div>
                <div>
                  <h1 className="font-display text-sm font-bold tracking-tight text-[#e8e8f0] cursor-blink">
                    FREE MINT SCANNER
                  </h1>
                  <p className="font-display text-[10px] text-dim tracking-widest">
                    LIVE · MULTI-CHAIN
                  </p>
                </div>
              </div>

              {/* Live indicator + stats */}
              <div className="hidden sm:flex items-center gap-2">
                <StatPill label="Found" value={totalSeen} />
                <StatPill label="Showing" value={filtered.length} />
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-panel border border-border rounded-sm">
                  <div className="w-2 h-2 rounded-full bg-acid live-dot" />
                  <span className="font-display text-[10px] text-acid tracking-widest">LIVE</span>
                </div>
              </div>

              {/* Refresh button */}
              <button
                onClick={() => fetchMints()}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 font-display text-xs border border-border rounded-sm text-ghost hover:text-acid hover:border-acid transition-colors disabled:opacity-40"
              >
                <RefreshIcon spinning={loading} />
                <span className="hidden sm:inline">{loading ? "SCANNING..." : "REFRESH"}</span>
              </button>
            </div>

            {/* Countdown */}
            <div className="mt-2">
              <CountdownBar lastFetch={lastFetch} interval={POLL_INTERVAL} />
            </div>
          </div>
        </header>

        {/* ── Toolbar ── */}
        <div className="border-b border-border bg-ink/50">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <input
                type="text"
                placeholder="Search name / collection…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-panel border border-border rounded-sm px-3 py-1.5 font-display text-xs text-[#e8e8f0] placeholder:text-dim focus:outline-none focus:border-acid/50 transition-colors"
              />
            </div>

            {/* Chain filter */}
            <div className="flex items-center gap-1">
              <FilterIcon />
              <div className="flex gap-1 flex-wrap">
                {CHAINS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setChainFilter(c)}
                    className={`font-display text-[10px] px-2 py-1 rounded-sm border transition-colors tracking-wider ${
                      chainFilter === c
                        ? "bg-acid text-void border-acid"
                        : "border-border text-dim hover:border-ghost hover:text-ghost"
                    }`}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-sm border transition-colors ${viewMode === "grid" ? "border-acid text-acid" : "border-border text-dim hover:text-ghost"}`}
              >
                <GridIcon />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-sm border transition-colors ${viewMode === "list" ? "border-acid text-acid" : "border-border text-dim hover:text-ghost"}`}
              >
                <ListIcon />
              </button>
            </div>
          </div>
        </div>

        {/* ── Mock banner ── */}
        {isMock && (
          <div className="bg-[#C8FF0011] border-b border-[#C8FF0033]">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
              <span className="font-display text-[11px] text-acid">⚠ DEMO MODE</span>
              <span className="font-display text-[11px] text-dim">
                — Add your{" "}
                <code className="text-ghost bg-panel px-1 py-0.5 rounded">OPENSEA_API_KEY</code>
                {" "}in{" "}
                <code className="text-ghost bg-panel px-1 py-0.5 rounded">.env.local</code>
                {" "}to see live data
              </span>
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-950/40 border border-red-800/50 rounded-sm">
              <p className="font-display text-xs text-red-400">
                ERROR: {error}
              </p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && items.length === 0 && (
            <div className={`grid gap-3 ${
              viewMode === "grid"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2"
            }`}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-sm border border-border bg-panel overflow-hidden animate-pulse">
                  <div className="aspect-square bg-ink" />
                  <div className="p-3 space-y-2">
                    <div className="h-2 bg-border rounded w-3/4" />
                    <div className="h-3 bg-border rounded w-full" />
                    <div className="h-2 bg-border rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="font-display text-5xl text-muted">∅</div>
              <p className="font-display text-sm text-dim tracking-widest">
                NO FREE MINTS DETECTED
              </p>
              <button
                onClick={() => fetchMints()}
                className="font-display text-xs px-4 py-2 border border-border text-ghost rounded-sm hover:border-acid hover:text-acid transition-colors"
              >
                SCAN AGAIN
              </button>
            </div>
          )}

          {/* Grid */}
          {filtered.length > 0 && (
            <div className={`grid gap-3 ${
              viewMode === "grid"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}>
              {filtered.map((nft, i) => (
                <NFTCard key={nft.id} nft={nft} index={i} />
              ))}
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-border mt-12 py-6">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-display text-[10px] text-muted tracking-widest">
              FREE MINT SCANNER · POLLS EVERY {POLL_INTERVAL / 1000}s
            </p>
            <p className="font-display text-[10px] text-muted tracking-widest">
              SOURCE: {source.toUpperCase()}
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
