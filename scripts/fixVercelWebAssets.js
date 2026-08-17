#!/usr/bin/env node
/**
 * Post-processes `npx expo export --platform web`'s output (dist/) before
 * deploying to Vercel.
 *
 * Metro's web export nests some vendor assets (icon fonts from
 * @expo/vector-icons, a couple of expo-router/react-navigation images)
 * under dist/assets/node_modules/... — mirroring their real path inside
 * node_modules. Vercel's CLI silently refuses to upload/serve ANY path
 * containing a literal "node_modules" segment (a hardcoded default,
 * unrelated to .gitignore/.vercelignore), so those files 404 once
 * deployed even though they're present locally and the export "succeeds"
 * — which is exactly why every icon on the deployed site rendered as an
 * empty box instead of a glyph.
 *
 * Fix: rename dist/assets/node_modules -> dist/assets/vendor, then rewrite
 * every text/script/style file in dist that references the old path.
 * Run this after every `expo export --platform web`, before deploying —
 * see the "web:export" npm script.
 */
const fs = require("fs");
const path = require("path");

const DIST_DIR = path.join(__dirname, "..", "dist");
const OLD_SEGMENT = "assets/node_modules";
const NEW_SEGMENT = "assets/vendor";
const OLD_DIR = path.join(DIST_DIR, "assets", "node_modules");
const NEW_DIR = path.join(DIST_DIR, "assets", "vendor");
// Only these are ever text — everything else in dist/assets is a binary font/image, never rewritten in place.
const TEXT_EXTENSIONS = new Set([".js", ".css", ".html", ".json", ".txt", ".map"]);

function walk(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`No dist/ found at ${DIST_DIR} — run "expo export --platform web" first.`);
    process.exit(1);
  }

  if (!fs.existsSync(OLD_DIR)) {
    console.log(`No ${OLD_SEGMENT} directory in this export — nothing to fix.`);
    return;
  }

  // Copy + remove rather than fs.renameSync: Windows can reject a same-volume
  // directory rename here with EPERM (antivirus/indexer holding a handle
  // right after export writes the files), while copy+delete is reliable
  // cross-platform.
  fs.cpSync(OLD_DIR, NEW_DIR, { recursive: true });
  fs.rmSync(OLD_DIR, { recursive: true, force: true });
  console.log(`Renamed dist/${OLD_SEGMENT} -> dist/${NEW_SEGMENT}`);

  let filesRewritten = 0;
  let occurrencesReplaced = 0;
  walk(DIST_DIR, (file) => {
    if (!TEXT_EXTENSIONS.has(path.extname(file))) return;
    const original = fs.readFileSync(file, "utf8");
    if (!original.includes(OLD_SEGMENT)) return;
    const matches = original.split(OLD_SEGMENT).length - 1;
    fs.writeFileSync(file, original.split(OLD_SEGMENT).join(NEW_SEGMENT));
    filesRewritten += 1;
    occurrencesReplaced += matches;
  });

  console.log(`Rewrote ${occurrencesReplaced} reference(s) across ${filesRewritten} file(s).`);
  console.log("dist/ is now safe to deploy to Vercel.");
}

main();
