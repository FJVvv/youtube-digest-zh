const test = require("node:test");
const assert = require("node:assert/strict");

const settings = require("../settings.js");

test("DeepSeek defaults stay the default configuration", () => {
  const normalized = settings.normalize({});

  assert.equal(normalized.provider, "deepseek");
  assert.equal(normalized.aiBaseUrl, "https://api.deepseek.com");
  assert.equal(normalized.aiModel, "deepseek-v4-flash");
  assert.equal(normalized.transcriptSource, "auto");
  assert.equal(normalized.aiApiKey, "");
  assert.equal(normalized.supadataApiKey, "");
  assert.equal(
    settings.chatCompletionsUrl(),
    "https://api.deepseek.com/chat/completions",
  );
});

test("custom AI endpoint, model, and transcript source are preserved", () => {
  const normalized = settings.normalize({
    provider: "unexpected",
    aiApiKey: "  example-key  ",
    aiBaseUrl: "https://api.example.com/v1/",
    aiModel: "  ds1017  ",
    supadataApiKey: "  example-supadata  ",
    transcriptSource: "supadata",
  });

  assert.equal(normalized.provider, "deepseek");
  assert.equal(normalized.aiBaseUrl, "https://api.example.com/v1");
  assert.equal(normalized.aiModel, "ds1017");
  assert.equal(normalized.aiApiKey, "example-key");
  assert.equal(normalized.supadataApiKey, "example-supadata");
  assert.equal(normalized.transcriptSource, "supadata");
  assert.equal(
    settings.chatCompletionsUrl(normalized.aiBaseUrl),
    "https://api.example.com/v1/chat/completions",
  );
  assert.equal(
    settings.chatCompletionsUrl("https://gateway.example.com"),
    "https://gateway.example.com/chat/completions",
  );
});

test("invalid AI settings fall back to safe defaults", () => {
  const normalized = settings.normalize({
    aiBaseUrl: "ftp://not-http.example.com",
    aiModel: "   ",
    transcriptSource: "unknown-source",
  });

  assert.equal(normalized.aiBaseUrl, settings.DEFAULTS.aiBaseUrl);
  assert.equal(normalized.aiModel, settings.DEFAULTS.aiModel);
  assert.equal(normalized.transcriptSource, "auto");

  const longModel = settings.normalize({ aiModel: "m".repeat(121) });
  assert.equal(longModel.aiModel, settings.DEFAULTS.aiModel);
  const maxModel = settings.normalize({ aiModel: "m".repeat(120) });
  assert.equal(maxModel.aiModel, "m".repeat(120));
});

test("official DeepSeek endpoint detection is exact", () => {
  assert.equal(settings.isOfficialDeepSeekBase("https://api.deepseek.com"), true);
  assert.equal(
    settings.isOfficialDeepSeekBase("  https://api.deepseek.com/  "),
    true,
  );
  assert.equal(
    settings.isOfficialDeepSeekBase("https://api.deepseek.com/v1"),
    true,
  );
  assert.equal(
    settings.isOfficialDeepSeekBase("https://api.example.com"),
    false,
  );
});

test("legacy custom migration clears only the AI key and is idempotent", () => {
  const legacy = {
    provider: "custom",
    aiApiKey: "custom-secret",
    aiBaseUrl: "https://api.example.com/v1",
    aiModel: "example-model",
    supadataApiKey: " supadata-secret ",
  };
  const first = settings.migrateLegacyCustom(legacy);

  assert.equal(first.migrated, true);
  assert.equal(first.settings.provider, "deepseek");
  assert.equal(first.settings.aiBaseUrl, settings.DEFAULTS.aiBaseUrl);
  assert.equal(first.settings.aiModel, settings.DEFAULTS.aiModel);
  assert.equal(first.settings.aiApiKey, "");
  assert.equal(first.settings.supadataApiKey, "supadata-secret");

  const second = settings.migrateLegacyCustom(first.settings);
  assert.equal(second.migrated, false);
  assert.deepEqual(second.settings, first.settings);

  const configuredDeepSeek = settings.normalize({
    ...first.settings,
    aiApiKey: "new-deepseek-key",
  });
  assert.equal(configuredDeepSeek.aiApiKey, "new-deepseek-key");
});

test("Supadata receives a canonical YouTube URL", () => {
  assert.equal(
    settings.canonicalYouTubeUrl("ydTeb_I0b94"),
    "https://www.youtube.com/watch?v=ydTeb_I0b94",
  );
  assert.throws(
    () => settings.canonicalYouTubeUrl('"><script>'),
    /Invalid YouTube video ID/,
  );
});
