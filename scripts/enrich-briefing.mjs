#!/usr/bin/env node
/**
 * enrich-briefing.mjs
 *
 * Reads content/briefing.md, finds every article link (→ [text](url)),
 * fetches the og:image from that page, and inserts a ![](imageUrl) line
 * into the briefing automatically.
 *
 * Run from the project root:
 *   node scripts/enrich-briefing.mjs
 *
 * Safe to re-run — skips items that already have an image line.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRIEFING_PATH = path.join(__dirname, "..", "content", "briefing.md");

// ── Fetch og:image from a URL ─────────────────────────────────────────────────

async function fetchOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();

    // og:image — try both property and name variants
    const patterns = [
      /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1] && m[1].startsWith("http")) {
        // Decode HTML entities that appear in attribute values
        return m[1]
          .trim()
          .replace(/&amp;/g, "&")
          .replace(/&#038;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ── Parse and enrich ──────────────────────────────────────────────────────────

async function enrichBriefing() {
  let md = fs.readFileSync(BRIEFING_PATH, "utf-8");

  // Split into lines so we can process in place
  const lines = md.split("\n");
  const result = [];
  let changed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect a → [text](url) line
    const linkMatch = line.match(/^→\s*\[([^\]]+)\]\(([^)]+)\)/);

    if (linkMatch) {
      const url = linkMatch[2].trim();

      // Look back to see if the preceding non-empty lines already have a ![](...)
      const preceding = result.slice(-6).join("\n");
      const alreadyHasImage = /!\[.*?\]\(.+?\)/.test(preceding);

      if (!alreadyHasImage) {
        // Look back further to find the tags line (backtick line after the **title**)
        // Find the index in result[] of the last backtick line
        let insertAfter = -1;
        for (let j = result.length - 1; j >= Math.max(0, result.length - 8); j--) {
          if (result[j].trim().startsWith("`")) {
            insertAfter = j;
            break;
          }
        }

        process.stdout.write(`Fetching og:image for ${url} … `);
        const imageUrl = await fetchOgImage(url);

        if (imageUrl) {
          console.log(`✓`);
          // Insert the image line right after the tags line
          if (insertAfter >= 0) {
            result.splice(insertAfter + 1, 0, `![](${imageUrl})`);
          } else {
            // Fallback: insert before the current line
            result.push(`![](${imageUrl})`);
          }
          changed++;
        } else {
          console.log(`✗ (no og:image found)`);
        }
      }
    }

    result.push(line);
  }

  if (changed === 0) {
    console.log("Nothing to update — all items already have images.");
    return;
  }

  fs.writeFileSync(BRIEFING_PATH, result.join("\n"), "utf-8");
  console.log(`\n✅ Updated ${changed} item(s) in ${BRIEFING_PATH}`);
}

enrichBriefing().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
