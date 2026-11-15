const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("manifest uses minimized install-time permissions", () => {
  const manifest = JSON.parse(read("manifest.json"));
  const packageJson = JSON.parse(read("package.json"));

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.minimum_chrome_version, "116");
  assert.equal(packageJson.version, manifest.version);
  assert.equal(manifest.options_ui.page, "options.html");
  assert.ok(!manifest.permissions.includes("activeTab"));
  assert.ok(manifest.host_permissions.includes("https://api.deepseek.com/*"));
  assert.deepEqual(manifest.optional_host_permissions, [
    "http://*/*",
    "https://*/*",
  ]);
  assert.equal(manifest.version, "1.5.0");
  assert.deepEqual(
    manifest.content_scripts.map((entry) => entry.js),
    [["caption-capture.js"], ["content.js"]],
  );
  assert.equal(manifest.content_scripts[0].run_at, "document_start");
  assert.equal(manifest.content_scripts[0].world, "MAIN");
  assert.equal(manifest.content_scripts[1].run_at, "document_idle");
});

test("release copy documents current scope without em dashes", () => {
  const readme = read("README.md");
  const chineseReadme = read("README.zh-CN.md");
  const manifest = JSON.parse(read("manifest.json"));
  const packageJson = JSON.parse(read("package.json"));

  assert.doesNotMatch(readme, /—/);
  assert.doesNotMatch(chineseReadme, /—/);
  assert.doesNotMatch(manifest.description, /—/);
  assert.doesNotMatch(packageJson.description, /—/);

  assert.equal(manifest.name, "YouTube Digest");
  assert.equal(packageJson.name, "youtube-digest");
  assert.match(read("scripts/package-extension.sh"), /youtube-digest-v\$version\.zip/);
  assert.doesNotMatch(
    [readme, chineseReadme, read("PRIVACY.md"), read("SECURITY.md")].join("\n"),
    /\bYT Digest\b/,
  );
  assert.match(readme, /^# YouTube Digest$/m);
  assert.match(
    readme,
    /Turn every YouTube video into a resource for deep learning\./,
  );
  assert.doesNotMatch(readme, /before deciding how much of it to watch/i);
  assert.match(readme, /^## Install with your coding agent$/m);
  assert.match(
    readme,
    /permanent folder I choose[\s\S]*tell me its exact full path[\s\S]*If I need a suggestion during this first installation[\s\S]*`~\/Documents\/youtube-digest`[\s\S]*`%USERPROFILE%\\Documents\\youtube-digest`[\s\S]*do not assume either path/,
  );
  assert.match(
    readme,
    /Moving or deleting the source folder breaks the unpacked extension until you load it again from the new location\./,
  );
  assert.match(
    readme,
    /selecting the exact project folder you chose in Chrome with \*\*Load unpacked\*\*/,
  );
  assert.match(
    readme,
    /Select the exact project folder you chose, which must contain `manifest\.json`/,
  );
  assert.match(readme, /upstream issues and pull requests are not accepted/i);
  assert.doesNotMatch(readme, /^## Contributing$/m);
  assert.match(chineseReadme, /^# YouTube Digest$/m);
  assert.match(chineseReadme, /把每个 YouTube 视频变成一份可以深入学习的资料/);
  assert.match(chineseReadme, /^## 让你的编程 Agent 帮你安装$/m);
  assert.match(
    chineseReadme,
    /我选择的长期保留文件夹[\s\S]*告诉我准确的完整路径[\s\S]*第一次安装时需要位置建议[\s\S]*`~\/Documents\/youtube-digest`[\s\S]*`%USERPROFILE%\\Documents\\youtube-digest`[\s\S]*不要假设我一定使用这些路径/,
  );
  assert.match(
    chineseReadme,
    /如果移动或删除源代码文件夹，Chrome 中加载的扩展会失效，需要从新的位置重新加载。/,
  );
  assert.match(
    chineseReadme,
    /“加载已解压的扩展程序”选择你刚才确定的那个准确项目文件夹/,
  );
  assert.match(
    chineseReadme,
    /选择你刚才确定的那个准确项目文件夹，其中必须包含 `manifest\.json`/,
  );
  assert.match(chineseReadme, /不接受上游 Issue 或 Pull Request/);
  assert.match(chineseReadme, /增加更多翻译语言/);

  assert.match(readme, /100 credits per month/i);
  assert.match(readme, /native transcript request uses \*\*1 credit\*\*/i);
  assert.match(readme, /generated transcript costs \*\*2 credits per video minute\*\*/i);
  assert.match(readme, /HTTP `206` still uses \*\*1 credit\*\*/i);
  assert.match(readme, /forces `mode=native`/i);
  assert.match(readme, /100 monthly credits are only spent on videos/i);
  assert.match(readme, /supadata\.ai\/pricing/i);
  assert.match(readme, /docs\.supadata\.ai\/get-transcript/i);
  assert.match(readme, /dash\.supadata\.ai\/auth\/sign-up/i);
  assert.match(readme, /platform\.deepseek\.com\/api_keys/i);
  assert.match(readme, /api-docs\.deepseek\.com/i);
  assert.match(readme, /api-docs\.deepseek\.com\/quick_start\/pricing/i);
  assert.match(readme, /\$0\.007[\s\S]*\$0\.014/);
  assert.match(readme, /\$0\.22[\s\S]*\$0\.44/);
  assert.match(readme, /\$0\.66[\s\S]*\$1\.32/);
  assert.match(readme, /01:00–04:00[\s\S]*06:00–10:00 UTC/);
  assert.match(readme, /20-minute English talk/i);
  assert.match(readme, /32,600 input tokens/i);
  assert.match(readme, /\$0\.003[^\n]*\$0\.010 USD/i);
  assert.match(readme, /\$0\.005[^\n]*\$0\.020 USD/i);
  assert.match(chineseReadme, /api-docs\.deepseek\.com\/quick_start\/pricing/i);
  assert.match(chineseReadme, /\$0\.007[\s\S]*\$0\.014/);
  assert.match(chineseReadme, /\$0\.22[\s\S]*\$0\.44/);
  assert.match(chineseReadme, /\$0\.66[\s\S]*\$1\.32/);
  assert.match(chineseReadme, /UTC 01:00–04:00[\s\S]*06:00–10:00/);
  assert.match(chineseReadme, /20 \u5206\u949f\u82f1\u6587\u89c6\u9891/);
  assert.match(chineseReadme, /32,600 \u4e2a\u8f93\u5165 token/);
  assert.match(chineseReadme, /\$0\.003[^\n]*\$0\.010 USD/);
  assert.match(chineseReadme, /\$0\.005[^\n]*\$0\.020 USD/);
  assert.match(chineseReadme, /dash\.supadata\.ai\/auth\/sign-up/i);
  assert.match(chineseReadme, /platform\.deepseek\.com\/api_keys/i);
  assert.match(readme, /^### The Digest button is missing on a YouTube video$/m);
  assert.match(
    chineseReadme,
    /^### YouTube 视频页面没有显示 Digest 按钮$/m,
  );

  const optionsPage = read("options.html");
  const optionsStyles = read("options.css");
  const optionsScript = read("options.js");
  assert.match(optionsPage, /dash\.supadata\.ai\/auth\/sign-up/i);
  assert.match(optionsPage, /platform\.deepseek\.com\/api_keys/i);
  assert.doesNotMatch(optionsPage, /<select\b/i);
  assert.doesNotMatch(optionsPage, /id="provider"/);
  for (const id of [
    "supadataApiKey",
    "aiModel",
    "aiBaseUrl",
    "testAiConnectionBtn",
  ]) {
    assert.match(optionsPage, new RegExp(`id="${id}"`));
  }
  assert.match(optionsPage, /name="transcriptSource"/);
  assert.match(optionsPage, /value="youtube"/);
  const detailsTag = optionsPage.match(
    /<details\b[^>]*class="card customization-card"[^>]*>/,
  );
  assert.ok(detailsTag, "Expected a native Local remix details disclosure");
  assert.doesNotMatch(detailsTag[0], /\sopen(?:\s|=|>)/i);
  assert.match(
    optionsPage,
    /<summary class="customization-summary">[\s\S]*Want to use another AI model\?[\s\S]*Edit and copy a safe prompt for your coding agent[\s\S]*<\/summary>/,
  );
  assert.match(
    optionsPage,
    /class="customization-steps"[\s\S]*Open the extracted YouTube Digest project folder in your coding[\s\S]*Replace \[PROVIDER\] and \[MODEL\][\s\S]*Never include API keys[\s\S]*<\/ol>/,
  );
  assert.match(
    optionsPage,
    /class="prompt-reminder"[\s\S]*Before copying, replace \[PROVIDER\] and \[MODEL\]/,
  );
  assert.doesNotMatch(optionsPage, /~\/Documents\/youtube-digest/);
  assert.doesNotMatch(optionsPage, /%USERPROFILE%\\Documents\\youtube-digest/);
  assert.match(optionsPage, /id="copyCustomizationPromptBtn"/);
  assert.match(optionsStyles, /\.customization-summary:hover\s*\{/);
  assert.match(optionsStyles, /\.customization-summary:focus-visible\s*\{/);
  assert.match(optionsStyles, /\.data-card\s*\{[^}]*margin-top:\s*36px;/);
  assert.match(optionsScript, /clipboard\.writeText/);
  assert.match(optionsScript, /Edited prompt copied\./);
  assert.match(optionsScript, /migration\.migrated[\s\S]*storage\.set/);

  const customizationPrompt = `Customize this local YouTube Digest workspace to use [PROVIDER] with [MODEL]. Work only in the current workspace. Before editing, verify that it contains manifest.json and that the manifest name is YouTube Digest. If verification fails, stop and ask me to open the extracted YouTube Digest project folder in my coding agent. Do not search other folders, edit a guessed copy, assume an installation path, or claim Chrome can reveal the absolute OS source path. Update the provider's API endpoint, request format, and minimum Chrome host permissions. Preserve bring-your-own-key and local Chrome storage. Never put API keys in source code, commits, logs, screenshots, this prompt, or chat; after the code is ready, tell me where to enter the key myself. Keep DeepSeek-only request fields and retry behavior isolated to DeepSeek. Handle provider-specific rules separately so one provider does not affect another. Update README.md, README.zh-CN.md, PRIVACY.md, SECURITY.md, and tests. Run npm test, npm run check, and npm run package. Then explain how to reload the unpacked extension and test it on a real YouTube video.`;
  assert.ok(optionsPage.includes(`>${customizationPrompt}</textarea>`));
  assert.doesNotMatch(customizationPrompt, /Documents|USERPROFILE/);

  assert.match(readme, /^## Remix it with your coding agent$/m);
  assert.match(readme, /^## New in v1\.5\.0$/m);
  assert.match(readme, /Free YouTube captions only/i);
  assert.match(readme, /never calls Supadata and never spends a credit/i);
  assert.match(readme, /clickable \[M:SS\] timestamp/i);
  assert.match(chineseReadme, /^## v1\.5\.0 更新$/m);
  assert.match(chineseReadme, /仅使用免费字幕/);
  assert.match(chineseReadme, /可点击的 \[M:SS\] 时间戳/);
  assert.match(readme, /^## New in v1\.4\.0$/m);
  assert.match(readme, /thinking animation/i);
  assert.match(readme, /Conversations are saved locally per video/i);
  assert.match(readme, /\*\*History\*\* in the chat tab/);
  assert.match(chineseReadme, /^## v1\.4\.0 更新$/m);
  assert.match(chineseReadme, /对话按视频保存在本机/);
  assert.match(readme, /more translation languages/i);
  assert.match(readme, /customized summary templates/i);
  assert.match(readme, /vocabulary notebook/i);
  assert.match(readme, /Ask follow-up questions about the video in a chat tab/i);
  assert.match(readme, /both fields are editable/i);
  assert.match(
    readme,
    /If you want another AI provider or model, open Settings and edit/i,
  );
  assert.match(
    chineseReadme,
    /接口地址和模型名称都可以修改|AI 接口地址.*模型名称/,
  );
  assert.match(chineseReadme, /对话/);

  const publishedDocs = [
    readme,
    chineseReadme,
    read("PRIVACY.md"),
    read("SECURITY.md"),
  ].join("\n");
  assert.doesNotMatch(publishedDocs, /custom OpenAI-compatible/i);
  assert.doesNotMatch(publishedDocs, /optional custom-origin/i);
  assert.doesNotMatch(publishedDocs, /chosen AI provider/i);
  assert.doesNotMatch(publishedDocs, /configure a different OpenAI-compatible/i);
  assert.match(
    readme,
    /any OpenAI-compatible provider can be configured/i,
  );
  assert.match(
    readme,
    /DeepSeek-specific request fields are only sent to the official/i,
  );
  assert.match(chineseReadme, /DeepSeek 专用的请求字段只会发送给官方/);
});

test("product UI contains no emoji or emoji-like pictographs", () => {
  const productUi = [
    read("sidepanel.html"),
    read("sidepanel.js"),
    read("content.js"),
    read("options.html"),
    read("options.js"),
  ].join("\n");

  assert.doesNotMatch(
    productUi,
    /\p{Extended_Pictographic}|[✓✕⧉▶]/u,
  );
  assert.doesNotMatch(productUi, /&#(?:9655|9888);/);
});

test("selection actions use two equal edge-to-edge hover areas", () => {
  const css = read("sidepanel.css");

  assert.match(
    css,
    /\.explain-tooltip\s*\{[^}]*padding:\s*0;[^}]*overflow:\s*hidden;/,
  );
  assert.match(
    css,
    /\.explain-btn,\s*\.selection-note-btn\s*\{[^}]*flex:\s*1 1 50%;[^}]*border-radius:\s*0;/,
  );
  assert.match(
    css,
    /\.explain-tooltip\s*\{[^}]*animation:\s*selectionToolbarIn/,
  );
  assert.match(
    css,
    /@keyframes selectionToolbarIn\s*\{[\s\S]*transform:\s*translate\(-50%, 4px\);[\s\S]*transform:\s*translate\(-50%, 0\);/,
  );
});

test("note delete is an accessible SVG action at the end of the action row", () => {
  const js = read("sidepanel.js");
  const css = read("sidepanel.css");

  assert.match(
    js,
    /<div class="note-actions">[\s\S]*class="[^"]*note-play[^"]*"[\s\S]*class="note-delete"[\s\S]*aria-label="删除笔记"[\s\S]*<svg viewBox="0 0 24 24" aria-hidden="true">/,
  );
  assert.doesNotMatch(js, /class="note-delete"[^>]*>Delete<\/button>/);
  assert.match(
    css,
    /\.note-delete\s*\{[^}]*place-items:\s*center;[^}]*margin-left:\s*auto;/,
  );
  assert.match(css, /\.note-delete:focus-visible\s*\{[^}]*outline:/);
});

test("notes filters preserve selected contrast and expose pressed state", () => {
  const html = read("sidepanel.html");
  const css = read("sidepanel.css");
  const js = read("sidepanel.js");

  assert.match(
    html,
    /id="notesFilterThis"[\s\S]*?aria-pressed="true"[\s\S]*?>[\s\S]*?本视频/,
  );
  assert.match(
    html,
    /id="notesFilterAll"[\s\S]*?aria-pressed="false"[\s\S]*?>[\s\S]*?全部笔记/,
  );
  assert.match(
    css,
    /\.notes-filter \.enhance-btn\.active:hover:not\(:disabled\)\s*\{[^}]*background:\s*var\(--accent-hover\);[^}]*color:\s*white;/,
  );
  assert.match(
    css,
    /\.notes-filter \.enhance-btn:hover:not\(:disabled\)\s*\{[^}]*background:\s*transparent;[^}]*color:\s*var\(--text-secondary\);/,
  );
  assert.match(css, /\.notes-filter \.enhance-btn:focus-visible\s*\{[^}]*outline:/);
  assert.match(js, /setNotesFilter\(false\)/);
  assert.match(js, /setNotesFilter\(true\)/);
  assert.match(js, /setAttribute\("aria-pressed", String\(!showAll\)\)/);
  assert.match(js, /setAttribute\("aria-pressed", String\(showAll\)\)/);
});

test("runtime has no source-file credential dependency or retired model", () => {
  const runtime = [
    "background.js",
    "content.js",
    "sidepanel.js",
    "options.js",
    "settings.js",
  ]
    .map(read)
    .join("\n");

  assert.doesNotMatch(runtime, /\bCONFIG\./);
  assert.doesNotMatch(runtime, /importScripts\(["']config\.js/);
  assert.doesNotMatch(runtime, /\bdeepseek-chat\b/);
  assert.match(runtime, /deepseek-v4-flash/);
});

test("background reconciles side-panel state after navigation commits", () => {
  const background = read("background.js");

  assert.match(
    background,
    /function getNavigationUrl\(changeInfo, tab\)[\s\S]*changeInfo\.status !== "loading"[\s\S]*changeInfo\.status !== "complete"[\s\S]*tab\.pendingUrl \|\| tab\.url/,
  );
  assert.match(
    background,
    /chrome\.tabs\.onUpdated\.addListener\(\(tabId, changeInfo, tab\)[\s\S]*getNavigationUrl\(changeInfo, tab\)[\s\S]*updatePanelForTab\(tabId, url, tab\.windowId\)/,
  );
  assert.match(
    background,
    /function closePanelForTab\(tabId, windowId\)[\s\S]*chrome\.sidePanel\.close\(\{ tabId \}\)[\s\S]*chrome\.sidePanel\.close\(\{ windowId \}\)/,
  );
  assert.match(
    background,
    /await closePanelForTab\(tabId, windowId\);[\s\S]*setOptions\(\{ tabId, enabled: false \}\)/,
  );
});

test("retired Remix and reader files are absent", () => {
  for (const file of [
    "reader.html",
    "reader.js",
    "remix-prompts.js",
    "config.example.js",
  ]) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file);
  }
});

test("chat tab exposes saved history, reference link, suggestions, and thinking state", () => {
  const html = read("sidepanel.html");
  const js = read("sidepanel.js");

  for (const id of [
    "chatHistoryBtn",
    "chatHistoryPanel",
    "chatHistoryList",
    "chatReferenceLink",
    "chatReferenceMeta",
    "chatSuggestions",
    "chatThinking",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  for (const token of [
    "ytd_chat_index",
    "chatHistoryBtn",
    "chatReferenceLink",
    "chatSuggestions",
    "chatThinking",
    "videoDuration",
    "videoUrl",
    "analysisSummary",
  ]) {
    assert.match(js, new RegExp(token), token);
  }
});

test("published prompt files contain runtime sections", () => {
  const expectedSections = {
    "prompts/analysis.md": ["System prompt", "User prompt"],
    "prompts/chat.md": ["System prompt", "User prompt"],
    "prompts/explain.md": ["System prompt", "User prompt"],
    "prompts/note-cleanup.md": ["System prompt", "User prompt"],
    "prompts/translation.md": [
      "Shared base rules",
      "Chinese rules",
      "Transcript batch translation",
    ],
  };

  for (const [file, sections] of Object.entries(expectedSections)) {
    const markdown = read(file);
    for (const section of sections) {
      assert.match(markdown, new RegExp(`^## ${section}$`, "m"));
    }
  }
});
