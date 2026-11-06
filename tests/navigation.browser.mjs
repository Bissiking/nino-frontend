// Actual Next UI with intercepted API fixtures. Never connects to a real backend.
// Usage: PUPPETEER_MODULE=/path/to/puppeteer-core.js CHROME_PATH=/path/to/chrome npm run test:navigation
import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve, join } from "node:path";

if (!process.env.PUPPETEER_MODULE || !process.env.CHROME_PATH) throw new Error("Set PUPPETEER_MODULE and CHROME_PATH to the installed browser tooling.");
const { default: puppeteer } = await import(pathToFileURL(resolve(process.env.PUPPETEER_MODULE)));
const base = process.env.NINO_TEST_URL ?? "http://localhost:3100";
const output = resolve(process.env.NINO_TEST_OUTPUT ?? "../nino-backend/docs/evidence/navigation");
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const page = await browser.newPage();
const errors = [];
const checks = [];
const captures = [];
let admin = true;
let accountMode = "ready";
let notificationMode = "ready";
let homeMode = "ready";
let reads = 0;
let unread = true;
const requests = [];
const videoFixture = await readFile(new URL("./fixtures/navigation.webm", import.meta.url));
const report = { scope: "Chrome headless, actual frontend, intercepted API fixtures only; no live backend/SSO/device", checks, captures, errors };
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (/same key|Hydration failed|hydrated but/.test(message.text())) errors.push(message.text()); });
const profile = { id: "fixture-profile", name: "Camille · test local", avatar: null, maturity_level: "teen", language: "fr" };
const media = { id: "fixture-video", kind: "movie", title: "Programme de démonstration", synopsis: "Contenu simulé pour la recette des menus.", description: "", category: null, tags: [], year: 2026, duration_seconds: 120, genres: [], poster_url: null, backdrop_url: null, rating: null, is_available: true, is_adult: false, content_flags: [], no_spoil: false, intro_start_seconds: 0, intro_end_seconds: 0, progress_percent: 0, visibility: "public", publish_at: null, source_kind: "file", source_filename: null, file_size_bytes: null, encoding_status: null, hls_status: null, liked: false, favorited: false, like_count: 0 };
await page.evaluateOnNewDocument(() => {
  localStorage.setItem("nino.access", "fixture-no-real-access");
  localStorage.setItem("nino.profile", "fixture-profile");
});
await page.setRequestInterception(true);
page.on("request", async (request) => {
  const url = new URL(request.url());
  if (url.pathname === "/fixture.webm") return request.respond({ status: 200, contentType: "video/webm", body: videoFixture });
  if (!url.pathname.startsWith("/api/v1/")) {
    if (url.origin === new URL(base).origin || ["data:", "blob:"].includes(url.protocol)) return request.continue();
    return request.abort();
  }
  requests.push(`${request.method()} ${url.pathname}`);
  const headers = { "access-control-allow-origin": new URL(base).origin, "access-control-allow-credentials": "true", "access-control-allow-headers": "content-type,authorization", "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS", "content-type": "application/json" };
  if (request.method() === "OPTIONS") return request.respond({ status: 204, headers });
  let data = null;
  let status = 200;
  const path = url.pathname;
  if (path === "/api/v1/me") {
    if (accountMode === "network") return request.abort("failed");
    if (accountMode === "forbidden") status = 403;
    else data = { id: "fixture-user", email: null, display_name: "Compte de démonstration", is_admin: admin };
  } else if (path === "/api/v1/profiles") data = accountMode === "empty" ? [] : [profile];
  else if (path === "/api/v1/home") {
    if (homeMode === "network") return request.abort("failed");
    data = { hero: null, rails: [] };
  } else if (path === "/api/v1/admin/stats") data = { users: 1, libraries: 0, media: 1, transcode_jobs: 0, scan_jobs: 0 };
  else if (path === "/api/v1/admin/media" || path === "/api/v1/media") data = [media];
  else if (path === "/api/v1/admin/media/publish-sweep") data = { published: 0 };
  else if (path === "/api/v1/notifications") {
    if (notificationMode === "network") return request.abort("failed");
    if (notificationMode === "forbidden") status = 403;
    else data = notificationMode === "empty" ? [] : [{ id: "fixture-notification", title: "Publication de démonstration", message: "Aucune publication réelle n’a eu lieu.", level: "info", is_read: !unread, created_at: "2026-11-06T08:00:00Z" }];
  } else if (path.endsWith("/read") || path.endsWith("/read-all")) { reads++; unread = false; data = { updated: 1, is_read: true }; }
  else if (path === "/api/v1/media/fixture-video") data = media;
  else if ((path.includes("stream-decision") || path === "/api/v1/stream/fixture-video/decision")) data = { media_id: media.id, mode: "direct", url: "/fixture.webm", mime_type: "video/webm", expires_in: 300, reason: "fixture" };
  else if (path.includes("/interactions")) data = { liked: false, favorited: false, like_count: 0 };
  else if (path.includes("/comments")) data = { comments: [], total: 0 };
  else if (path.includes("/progress")) data = { saved: true };
  else { status = 503; }
  const body = status === 200 ? { success: true, data, meta: { page: 1, page_size: 24, total: Array.isArray(data) ? data.length : 0 } } : { success: false, error: { code: status === 403 ? "ACCESS_DENIED" : "UNAVAILABLE", message: status === 403 ? "Accès refusé." : "Indisponible dans cette fixture.", details: {} } };
  return request.respond({ status, headers, body: JSON.stringify(body) });
});
const wait = (selector) => page.waitForSelector(selector, { visible: true, timeout: 20000 });
const click = async (selector) => { await wait(selector); await page.click(selector); };
const text = () => page.evaluate(() => document.body.innerText);
async function goto(path) { await page.goto(`${base}${path}`, { waitUntil: "networkidle0" }); }
async function capture(name) { await page.screenshot({ path: join(output, `${name}.png`), fullPage: true }); captures.push(`${name}.png`); }
async function noOverflow() { assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "horizontal page overflow"); }
async function focusIn(selector) { assert(await page.evaluate((s) => !!document.activeElement?.closest(s), selector), `focus outside ${selector}`); }
async function closeDialog() { await page.keyboard.press("Escape"); await page.waitForFunction(() => !document.querySelector("dialog[open]")); }
try {
  await page.setViewport({ width: 1440, height: 1000 });
  await goto("/");
  await click('.desktopNav button[aria-label="Explorer"]');
  await focusIn('[role="menu"]');
  await page.keyboard.press("End");
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "Séries");
  await page.keyboard.press("Home");
  await page.keyboard.press("s");
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "Séries");
  await capture("viewer-explorer-1440");
  await page.keyboard.press("Escape");
  await focusIn('.desktopNav button[aria-label="Explorer"]');
  checks.push("Explorer: opening focus, Home/End, typeahead, Escape restores trigger");

  for (const width of [375, 430, 768, 1440, 1920]) {
    await page.setViewport({ width, height: 1000 });
    await noOverflow();
    await click('[aria-label="Ouvrir le menu profil"]');
    await wait("dialog[open]");
    assert.equal(await page.$$eval('dialog[open] nav a', (items) => items.length), 5);
    for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); await focusIn("dialog[open]"); }
    await capture(`account-${width}`);
    await closeDialog();
    await focusIn('[aria-label="Ouvrir le menu profil"]');
    if (width <= 760) {
      await click('.bottomNav button[aria-label="Explorer"]');
      const bounds = await page.$eval('[role="menu"]', (el) => { const r = el.getBoundingClientRect(); return { x: r.x, right: r.right, top: r.top, bottom: r.bottom }; });
      assert(bounds.x >= 0 && bounds.right <= width && bounds.top >= 0 && bounds.bottom <= 1000);
      await capture(`viewer-explorer-${width}`);
      await page.keyboard.press("Escape");
    }
  }
  checks.push("Viewer/account: five viewport widths, five destinations, no overflow, trapped Tab and focus restoration");

  await page.setViewport({ width: 1440, height: 1000 });
  await goto("/studio/overview");
  await click('[aria-label="Créer un contenu"]');
  assert.equal(await page.$$eval('[role="menu"] [role="menuitem"]', (items) => items.length), 3);
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowDown");
  assert((await page.evaluate(() => document.activeElement.textContent)).includes("Nouvelle vidéo"));
  await capture("studio-create-1440");
  await page.keyboard.press("Escape");
  await click('[aria-label="Créer un contenu"]');
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.search === "?kind=short");
  await page.waitForFunction(() => document.body.innerText.includes("Upload Flashy"));
  await capture("flashy-editor-1440");
  checks.push("Studio create: three working destinations, arrow wrap, Nouveau Flashy opens short editor");

  await goto("/studio/overview");
  await click('[aria-label="Rechercher dans Nino Studio"]');
  await page.type("#studio-command-query", "programme");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.pathname === "/studio/videos" && location.search === "?q=programme");
  await page.waitForFunction(() => document.querySelector('.studioControlSearch input')?.value === "programme");
  await page.keyboard.down("Control"); await page.keyboard.press("k"); await page.keyboard.up("Control");
  await wait("dialog[open] #studio-command-query");
  await capture("studio-search-1440");
  await closeDialog();
  checks.push("Studio search: submit persists q and seeds actual library filter; Ctrl+K opens shared dialog");

  for (const width of [375, 430, 768, 1440, 1920]) {
    await page.setViewport({ width, height: 1000 });
    await noOverflow();
    await capture(`studio-${width}`);
    if (width <= 768) {
      await click('[aria-label="Ouvrir la navigation"]');
      await wait("dialog[open]");
      assert.equal(await page.$$eval('dialog[open] nav a', (items) => items.length), 8);
      for (let i = 0; i < 14; i++) { await page.keyboard.press("Tab"); await focusIn("dialog[open]"); }
      await capture(`studio-drawer-${width}`);
      await closeDialog();
      await focusIn('[aria-label="Ouvrir la navigation"]');
    }
    await click('button[aria-label^="Notifications"]');
    await wait("dialog[open]");
    assert((await text()).includes("Publication de démonstration"));
    await capture(`notifications-${width}`);
    await closeDialog();
  }
  checks.push("Studio: five widths; mobile/tablet drawer contains all eight destinations, traps Tab and restores focus; notification sheet reflows");

  await click('button[aria-label^="Notifications"]');
  await click(".studioMarkAllRead");
  await page.waitForFunction(() => document.querySelector('.ninoNotificationSummary')?.textContent === "Vous êtes à jour");
  assert.equal(reads, 1);
  await closeDialog();
  for (const mode of ["empty", "network", "forbidden"]) {
    notificationMode = mode;
    await page.reload({ waitUntil: "networkidle0" });
    await click('button[aria-label^="Notifications"]');
    await wait("dialog[open]");
    if (mode === "empty") assert((await text()).includes("Aucune notification"));
    else {
      await wait('.ninoNotificationsSheet [role="alert"]');
      notificationMode = "ready";
      await click('.ninoNotificationsSheet .studioNotificationState button');
      await page.waitForFunction(() => document.querySelector('.ninoNotificationsSheet li'));
    }
    await closeDialog();
  }
  checks.push("Notifications: mark-all persists via API fixture; empty, offline, 403 and successful retry");

  admin = false;
  await goto("/");
  await click('[aria-label="Ouvrir le menu profil"]');
  assert.equal(await page.$$('dialog[open] a[href="/studio/overview"]').then((items) => items.length), 0);
  await closeDialog();
  await goto("/studio/overview");
  assert.equal(await page.$$('[aria-label="Créer un contenu"]').then((items) => items.length), 0);
  assert((await text()).includes("Accès administrateur requis"));
  checks.push("Viewer role: no Studio account link or create commands; existing denied access preserved");

  for (const mode of ["network", "forbidden", "empty"]) {
    accountMode = mode;
    await goto("/");
    await click('[aria-label="Ouvrir le menu profil"]');
    if (mode !== "empty") {
      await wait('.ninoMenuError');
      accountMode = "ready";
      await click('.ninoMenuError button');
      await page.waitForFunction(() => !document.querySelector('.ninoMenuError'));
    }
    assert.equal(await page.$$eval('dialog[open] nav a', (items) => items.length), 5);
    await closeDialog();
  }
  homeMode = "network";
  await goto("/");
  await click('[aria-label="Ouvrir le menu profil"]');
  await wait("dialog[open]");
  await closeDialog();
  checks.push("Account: offline/403 with retry and no profiles preserve navigation; menu remains available during catalog failure");
  homeMode = "ready";

  await page.setViewport({ width: 1920, height: 1080 });
  await goto("/");
  await click('[aria-label="Ouvrir le menu profil"]');
  for (let i = 0; i < 100; i++) {
    await page.keyboard.press(["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"][i % 4]);
    await focusIn("dialog[open]");
  }
  await page.evaluate(() => document.querySelector('dialog[open]').dispatchEvent(new KeyboardEvent('keydown', { key: 'BrowserBack', bubbles: true })));
  await page.waitForFunction(() => !document.querySelector("dialog[open]"));
  checks.push("TV simulation: 100 directional keys remain in account scope; BrowserBack closes dialog");

  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await click('[aria-label="Ouvrir le menu profil"]');
  assert.equal(await page.$eval('dialog[open]', (el) => getComputedStyle(el).animationName), "none");
  await closeDialog();
  checks.push("Reduced motion: shared account surface has no entrance animation");

  await page.setViewport({ width: 1440, height: 1000 });
  await goto("/watch/fixture-video");
  await click('[aria-label="Réglages de lecture"]');
  await focusIn('[role="menu"]');
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  assert.equal(await page.$eval('video', (el) => el.playbackRate), 2);
  await click('[aria-label="Réglages de lecture"]');
  assert.equal(await page.$eval('[role="menuitemradio"][aria-checked="true"]', (el) => el.textContent.trim()), "2×");
  await capture("player-settings-1440");
  await page.keyboard.press("Escape");
  await focusIn('[aria-label="Réglages de lecture"]');
  checks.push("Player settings: merged menu changes actual video playbackRate, selected radio state and restored focus");

  await goto("/dev/ui");
  await click('[aria-label="Actions de démonstration"]');
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "Prévisualiser");
  await page.keyboard.press("Escape");
  await click('[aria-label="Actions de démonstration"]');
  await page.mouse.click(12, 12);
  assert.equal(await page.$$('[role="menu"]').then((items) => items.length), 0);
  checks.push("Universal Menu: disabled item skipped; outside pointer closes menu");
  assert.deepEqual(errors, []);
  report.result = "passed";
} catch (error) {
  report.result = "failed";
  report.failure = error.stack;
  await capture("failure").catch(() => {});
  process.exitCode = 1;
} finally {
  report.apiRequests = requests.length;
  await writeFile(join(output, "results.json"), JSON.stringify(report, null, 2) + "\n");
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}
