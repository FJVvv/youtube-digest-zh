const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

/**
 * Loads sidepanel.js in a VM sandbox with the same sparse DOM stubs as the
 * other panel tests. The Markdown helpers are pure functions, so no real DOM
 * is needed to exercise them.
 */
function loadPanel() {
  const listeners = { addListener() {} };
  const sandbox = {
    console,
    URL,
    TextDecoder,
    TextEncoder,
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval() {},
    clearInterval() {},
    IntersectionObserver: class {},
    CSS: { escape: (value) => value },
    window: { getSelection: () => null, close() {} },
    document: {
      addEventListener() {},
      querySelectorAll: () => [],
      querySelector: () => null,
      getElementById: () => null,
      createElement: () => ({ textContent: "" }),
    },
    chrome: {
      runtime: { onMessage: listeners, sendMessage: async () => ({}) },
      windows: { getCurrent: async () => ({ id: 1 }) },
      tabs: { onUpdated: listeners, onActivated: listeners },
      storage: {
        local: {
          get: async () => ({}),
          set: async () => {},
          remove: async () => {},
        },
      },
    },
    YTD_SETTINGS: {},
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read("sidepanel.js"), sandbox);
  return sandbox.__YTD_TRANSCRIPT_TESTING__;
}

test("splitChatInline separates bold text, inline code, and timestamps", () => {
  const { splitChatInline } = loadPanel();
  const tokens = splitChatInline(
    "**要点**：开头在 [03:37]，也可以写 1:05，代码 `x = 1`。",
  );

  const bold = tokens.filter((token) => token.type === "bold");
  assert.deepEqual(
    Array.from(bold, (token) => token.text),
    ["要点"],
  );

  const timestamps = tokens.filter((token) => token.type === "timestamp");
  assert.deepEqual(
    Array.from(timestamps, (token) => token.text),
    ["3:37", "1:05"],
  );
  assert.equal(timestamps[0].seconds, 3 * 60 + 37);
  assert.equal(timestamps[1].seconds, 65);

  const code = tokens.filter((token) => token.type === "code");
  assert.deepEqual(
    Array.from(code, (token) => token.text),
    ["x = 1"],
  );
});

test("splitChatInline never turns part of a larger number into a timestamp", () => {
  const { splitChatInline } = loadPanel();
  const tokens = splitChatInline("版本 2024:12 与 123:45，另有 12:34。");

  const timestamps = tokens.filter((token) => token.type === "timestamp");
  assert.deepEqual(
    Array.from(timestamps, (token) => token.text),
    ["12:34"],
  );
});

const plain = (value) => JSON.parse(JSON.stringify(value));

test("parseChatMarkdown groups paragraphs, headings, and lists", () => {
  const { parseChatMarkdown } = loadPanel();
  const rawBlocks = parseChatMarkdown(
    [
      "## 第一节",
      "第一段内容。",
      "",
      "第二段长句",
      "接着写。",
      "",
      "- 项目一",
      "- 项目二",
      "",
      "1. 步骤一",
      "2. 步骤二",
    ].join("\n"),
  );
  const blocks = plain(rawBlocks);

  assert.deepEqual(
    blocks.map((block) => block.type),
    ["heading", "paragraph", "paragraph", "list", "list"],
  );
  assert.equal(blocks[0].level, 2);
  assert.equal(blocks[0].text, "第一节");
  assert.equal(blocks[1].text, "第一段内容。");
  assert.equal(blocks[2].text, "第二段长句 接着写。");
  assert.deepEqual(blocks[3], {
    type: "list",
    ordered: false,
    items: ["项目一", "项目二"],
  });
  assert.deepEqual(blocks[4], {
    type: "list",
    ordered: true,
    items: ["步骤一", "步骤二"],
  });
  assert.deepEqual(plain(parseChatMarkdown("")), []);
});

test("assistant bubbles are built as DOM nodes, never as HTML strings", () => {
  const script = read("sidepanel.js");
  const start = script.indexOf("// CHAT MESSAGE RENDERING (GEMINI-STYLE MARKDOWN)");
  const end = script.indexOf("function renderChatMessages", start);
  assert.ok(start > 0 && end > start, "expected the chat rendering section");
  const chatRendering = script.slice(start, end);

  assert.match(chatRendering, /buildChatContent/);
  assert.match(chatRendering, /createDocumentFragment/);
  assert.match(chatRendering, /document\.createTextNode/);
  assert.doesNotMatch(chatRendering, /innerHTML/);
  assert.match(script, /if \(isAssistant\) \{[\s\S]*buildChatContent\(message\.content\)/);
});

test("chat timestamps are wired to the player and to saved conversations", () => {
  const script = read("sidepanel.js");
  const styles = read("sidepanel.css");

  assert.match(script, /className = "chat-timestamp"/);
  assert.match(script, /dataset\.seconds/);
  assert.match(script, /aria-label", `跳转到 \$\{token\.text\}`/);
  assert.match(script, /handleChatTimestampClick/);
  assert.match(script, /chatVideoId === currentVideoId/);
  assert.match(script, /await seekTo\(seconds\)/);
  assert.match(script, /chrome\.tabs\.create/);
  assert.match(styles, /\.chat-timestamp\s*\{/);
  assert.match(styles, /\.chat-timestamp:focus-visible\s*\{/);
  assert.match(styles, /\.chat-heading\s*\{/);
});
