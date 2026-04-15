/**
 * /pages/api/free-mints.js
 *
 * Fetches recently minted NFTs from OpenSea v2 API and filters for free/zero-price items.
 * Falls back to mock data when no API key is configured (safe demo mode).
 *
 * Security measures:
 *  - Rate limiting per IP (in-memory, resets on cold start)
 *  - Only GET requests accepted
 *  - API key never exposed to client
 *  - Input sanitisation on query params
 *  - Strict response headers set in next.config.js
 */

// ─── Simple in-memory rate limiter ───────────────────────────────────────────
const rateLimitMap = new Map(); // ip → { count, resetAt }
const RATE_LIMIT = 30; // requests
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT) return true;

  record.count++;
  return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

/** Sanitise a string param – strip anything non-alphanumeric/dash/underscore */
function sanitiseParam(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 64) || fallback;
}

// ─── Mock data (used when OPENSEA_API_KEY is not set) ────────────────────────
function getMockData() {
  const now = new Date();
  const chains = ["ethereum", "base", "polygon"];
  const adjectives = [
    "Neon",
    "Void",
    "Pixel",
    "Acid",
    "Ghost",
    "Cyber",
    "Dark",
    "Glitch",
  ];
  const nouns = [
    "Apes",
    "Punks",
    "Frogs",
    "Bears",
    "Cats",
    "Wolves",
    "Drones",
    "Skulls",
  ];

  return Array.from({ length: 12 }, (_, i) => {
    const name = `${adjectives[i % adjectives.length]} ${nouns[i % nouns.length]}`;
    const tokenId = Math.floor(Math.random() * 9999) + 1;
      return {
      id: `mock-${i}-${Date.now()}`,
      name: `${name} #${tokenId}`,
      collection: name,
      collection_verified: i % 3 === 0, // Mock some verified collections
      image_url: `https://picsum.photos/seed/${name.replace(/ /g, "")}${i}/400/400`,
      permalink: "#",
      chain: chains[i % chains.length],
      price: 0,
      currency: "ETH",
      is_free: true,
      minted_at: new Date(now - i * 3 * 60000).toISOString(),
      token_id: String(tokenId),
      contract_address: "0x1234567890123456789012345678901234567890",
      creator_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      creator_name: i % 2 === 0 ? "Verified Creator" : null,
    };
  });
}

// ─── OpenSea fetcher ──────────────────────────────────────────────────────────
async function fetchFromOpenSea(limit) {
  const apiKey = process.env.OPENSEA_API_KEY;
  if (!apiKey || apiKey === "your_opensea_api_key_here") {
    return { data: getMockData(), source: "mock" };
  }

  // Fetch recently listed NFTs with price = 0 across all chains
  // OpenSea v2 listings endpoint – filter by price range 0–0
  const url = new URL("https://api.opensea.io/api/v2/listings/collection/all/best");
  url.searchParams.set("limit", String(Math.min(limit, 50)));
  url.searchParams.set("order_by", "created_date");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenSea ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const listings = json?.listings ?? [];

    // Map to our standard shape & filter free/zero-price items
    const items = listings
      .filter((l) => {
        const price = parseFloat(
          l?.price?.current?.value ?? l?.current_price ?? "1"
        );
        return price === 0;
      })
      .map((l) => ({
        id: l.order_hash ?? `os-${Math.random()}`,
        name: l.maker_asset_bundle?.assets?.[0]?.name ?? "Unnamed NFT",
        collection:
          l.maker_asset_bundle?.assets?.[0]?.collection?.name ?? "Unknown",
        image_url:
          l.maker_asset_bundle?.assets?.[0]?.image_url ??
          l.maker_asset_bundle?.assets?.[0]?.image_preview_url ??
          null,
        permalink:
          l.maker_asset_bundle?.assets?.[0]?.permalink ??
          "https://opensea.io",
        chain: l.protocol_data?.parameters?.consideration?.[0]?.token
          ? "ethereum"
          : "ethereum",
        price: 0,
        currency: "ETH",
        is_free: true,
        minted_at: l.listing_time
          ? new Date(l.listing_time * 1000).toISOString()
          : new Date().toISOString(),
        token_id:
          l.maker_asset_bundle?.assets?.[0]?.token_id ?? "?",
        contract_address: l.maker_asset_bundle?.assets?.[0]?.asset_contract?.address ?? null,
        creator_address: l.maker_asset_bundle?.assets?.[0]?.creator?.address ?? null,
        creator_name: l.maker_asset_bundle?.assets?.[0]?.creator?.user?.username ?? null,
        collection_verified: l.maker_asset_bundle?.assets?.[0]?.collection?.safelist_request_status === "verified",
      }));

    // If OpenSea returns nothing free, supplement with recently minted via events
    if (items.length === 0) {
      return await fetchRecentMintsOpenSea(apiKey, limit);
    }

    return { data: items, source: "opensea" };
  } catch (err) {
    clearTimeout(timeout);
    // Try secondary endpoint
    return await fetchRecentMintsOpenSea(apiKey, limit);
  }
}

/** Secondary: query transfer events (mints) and flag price=0 */
async function fetchRecentMintsOpenSea(apiKey, limit) {
  const url = new URL("https://api.opensea.io/api/v2/events/collection/all");
  url.searchParams.set("event_type", "transfer");
  url.searchParams.set("limit", String(Math.min(limit, 50)));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { accept: "application/json", "x-api-key": apiKey },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`OpenSea events ${res.status}`);

    const json = await res.json();
    const events = json?.asset_events ?? [];

    const items = events
      .filter((e) => e?.from_address === "0x0000000000000000000000000000000000000000")
      .map((e) => ({
        id: e.id ?? `ev-${Math.random()}`,
        name: e.nft?.name ?? `#${e.nft?.identifier ?? "?"}`,
        collection: e.nft?.collection ?? "Unknown Collection",
        image_url: e.nft?.image_url ?? null,
        permalink: e.nft?.opensea_url ?? "https://opensea.io",
        chain: e.chain ?? "ethereum",
        price: 0,
        currency: "ETH",
        is_free: true,
        minted_at: e.event_timestamp
          ? new Date(e.event_timestamp * 1000).toISOString()
          : new Date().toISOString(),
        token_id: e.nft?.identifier ?? "?",
        contract_address: e.nft?.contract ?? null,
        creator_address: e.to_address ?? null,
        creator_name: null, // OpenSea events usually don't have creator username directly
        collection_verified: false, // Default to false for events unless we fetch collection detail
      }));

    return { data: items.slice(0, limit), source: "opensea-events" };
  } catch {
    clearTimeout(timeout);
    return { data: getMockData(), source: "mock-fallback" };
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Method guard
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Rate limit
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res
      .status(429)
      .json({ error: "Too many requests. Please wait a moment." });
  }

  // Sanitise query params
  const rawLimit = parseInt(sanitiseParam(String(req.query.limit ?? "20"), "20"), 10);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 50);

  try {
    const { data, source } = await fetchFromOpenSea(limit);

    // Cache for 30s on CDN edge, no private cache
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json({ items: data, source, fetched_at: new Date().toISOString() });
  } catch (err) {
    console.error("[free-mints API error]", err?.message ?? err);
    return res.status(500).json({ error: "Failed to fetch NFT data." });
  }
}
