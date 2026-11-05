// Upload the Google Play store listing (texts + graphics) from store/ via the Play Developer API.
//   node tools/play-listing.mjs --dry      check texts and images, send nothing
//   PLAY_SA_JSON_B64=... node tools/play-listing.mjs
// PLAY_SA_JSON_B64 = base64 of the service-account JSON that has access to the app in Play Console.
// No npm dependencies: the OAuth token is signed with node:crypto.
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PKG = "be.leren.app";
const DRY = process.argv.includes("--dry");
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const UPLOAD = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PKG}`;

// Section heading language → Play language code.
const LANGS = { "uk-UA": "uk", "nl-NL": "nl-NL", "en-US": "en-US" };
const DEFAULT_LANG = "uk"; // store-listing.md: «Основна мова сторінки — українська»
const IMAGES = {
  icon: ["store/play-icon-512.png"],
  featureGraphic: ["store/feature-graphic-1024x500.png"],
  phoneScreenshots: [
    "store/play-screenshots/1-chat-1080x1920.png",
    "store/play-screenshots/2-ask-1080x1920.png",
    "store/play-screenshots/3-study-1080x1920.png",
    "store/play-screenshots/4-toets-1080x1920.png",
    "store/play-screenshots/5-games-1080x1920.png",
    "store/play-screenshots/6-dict-1080x1920.png",
  ],
};
const SIZES = { icon: [512, 512], featureGraphic: [1024, 500], phoneScreenshots: [1080, 1920] };

function parseListing() {
  const md = readFileSync(path.join(ROOT, "store/store-listing.md"), "utf8");
  const out = {};
  const sections = md.split(/^## /m).slice(1);
  for (const sec of sections) {
    const head = sec.split("\n", 1)[0];
    const tag = (head.match(/\(([a-z]{2}-[A-Z]{2})\)/) || [])[1];
    if (!tag || !LANGS[tag]) continue;
    const body = sec.slice(head.length).split(/^---\s*$/m)[0];
    // Blocks: **Label:**\n text…  (three per language, in order title / short / full)
    const parts = body.split(/^\*\*[^*\n]+:\*\*\s*$/m).slice(1).map(s => s.trim());
    if (parts.length !== 3) throw new Error(`${tag}: expected 3 fields, got ${parts.length}`);
    out[LANGS[tag]] = { title: parts[0], shortDescription: parts[1], fullDescription: parts[2] };
  }
  const contact = {
    contactEmail: (md.match(/Електронна пошта \| (\S+@\S+) \|/) || [])[1],
    contactWebsite: (md.match(/Вебсайт \| (https:\/\/\S+) \|/) || [])[1],
  };
  return { listings: out, contact };
}

function pngSize(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

function check({ listings, contact }) {
  const errs = [];
  const len = s => [...s].length;
  for (const [lang, l] of Object.entries(listings)) {
    const n = { title: len(l.title), short: len(l.shortDescription), full: len(l.fullDescription) };
    console.log(`${lang.padEnd(6)} title ${n.title}/30  short ${n.short}/80  full ${n.full}/4000`);
    if (n.title > 30) errs.push(`${lang}: title too long`);
    if (n.short > 80) errs.push(`${lang}: short description too long`);
    if (n.full > 4000) errs.push(`${lang}: full description too long`);
  }
  if (Object.keys(listings).length !== Object.keys(LANGS).length) errs.push("missing a language section");
  if (!contact.contactEmail || !contact.contactWebsite) errs.push("contact e-mail / website not found");
  console.log("contact", contact);
  for (const [type, files] of Object.entries(IMAGES)) {
    for (const f of files) {
      const [w, h] = pngSize(readFileSync(path.join(ROOT, f)));
      const ok = w === SIZES[type][0] && h === SIZES[type][1];
      console.log(`${type.padEnd(16)} ${f}  ${w}x${h}${ok ? "" : "  ✗"}`);
      if (!ok) errs.push(`${f}: expected ${SIZES[type].join("x")}`);
    }
  }
  if (errs.length) throw new Error(errs.join("\n"));
}

async function token() {
  const b64 = process.env.PLAY_SA_JSON_B64 || "";
  if (!b64) throw new Error("PLAY_SA_JSON_B64 is not set");
  const sa = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  const enc = o => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`token: ${r.status} ${j.error || ""} ${j.error_description || ""}`);
  console.log("signed in as", sa.client_email);
  return j.access_token;
}

async function main() {
  const data = parseListing();
  check(data);
  if (DRY) return console.log("dry run: nothing sent");

  const tok = await token();
  const call = async (method, url, body, type = "application/json") => {
    const r = await fetch(url, {
      method,
      headers: { authorization: `Bearer ${tok}`, ...(body ? { "content-type": type } : {}) },
      body: body == null ? undefined : type === "application/json" ? JSON.stringify(body) : body,
    });
    const text = await r.text();
    if (!r.ok) {
      const e = new Error(`${method} ${url.replace(/^.*applications\//, "")} → ${r.status} ${text.slice(0, 600)}`);
      e.status = r.status; e.text = text;
      throw e;
    }
    return text ? JSON.parse(text) : {};
  };

  const edit = await call("POST", `${API}/edits`, {});
  const E = `${API}/edits/${edit.id}`;
  const U = `${UPLOAD}/edits/${edit.id}`;
  console.log("edit", edit.id);
  try {
    const details = await call("GET", `${E}/details`);
    const before = await call("GET", `${E}/listings`);
    console.log("before: default", details.defaultLanguage, "· listings", (before.listings || []).map(l => l.language).join(", ") || "none");

    for (const [lang, l] of Object.entries(data.listings)) {
      await call("PUT", `${E}/listings/${lang}`, { language: lang, ...l });
      console.log("listing", lang, "✓");
    }
    await call("PUT", `${E}/details`, { ...details, ...data.contact, defaultLanguage: DEFAULT_LANG });
    console.log("details ✓ default", DEFAULT_LANG);

    for (const lang of Object.keys(data.listings)) {
      for (const [type, files] of Object.entries(IMAGES)) {
        await call("DELETE", `${E}/listings/${lang}/${type}`);
        for (const f of files) {
          await call("POST", `${U}/listings/${lang}/${type}?uploadType=media`, readFileSync(path.join(ROOT, f)), "image/png");
        }
        console.log("images", lang, type, files.length, "✓");
      }
    }

    try {
      await call("POST", `${E}:commit`);
    } catch (e) {
      // Apps with managed publishing / pending changes must be sent for review by hand in Play Console.
      if (!/changesNotSentForReview/.test(e.text || "")) throw e;
      await call("POST", `${E}:commit?changesNotSentForReview=true`);
      console.log("committed WITHOUT sending for review: open Play Console → Publishing overview → Send for review");
      return;
    }
    console.log("committed ✓");
  } catch (e) {
    await call("DELETE", E).catch(() => {});
    throw e;
  }
}

main().catch(e => { console.error("✗", e.message); process.exit(1); });
