/**
 * pages/index.js
 * Free Mint Scanner — Premium Apple-inspired UI with Verified Filtering
 */
import Head from "next/head";
import { useState, useEffect, useCallback, useRef } from "react";
import NFTCard from "../components/NFTCard";

const POLL_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL ?? "60000", 10);
const MAX_RESULTS = parseInt(process.env.NEXT_PUBLIC_MAX_RESULTS ?? "20", 10);

const CHAINS = ["all", "ethereum", "base", "polygon", "solana", "arbitrum"];

// ─── Icon components ───────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary absolute left-3 top-1/2 -translate-y-1/2">
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

const VerifiedIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`text-primary ${className}`}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

// ─── Stat Pill ────────────────────────────────────────────────────────────
function StatPill({ label, value }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border-light text-sm backdrop-blur-sm">
      <span className="text-secondary text-xs font-medium uppercase tracking-wider">{label}</span>
      <span className="text-text-primary font-bold">{value}</span>
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
  const [verifiedOnly, setVerifiedOnly] = useState(false);
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
    const matchVerified = !verifiedOnly || item.collection_verified === true;
    return matchChain && matchSearch && matchVerified;
  });

  const isMock = source.includes("mock");

  return (
    <>
      <Head>
        <title>Free Mint Scanner | Premium NFT Discovery</title>
        <meta name="description" content="Discover verified free NFT mints across multiple blockchains with real-time updates." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💎</text></svg>" />
      </Head>

      <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-primary/20">
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-border-light">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center">
                <span className="text-white text-xl font-bold">F</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Free Mint Scanner</h1>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Real-time Monitoring</p>
                </div>
              </div>
            </div>

            {/* Global Stats */}
            <div className="hidden lg:flex items-center gap-4">
              <StatPill label="Total Found" value={totalSeen} />
              <StatPill label="Active Now" value={filtered.length} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchMints()}
                disabled={loading}
                className="h-11 px-6 rounded-full bg-primary text-white font-semibold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <RefreshIcon spinning={loading} />
                <span>{loading ? "Scanning..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Hero & Filters Section */}
        <section className="bg-bg-secondary/30 pt-12 pb-8 border-b border-border-light">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col gap-8">
              {/* Search Bar */}
              <div className="relative group max-w-2xl">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search by name, collection, or contract..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-14 pl-12 pr-6 rounded-2xl border-2 border-border-light bg-bg-primary focus:border-primary focus:ring-0 transition-all text-lg font-medium placeholder:text-secondary/50 shadow-sm"
                />
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-wrap items-center gap-6">
                {/* Chain Selector */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Blockchain</span>
                  <div className="flex gap-2 p-1.5 bg-bg-primary rounded-2xl border border-border-light shadow-sm">
                    {CHAINS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setChainFilter(c)}
                        className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all ${
                          chainFilter === c
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "text-secondary hover:bg-bg-secondary hover:text-text-primary"
                        }`}
                      >
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verified Toggle */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Quality Control</span>
                  <button
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`flex items-center gap-3 h-[52px] px-6 rounded-2xl border transition-all font-semibold ${
                      verifiedOnly 
                        ? "bg-primary/5 border-primary text-primary shadow-inner" 
                        : "bg-bg-primary border-border-light text-secondary hover:border-primary"
                    }`}
                  >
                    <VerifiedIcon size={20} className={verifiedOnly ? "text-primary" : "text-secondary"} />
                    <span>Verified Handles Only</span>
                    <div className={`w-10 h-6 rounded-full relative transition-all ${verifiedOnly ? "bg-primary" : "bg-border-light"}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${verifiedOnly ? "left-5" : "left-1"}`} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Mode Banner */}
        {isMock && (
          <div className="bg-primary/5 border-b border-primary/10">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
              <p className="text-sm font-medium text-primary">
                Demo Mode Active: Add your OpenSea API key to .env.local for live production data.
              </p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          {/* Error */}
          {error && (
            <div className="mb-12 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-600">
              <span className="text-2xl">⚠️</span>
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && items.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-[32px] border border-border-light bg-bg-secondary/50 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-border-light/50" />
                  <div className="p-8 space-y-4">
                    <div className="h-4 bg-border-light/50 rounded-full w-1/2" />
                    <div className="h-6 bg-border-light/50 rounded-full w-full" />
                    <div className="h-4 bg-border-light/50 rounded-full w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 rounded-full bg-bg-secondary flex items-center justify-center text-4xl mb-6">🔍</div>
              <h2 className="text-2xl font-bold mb-2">No Free Mints Found</h2>
              <p className="text-secondary max-w-md mx-auto mb-8">
                We couldn't find any free mints matching your current filters. Try adjusting your search or switching chains.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setChainFilter("all");
                  setVerifiedOnly(false);
                }}
                className="px-8 py-3 rounded-full border-2 border-border-light font-bold hover:bg-bg-secondary transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Result Grid */}
          {filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filtered.map((nft, i) => (
                <NFTCard key={nft.id} nft={nft} index={i} />
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border-light bg-bg-secondary/20 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-text-primary flex items-center justify-center">
                  <span className="text-white font-bold">F</span>
                </div>
                <p className="text-sm font-bold text-secondary uppercase tracking-widest">Free Mint Scanner v2.0</p>
              </div>
              <div className="flex gap-8 text-sm font-medium text-secondary">
                <p>Status: <span className="text-accent font-bold">Operational</span></p>
                <p>Source: <span className="text-text-primary font-bold">{source.toUpperCase()}</span></p>
                <p>Poll: <span className="text-text-primary font-bold">{POLL_INTERVAL / 1000}s</span></p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
