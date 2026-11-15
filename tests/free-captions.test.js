const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const captionModule = require("../caption-capture.js");

test("timedtext URLs are normalized to json3 and keep pot", () => {
  const normalized = captionModule.normalizeTimedtextUrlForVideo(
    "https://www.youtube.com/api/timedtext?v=abc&lang=en&fmt=srv3&pot=XYZ&signature=sig",
  );
  const url = new URL(normalized);
  assert.equal(url.searchParams.get("fmt"), "json3");
  assert.equal(url.searchParams.get("pot"), "XYZ");
  assert.equal(url.searchParams.get("signature"), "sig");
  assert.equal(url.searchParams.get("lang"), "en");

  for (const invalid of ["", "not a url", "ftp://example.com/timedtext", null, 42]) {
    assert.equal(captionModule.normalizeTimedtextUrlForVideo(invalid), null);
  }
});

test("json3 events become deduplicated transcript cues", () => {
  const cues = captionModule.parseJson3Cues(
    {
      events: [
        {
          tStartMs: 1500,
          dDurationMs: 2400,
          segs: [{ utf8: "Hello " }, { utf8: "world" }],
        },
        { tStartMs: 2000, dDurationMs: 1000, segs: [{ utf8: "   " }] },
        {
          tStartMs: 4000,
          dDurationMs: 1500,
          segs: [{ utf8: "Hello world" }],
        },
        {
          tStartMs: 5100,
          dDurationMs: 999,
          segs: [{ utf8: " Again " }],
        },
      ],
    },
    "en",
  );

  assert.deepEqual(JSON.parse(JSON.stringify(cues)), [
    { text: "Hello world", start: 1, duration: 2, language: "en" },
    { text: "Again", start: 5, duration: 1, language: "en" },
  ]);

  assert.deepEqual(
    JSON.parse(JSON.stringify(captionModule.parseJson3Cues(null, "en"))),
    [],
  );
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(captionModule.parseJson3Cues({ events: "invalid" }, "en")),
    ),
    [],
  );
});

test("manifest and content script wire the free caption path", () => {
  const manifest = JSON.parse(read("manifest.json"));
  const captureScript = manifest.content_scripts.find((entry) =>
    entry.js.includes("caption-capture.js"),
  );
  assert.ok(captureScript);
  assert.equal(captureScript.run_at, "document_start");
  assert.equal(captureScript.world, "MAIN");

  const content = read("content.js");
  assert.match(content, /message\.action === "extractFreeCaptions"/);
  assert.match(content, /source: "ytd-caption-content"/);
  assert.match(content, /ytd-caption-main/);

  const background = read("background.js");
  assert.match(background, /action: "extractFreeCaptions"/);
  assert.match(background, /transcriptSource: "youtube"/);
});

test("free caption module keeps upstream MIT attribution", () => {
  const source = read("caption-capture.js");
  assert.match(source, /MIT License/);
  assert.match(source, /Gythiro/);
});

test("the transcript panel reports whether YouTube or Supadata was used", () => {
  const page = read("sidepanel.html");
  assert.match(page, /id="transcriptSourceNote"/);

  const script = read("sidepanel.js");
  assert.match(script, /function updateTranscriptSourceNote\(\)/);
  assert.match(script, /字幕来源：YouTube 自带/);
  assert.match(script, /字幕来源：Supadata/);
  assert.match(script, /transcriptSource: currentTranscriptSource/);
});
