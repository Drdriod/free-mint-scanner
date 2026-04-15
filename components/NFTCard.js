/**
 * components/NFTCard.js
 * Displays a single NFT item with its metadata.
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

export default function NFTCard({ nft, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const chain = CHAIN_LABELS[nft.chain] ?? { label: nft.chain?.toUpperCase() ?? "?", color: "#6B6B85" };

  const delay = `${index * 50}ms`;

  return (
    <article
      className="nft-card card-enter rounded-sm border border-border bg-panel overflow-hidden cursor-pointer group"
      style={{ animationDelay: delay, opacity: 0 }}
      onClick={() => nft.permalink && nft.permalink !== "#" && window.open(nft.permalink, "_blank", "noopener,noreferrer")}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && nft.permalink && nft.permalink !== "#" && window.open(nft.permalink, "_blank", "noopener,noreferrer")}
      aria-label={`View ${nft.name} on OpenSea`}
    >
      {/* Image */}
      <div className="relative w-full aspect-square bg-ink overflow-hidden">
        {!imgError && nft.image_url ? (
          <Image
            src={nft.image_url}
            alt={nft.name ?? "NFT"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-4xl text-muted select-none">?</span>
          </div>
        )}

        {/* Free badge */}
        <div className="absolute top-2 left-2">
          <span className="tag-free">FREE MINT</span>
        </div>

        {/* Chain badge */}
        <div
          className="absolute top-2 right-2 font-display text-[9px] px-1.5 py-0.5 rounded-sm"
          style={{
            background: `${chain.color}22`,
            border: `1px solid ${chain.color}55`,
            color: chain.color,
          }}
        >
          {chain.label}
        </div>
      </div>

      {/* Meta */}
      <div className="p-3 space-y-1.5">
        <p className="font-display text-xs text-dim truncate tracking-wide">
          {nft.collection ?? "Unknown Collection"}
        </p>
        <h3 className="font-body text-sm font-medium text-[#e8e8f0] truncate leading-tight">
          {nft.name ?? "Unnamed NFT"}
        </h3>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-xs font-bold text-acid">
              FREE
            </span>
          </div>
          <span className="font-display text-[10px] text-dim">
            {timeSince(nft.minted_at)}
          </span>
        </div>
      </div>

      {/* Hover underline */}
      <div className="h-px w-0 bg-acid transition-all duration-300 group-hover:w-full" />
    </article>
  );
}
