/**
 * components/NFTCard.js
 * Modern Apple-inspired NFT card component
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

export default function NFTCard({ nft, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(null);
  const chain = CHAIN_LABELS[nft.chain] ?? { label: nft.chain?.toUpperCase() ?? "?", color: "#6B6B85" };

  const delay = `${index * 30}ms`;

  const copyToClipboard = (e, text, label) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "N/A";

  return (
    <article
      className="nft-card rounded-2xl border border-border-light bg-secondary overflow-hidden group"
      style={{ animationDelay: delay, opacity: 0 }}
      onClick={() => nft.permalink && nft.permalink !== "#" && window.open(nft.permalink, "_blank", "noopener,noreferrer")}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && nft.permalink && nft.permalink !== "#" && window.open(nft.permalink, "_blank", "noopener,noreferrer")}
      aria-label={`View ${nft.name} on OpenSea`}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-secondary overflow-hidden">
        {!imgError && nft.image_url ? (
          <Image
            src={nft.image_url}
            alt={nft.name ?? "NFT"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <span className="text-4xl text-secondary">?</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

        {/* Free Mint Badge */}
        <div className="absolute top-3 left-3">
          <span className="badge inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/20 text-accent border border-accent/30 rounded-lg text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            FREE MINT
          </span>
        </div>

        {/* Chain Badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white backdrop-blur-md"
          style={{
            background: `${chain.color}dd`,
            border: `1px solid ${chain.color}99`,
          }}
        >
          {chain.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Collection */}
        <p className="text-xs text-secondary font-medium truncate">
          {nft.collection ?? "Unknown Collection"}
        </p>

        {/* Title */}
        <h3 className="text-sm font-semibold text-text-primary truncate leading-tight">
          {nft.name ?? "Unnamed NFT"}
        </h3>

        {/* Time */}
        <p className="text-xs text-secondary">
          {timeSince(nft.minted_at)}
        </p>

        {/* Divider */}
        <div className="h-px bg-border-light" />

        {/* Addresses Section */}
        <div className="space-y-2">
          {/* Contract Address */}
          <div
            className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer group/addr"
            onClick={(e) => copyToClipboard(e, nft.contract_address, "contract")}
          >
            <span className="text-xs text-secondary font-medium">Contract</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-text-primary group-hover/addr:text-primary transition-colors">
                {formatAddress(nft.contract_address)}
              </span>
              <CopyIcon />
            </div>
          </div>

          {/* Creator Address */}
          <div
            className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer group/addr"
            onClick={(e) => copyToClipboard(e, nft.creator_address, "creator")}
          >
            <span className="text-xs text-secondary font-medium">Creator</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-text-primary group-hover/addr:text-primary transition-colors">
                {formatAddress(nft.creator_address)}
              </span>
              <CopyIcon />
            </div>
          </div>

          {/* Copy feedback */}
          {copied && (
            <div className="text-xs text-accent font-medium text-center py-1 bg-accent/10 rounded-lg">
              ✓ Copied!
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
