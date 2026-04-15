/**
 * components/NFTCard.js
 * Premium Apple-inspired NFT card component
 */
import Image from "next/image";
import { useState } from "react";

const CHAIN_LABELS = {
  ethereum: { label: "ETH", color: "#627EEA" },
  base: { label: "BASE", color: "#0052FF" },
  polygon: { label: "MATIC", color: "#8247E5" },
  solana: { label: "SOL", color: "#9945FF" },
  arbitrum: { label: "ARB", color: "#28A0F0" },
};

function timeSince(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const VerifiedIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={`text-primary ${className}`}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

export default function NFTCard({ nft, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(null);
  const chain = CHAIN_LABELS[nft.chain] ?? { label: nft.chain?.toUpperCase() ?? "?", color: "#6B6B85" };

  const delay = `${index * 50}ms`;

  const copyToClipboard = (e, text, label) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "N/A";

  return (
    <article
      className="group relative bg-bg-primary rounded-[32px] border border-border-light overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 animate-slide-up"
      style={{ animationDelay: delay }}
      onClick={() => nft.permalink && nft.permalink !== "#" && window.open(nft.permalink, "_blank", "noopener,noreferrer")}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && nft.permalink && nft.permalink !== "#" && window.open(nft.permalink, "_blank", "noopener,noreferrer")}
      aria-label={`View ${nft.name} on OpenSea`}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-bg-secondary overflow-hidden">
        {!imgError && nft.image_url ? (
          <Image
            src={nft.image_url}
            alt={nft.name ?? "NFT"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-bg-secondary text-secondary">
            <span className="text-6xl font-bold opacity-10">?</span>
          </div>
        )}

        {/* Status Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Floating Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[11px] font-bold text-accent shadow-lg border border-accent/10">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            FREE MINT
          </span>
          {nft.collection_verified && (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/90 backdrop-blur-md rounded-2xl text-[11px] font-bold text-white shadow-lg">
              <VerifiedIcon size={14} className="text-white" />
              VERIFIED
            </span>
          )}
        </div>

        {/* Chain Badge */}
        <div
          className="absolute top-4 right-4 px-4 py-2 rounded-2xl text-[11px] font-bold text-white backdrop-blur-md shadow-lg"
          style={{
            background: `${chain.color}cc`,
            border: `1px solid ${chain.color}55`,
          }}
        >
          {chain.label}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8 space-y-4">
        {/* Meta Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-xs font-bold text-secondary uppercase tracking-widest truncate">
              {nft.collection ?? "Unknown Collection"}
            </p>
            {nft.collection_verified && <VerifiedIcon size={14} />}
          </div>
          <span className="text-[10px] font-bold text-secondary whitespace-nowrap bg-bg-secondary px-2 py-1 rounded-lg">
            {timeSince(nft.minted_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-text-primary leading-tight group-hover:text-primary transition-colors">
          {nft.name ?? "Unnamed NFT"}
        </h3>

        {/* Address Grid */}
        <div className="pt-4 space-y-3 border-t border-border-light">
          {/* Contract */}
          <div
            className="group/addr flex items-center justify-between p-3 rounded-2xl bg-bg-secondary/50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
            onClick={(e) => copyToClipboard(e, nft.contract_address, "contract")}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Contract</span>
              <span className="text-sm font-mono font-semibold text-text-primary group-hover/addr:text-primary transition-colors">
                {formatAddress(nft.contract_address)}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-secondary group-hover/addr:text-primary shadow-sm">
              <CopyIcon />
            </div>
          </div>

          {/* Creator */}
          <div
            className="group/addr flex items-center justify-between p-3 rounded-2xl bg-bg-secondary/50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
            onClick={(e) => copyToClipboard(e, nft.creator_address, "creator")}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                {nft.creator_name ? "Verified Creator" : "Creator Wallet"}
              </span>
              <span className="text-sm font-mono font-semibold text-text-primary group-hover/addr:text-primary transition-colors">
                {nft.creator_name ? nft.creator_name : formatAddress(nft.creator_address)}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-secondary group-hover/addr:text-primary shadow-sm">
              <CopyIcon />
            </div>
          </div>
        </div>

        {/* Copy Success Feedback */}
        {copied && (
          <div className="absolute inset-x-8 bottom-8 py-3 bg-primary text-white text-xs font-bold text-center rounded-2xl animate-fade-in shadow-xl">
            ✓ Address Copied to Clipboard
          </div>
        )}
      </div>
    </article>
  );
}
