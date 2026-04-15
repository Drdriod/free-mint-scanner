/**
 * pages/index.js
 * Free Mint Scanner — Modern Apple-inspired UI
 */
import Head from "next/head";
import { useState, useEffect, useCallback, useRef } from "react";
import NFTCard from "../components/NFTCard";

const POLL_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL ?? "60000", 10);
const MAX_RESULTS = parseInt(process.env.NEXT_PUBLIC_MAX_RESULTS ?? "20", 10);

const CHAINS = ["all", "ethereum", "base", "polygon", "solana", "arbitrum"];

// ─── Icon components ───────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={spinning ? "animate-spin" : ""}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

// ─── Stat Pill ────────────────────────────────────────────────────────────
function StatPill({ label, value }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg border border-border-light text-sm">
      <span className="text-secondary text-xs font-medium">{label}</span>
      <span className="text-primary font-semibold">{value}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [source, setSource] = useState("—");
  const [chainFilter, setChainFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
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

  useEffect(() => { fetchMints(); }, [fetchMints]);

  useEffect(() => {
    const id = setInterval(() => fetchMints(true), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchMints]);

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
        <meta name="description" content="Discover free NFT mints across multiple blockchains" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔍</text></svg>" />
      </Head>

      <div className="min-h-screen bg-primary text-text-primary">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-primary/95 backdrop-blur-md border-b border-border-light">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white text-lg font-bold">F</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight">Free Mint Scanner</h1>
                  <p className="text-xs text-secondary">Real-time NFT discovery</p>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-3">
                <StatPill label="Found" value={totalSeen} />
                <StatPill label="Showing" value={filtered.length} />
              </div>

              {/* Refresh button */}
              <button
                onClick={() => fetchMints()}
                disabled={loading}
                className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshIcon spinning={loading} />
                <span className="hidden sm:inline text-sm">{loading ? "Scanning..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="border-b border-border-light bg-secondary">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by name or collection…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border-light bg-primary focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            {/* Chain filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-secondary font-medium flex items-center gap-1">
                <FilterIcon /> Chain
              </span>
              <div className="flex gap-2 flex-wrap">
                {CHAINS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setChainFilter(c)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      chainFilter === c
                        ? "bg-primary text-white border-primary"
                        : "bg-primary border-border-light text-text-primary hover:border-primary"
                    }`}
                  >
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-2 border-l border-border-light pl-4">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg border transition-all ${viewMode === "grid" ? "bg-primary text-white border-primary" : "border-border-light hover:border-primary"}`}
              >
                <GridIcon />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg border transition-all ${viewMode === "list" ? "bg-primary text-white border-primary" : "border-border-light hover:border-primary"}`}
              >
                <ListIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Demo mode banner */}
        {isMock && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2">
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠ Demo Mode — Add your OpenSea API key in <code className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">.env.local</code> for live data
              </span>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Error state */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-200">
                ⚠ {error}
              </p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && items.length === 0 && (
            <div className={`grid gap-4 ${
              viewMode === "grid"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2"
            }`}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border-light bg-secondary overflow-hidden animate-pulse">
                  <div className="aspect-square bg-border-light" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-border-light rounded w-3/4" />
                    <div className="h-4 bg-border-light rounded w-full" />
                    <div className="h-3 bg-border-light rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="text-5xl">∅</div>
              <p className="text-secondary text-sm font-medium">No free mints found</p>
              <button
                onClick={() => fetchMints()}
                className="btn btn-primary text-sm"
              >
                Scan Again
              </button>
            </div>
          )}

          {/* Grid */}
          {filtered.length > 0 && (
            <div className={`grid gap-4 ${
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

        {/* Footer */}
        <footer className="border-t border-border-light mt-12 py-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-secondary">
              Free Mint Scanner · Updates every {POLL_INTERVAL / 1000}s
            </p>
            <p className="text-xs text-secondary">
              Source: <span className="font-medium text-text-primary">{source.toUpperCase()}</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
