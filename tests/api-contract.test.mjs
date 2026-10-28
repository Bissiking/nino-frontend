import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { beforeEach } from "node:test";
import ts from "typescript";

// Execute the actual client and session modules; no test-only copy of request logic.
const compile = async (name) => ts.transpileModule(await readFile(new URL(name, import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const moduleUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const session = moduleUrl(await compile("../lib/session.ts"));
const clientCode = (await compile("../lib/api.ts")).replace('"./session"', JSON.stringify(session));
const { api, NinoApiError } = await import(moduleUrl(clientCode));
const requests = [];
const storage = new Map();
let payload;
let status;

beforeEach(() => {
  storage.clear();
  storage.set("nino.access", "test-access");
  storage.set("nino.profile", "profil +18 & famille");
  globalThis.window = {
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
    location: { pathname: "/", replace: () => assert.fail("Unexpected redirect") }
  };
  requests.length = 0;
  payload = { success: true, data: [], meta: { page: 2, page_size: 10, total: 31 } };
  status = 200;
  globalThis.fetch = async (url, init) => {
    requests.push({ url: new URL(url), init });
    return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
  };
});

test("profile context reaches every public media read", async () => {
  await api.home();
  await api.media("short");
  await api.mediaDetail("media");
  await api.seriesDetail("media");
  await api.mediaThumbnail("media");
  await api.search("bonjour & salut");
  await api.streamDecision("media");
  await api.mediaInteractions("media");
  await api.comments("media");
  for (const { url, init } of requests) {
    assert.equal(url.searchParams.get("profile_id"), "profil +18 & famille", url.pathname);
    assert.equal(init.headers.Authorization, "Bearer test-access");
  }
  assert.equal(requests[5].url.searchParams.get("q"), "bonjour & salut");
});

test("profile switch is used on the next request and explicit selection wins", async () => {
  storage.set("nino.profile", "teen");
  await api.streamDecision("media");
  await api.search("query", "adult");
  storage.delete("nino.profile");
  await api.comments("media");
  assert.equal(requests[0].url.searchParams.get("profile_id"), "teen");
  assert.equal(requests[1].url.searchParams.get("profile_id"), "adult");
  assert.equal(requests[2].url.searchParams.has("profile_id"), false);
});

test("pagination metadata is retained without changing the existing list method", async () => {
  payload.data = [{ id: "media" }];
  assert.deepEqual(await api.mediaPage("short", "teen", 10, 2), { data: payload.data, meta: payload.meta });
  assert.equal(requests[0].url.searchParams.get("page"), "2");
  assert.equal(requests[0].url.searchParams.get("page_size"), "10");
  assert.deepEqual(await api.media(), payload.data);
});

test("invalid page metadata and denied profiles surface as explicit errors", async () => {
  payload.meta = {};
  await assert.rejects(api.mediaPage(), (error) => error instanceof NinoApiError && error.code === "INVALID_SERVER_RESPONSE");
  status = 404;
  payload = { success: false, error: { code: "PROFILE_NOT_FOUND", message: "Profil introuvable.", details: {} } };
  await assert.rejects(api.search("query"), (error) => error.status === 404 && error.code === "PROFILE_NOT_FOUND");
  assert.equal(requests.length, 2); // No retry with a less restrictive profile.
});
