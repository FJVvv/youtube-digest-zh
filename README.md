# YouTube Digest

[English](README.md) | [简体中文](README.zh-CN.md)

Turn every YouTube video into a resource for deep learning. YouTube Digest brings transcripts, bilingual translation, AI overviews, explanations, and timestamped notes into one Chrome side panel, so you can study ideas and language without losing your place.

- Turn captions into a readable, searchable learning resource.
- Learn languages with the original transcript, a Simplified Chinese translation, or an aligned bilingual view.
- Build understanding with an AI overview, chapters, key quotes, and selected-text explanations.
- Navigate long videos by clicking timestamps in the transcript, overview, or notes.
- Save polished timestamped notes for later study.
- Ask follow-up questions about the video in a chat tab, and export the whole conversation.
- Keep control of your data with your own API keys, local Chrome storage, and no analytics or telemetry.

YouTube Digest is a bring-your-own-key project installed locally from GitHub. It is not available through the Chrome Web Store, does not include API credits, and does not run a developer-operated server.

![YouTube Digest demo](YouTube%20Digest%20demo.png)

## New in v1.5.0

- Chat answers are more concise and easier to scan: a direct answer first, then short bold points, with at most one clickable [M:SS] timestamp per point instead of timestamp ranges. The output budget is 2,048 tokens.
- Timestamps in chat are clickable. On the current video they seek the player; in a saved conversation they open that video at the same moment in a new tab.
- Settings now offer **Free YouTube captions only**, a transcript source that never calls Supadata and never spends a credit. If free captions cannot be read, the panel shows the reason, and **Free captions first** still falls back to Supadata when you have a key.

## New in v1.4.0

- Deeper video chat: answers open with a one-line verdict, then develop the point with [M:SS] evidence from the transcript. Background knowledge is labeled as background, and the model says so when the captions do not cover something. It receives the video duration, URL, description, any existing overview, and up to 60,000 characters of transcript, and can use up to 4,096 output tokens.
- A thinking animation shows while the AI works, so the panel never looks stuck.
- Conversations are saved locally per video. Reopen a video and its chat is restored; a new video starts a fresh conversation. **History** in the chat tab opens any earlier video's conversation with a link to that video, deletes a conversation, and exports one with its link.
- `deepseek-v4-flash` stays the default for fast answers. For deeper analysis, set **Model name** to `deepseek-v4-pro`.

## New in v1.3.0

- Read a video's own YouTube captions for free, with no third-party transcript service and no API key. Supadata stays available as an optional fallback.
- Choose the AI endpoint and model in Settings. DeepSeek stays the default, and any OpenAI-compatible endpoint can be used.
- Ask questions about the current video in the new chat tab: it references the video, waits for your prompt, answers from the transcript, keeps the conversation, and exports it.
- Jump to a video by URL from the side panel.

## New in v1.2.0

- Search transcript words or phrases and move through every match.
- Use one Original, Chinese, or bilingual setting across Transcript, Overview, and Notes. New videos stay in Original by default.
- Translate visible Overview and Notes content progressively in small cached batches.
- Explain selected transcript text or save it directly as a timestamped note.
- Keep your transcript position across navigation, with the panel closing automatically outside YouTube video pages.

## Install with your coding agent

You do not need to understand the code or use the command line. Send this message to your coding agent:

> Download or clone this project into a permanent folder I choose, tell me its exact full path, and use that same folder for Chrome's Load unpacked step. If I need a suggestion during this first installation, offer `~/Documents/youtube-digest` on macOS or Linux, or `%USERPROFILE%\Documents\youtube-digest` on Windows, but do not assume either path. Walk me through installation and setup in simple terms. https://github.com/zarazhangrui/youtube-digest

Your agent should:

1. Ask where you want to keep the project, download or clone it there, and tell you the exact full path. If you want a suggestion, it can offer `~/Documents/youtube-digest` on macOS or Linux, or `%USERPROFILE%\Documents\youtube-digest` on Windows.
2. Open the official DeepSeek page below and help you create your own account. The Supadata account is optional and only needed if you enable the fallback transcript service.
3. Walk you through selecting the exact project folder you chose in Chrome with **Load unpacked**.
4. Show you where to enter your API keys in the extension's **Settings** page.
5. Open a YouTube video with captions and confirm the transcript, translation, and chat work.

Keep this folder in the same place after installation. If you move or delete it, Chrome's unpacked extension stops working until you load the extension again from its new permanent folder.

Never paste an API key into an AI chat, source file, screenshot, or public message. Enter keys yourself, directly in the YouTube Digest Settings page. Your coding agent can point to the correct field without seeing the key.

## Install manually

If you prefer to do it yourself:

1. Open [github.com/zarazhangrui/youtube-digest](https://github.com/zarazhangrui/youtube-digest).
2. Choose **Code**, then **Download ZIP**.
3. Choose a permanent folder and unzip the project there. Optional suggestions are `~/Documents/youtube-digest` on macOS or Linux, or `%USERPROFILE%\Documents\youtube-digest` on Windows. You may use a different folder.
4. In Chrome, open `chrome://extensions`.
5. Turn on **Developer mode**.
6. Click **Load unpacked**.
7. Select the exact project folder you chose, which must contain `manifest.json`.
8. Pin YouTube Digest from Chrome's Extensions menu if you want quick access.

Because this is an unpacked extension, it does not update automatically. After downloading an update or changing local files, click **Reload** on the YouTube Digest card at `chrome://extensions`, then refresh open YouTube tabs. Moving or deleting the source folder breaks the unpacked extension until you load it again from the new location.

## Set up your API keys

YouTube Digest reads a video's own YouTube captions for free, so no key is needed to get a transcript. Two optional keys sit under your own provider accounts:

1. A **Supadata API key** is an optional fallback for videos whose captions the page will not hand over.
2. An **AI API key** (DeepSeek by default) powers overviews, explanations, translation, automatic note polishing, and the chat tab.

The extension works without the Supadata key. Without an AI key, the free transcript and translation caches still work, but AI features ask you to add a key.

### Get a Supadata API key (optional)

1. Open the official [Supadata sign-up page](https://dash.supadata.ai/auth/sign-up).
2. Create an account and complete the short onboarding flow.
3. Supadata generates an API key automatically during onboarding.
4. Open the [Supadata dashboard](https://dash.supadata.ai/) whenever you need to find or manage the key.
5. Copy the key and paste it into **Supadata API key** in YouTube Digest Settings.
6. Set **Transcript source** to **Auto (free captions first)** to use it only as a fallback, or to **Supadata** to always use the service.

See the [official Supadata documentation](https://docs.supadata.ai/) if the dashboard flow changes.

### Get a DeepSeek API key

1. Open the official [DeepSeek API Keys page](https://platform.deepseek.com/api_keys).
2. Sign in or create a DeepSeek Platform account when prompted.
3. Choose **Create new API key**, give it a recognizable name such as `YouTube Digest`, and create it.
4. Copy the key immediately. The full key may only be shown once.
5. Paste it into **AI API key** in YouTube Digest Settings.
6. If DeepSeek reports insufficient balance, add credit in your DeepSeek Platform account and try again.

See the [official DeepSeek API documentation](https://api-docs.deepseek.com/) for current account and API details.

Open **Settings** from the side panel. You can also open the YouTube Digest **Options** page from its card at `chrome://extensions` or by right-clicking its toolbar icon. Paste keys only into these Settings fields. Never paste a key into an AI chat, repository file, screenshot, or public message.

The default AI configuration is DeepSeek V4 Flash:

```text
Base URL: https://api.deepseek.com
Model: deepseek-v4-flash
```

Both the **AI endpoint** and **Model name** fields are editable in Settings, so you can point the extension at any OpenAI-compatible endpoint (for example a self-hosted gateway or another provider) and enter that provider's model name. Use **Test connection** to verify the key, endpoint, and model before relying on them. The official DeepSeek endpoint currently accepts model names such as `deepseek-v4-flash` (the default), `deepseek-flash`, and `deepseek-v4-pro`; any other name returns a model error. If **Test connection** reports that the model is not found, correct the **Model name** field. DeepSeek-specific request fields are only sent to the official `https://api.deepseek.com` endpoint, so other compatible services are not sent parameters they may reject. When you use a custom endpoint, Chrome asks once for permission to access that domain.

Keys and settings are stored in Chrome's local extension storage on your device. Release builds do not include or use `config.js`.

## Use YouTube Digest

1. Open a standard YouTube watch page with captions.
2. Click the YouTube Digest extension icon to open the side panel.
3. Read the timestamped transcript, or choose **Original**, **中文**, or **双语**.
4. Open **Overview** when you want AI-generated chapters and key quotes.
5. Select transcript text when you want an AI explanation.
6. Save a note from the player or a key quote, then revisit it from **Notes**.
7. Open **Chat** to ask your own question about the video. The tab only references the video until you type a prompt and send it. Conversations are saved on this device per video: reopen the video to continue, or use **History** to return to an earlier conversation. **Export chat** downloads the whole conversation as a text file with its video link.
8. Paste a video URL into the header field and press Enter to jump to that video.

## What works today

- Google Chrome 116 or newer, using the Side Panel API.
- Standard `youtube.com/watch` video pages.
- Free transcripts parsed from the video's own YouTube caption track. Supadata is an optional fallback when configured.
- Original, Simplified Chinese, and aligned bilingual transcript views.
- AI overviews, selected-text explanations, translation, automatic note polishing, and free-form video chat.
- Local notes, chat history, and a local cache for recent transcript and digest results.
- DeepSeek V4 Flash by default. The endpoint and model are editable, and any OpenAI-compatible provider can be configured.

Shorts, live streams, private or access-restricted videos, and videos without an available caption track may not work. Firefox, Safari, mobile browsers, and other Chromium browsers are not currently tested or supported.

When the free caption path fails, YouTube Digest asks the page for its own caption track, and only then falls back to Supadata when a key is configured. It does not request AI-generated transcripts or perform local audio transcription.

## Supadata free tier and request costs

Supadata is optional in v1.3.0. The free transcript path uses the video's own captions, so most lookups cost nothing. The quotes below apply only when the fallback service is enabled.

Current as of August 9, 2026, the [Supadata pricing page](https://supadata.ai/pricing) lists a free tier with **100 credits per month**, no credit card required. Unused credits do not roll over. Supadata pricing can change, so check the current page before relying on these numbers.

The [Supadata transcript documentation](https://docs.supadata.ai/get-transcript) describes the transcript request modes and credit behavior:

- A native transcript request uses **1 credit**, regardless of video duration.
- A generated transcript costs **2 credits per video minute**. YouTube Digest does not use this path because it forces `mode=native`.
- An unavailable native lookup returned as HTTP `206` still uses **1 credit**.

With the fallback enabled, a native transcript request uses **1 credit** and the document lists the same native-only behavior as before. Because the free caption path runs first by default, the 100 monthly credits are only spent on videos whose own captions could not be read. Retries and unavailable-caption lookups still consume credits.

AI usage is separate from Supadata and is billed by the provider you configure. YouTube Digest does not collect payments or resell access. Set spending limits and monitor your own accounts.

## AI provider pricing (default: DeepSeek V4 Flash)

The default provider is DeepSeek V4 Flash. As of August 27, 2026, DeepSeek lists these USD prices per 1 million tokens on its official [pricing page](https://api-docs.deepseek.com/quick_start/pricing/):

| Token type | Off-peak | Peak |
| --- | ---: | ---: |
| Cache-hit input | $0.007 | $0.014 |
| Cache-miss input | $0.22 | $0.44 |
| Output | $0.66 | $1.32 |

Peak hours are 01:00–04:00 and 06:00–10:00 UTC, Monday through Friday. All other hours use off-peak rates.

A measured 20-minute English talk used about **32,600 input tokens** and an estimated **3,500 to 4,500 output tokens** across 43 small translation batches. At current prices, translating the full video costs approximately:

- **Off-peak: $0.003 to $0.010 USD**.
- **Peak: $0.005 to $0.020 USD**.

The lower end assumes most repeated input hits DeepSeek's cache. The upper end assumes cache misses. Translation is lazy and cached, so translating only part of a video costs less. Check the official page before relying on these prices.

## Remix it with your coding agent

This is a personal remix project. Upstream issues and pull requests are not accepted. If something breaks or you want a new feature, download or fork your own copy and ask your coding agent to fix, remix, or personalize it for you.

YouTube Digest uses plain HTML, CSS, and JavaScript with no build step, so it is a friendly starting point for agent-assisted projects. Ideas to try:

- Add more translation languages and let each person choose a learning language.
- Create customized summary templates for lectures, interviews, tutorials, reviews, or research talks.
- Build a vocabulary notebook that saves a word, its sentence, meaning, and video timestamp.
- Export notes and vocabulary to Markdown, CSV, Anki, or another study tool.
- Add personal topic filters that highlight the chapters most relevant to a goal.
- Add optional local-model support for a different privacy and cost tradeoff.
- Improve accessibility with keyboard navigation, font controls, and higher-contrast themes.

Ask your agent to preserve the bring-your-own-key model, keep secrets out of source files, run the checks below, and test the remix on real videos.

If you want another AI provider or model, open Settings and edit **AI endpoint** and **Model name** directly, then enter that provider's key and use **Test connection**. The safe customization prompt in Settings is still there for deeper local changes: give it to a coding agent for your local copy, and never include an API key in the prompt or chat.

## Privacy and data flow

YouTube Digest makes its requests directly from the extension:

1. By default it reads the video's own captions inside the YouTube page, so no transcript leaves your browser.
2. If you enable the Supadata fallback, it sends a canonical YouTube watch URL to Supadata to request the native transcript.
3. It sends the transcript and relevant video metadata to the AI endpoint you configured when you request AI features, including questions in the chat tab.
4. Focused features send only the content they need, such as selected text with context or small transcript batches for translation.
5. It stores keys, settings, notes, chat messages, and recent cache entries locally in Chrome.

There is no YouTube Digest account system, advertising, analytics, or telemetry. Supadata and your AI provider still receive data under their own terms and privacy policies. See [PRIVACY.md](PRIVACY.md) for details.

## Troubleshooting

### The Digest button is missing on a YouTube video

- At `chrome://extensions`, find YouTube Digest and click **Reload**, then refresh the YouTube tab.
- Confirm that you are on a standard `https://www.youtube.com/watch?...` page, not a Short, embed, or live page.
- The current version automatically follows YouTube when its responsive action bar changes. Wait a moment after the page finishes loading.
- If you have an older downloaded copy, resizing the YouTube window horizontally once may reveal the button. Then download the latest version so resizing is no longer required.
- If it is still missing, ask your coding agent to inspect the content script on that exact video page.

### The side panel does not open

- Confirm that you are on a standard `https://www.youtube.com/watch?...` page.
- At `chrome://extensions`, confirm YouTube Digest is enabled and click **Reload**.
- Refresh the YouTube tab after reloading the extension.
- Ask your coding agent to inspect the extension if the problem continues.

### YouTube Digest asks for setup

- Open **Settings** and save an AI API key. A Supadata key is only needed if you enable the fallback transcript service.
- The default endpoint and model are DeepSeek V4 Flash, but both fields are editable. Use **Test connection** after changing them.
- If Settings says a legacy custom provider was removed, enter the key for the provider you want to use.

### The interface looks new, but Test connection, Chat, or free captions do not work

- This usually means the background service worker is still running old code. Open `chrome://extensions`, click **Reload** on the YouTube Digest card, then refresh the YouTube tab and try again.
- In Settings, check that **Model name** is a model the service supports. The official DeepSeek endpoint accepts `deepseek-v4-flash`, `deepseek-flash`, and `deepseek-v4-pro`.
- The Transcript tab shows a **transcript source** line: YouTube captions are free, while Supadata means the fallback ran and spent one credit.

### No transcript is found

- Confirm the video is public and has captions available in the YouTube player.
- If the free caption path fails, check whether the Transcript source setting is set to Supadata and, if so, check that Supadata key, remaining credits, rate limit, and account status.
- Remember that unavailable native lookups and manual retries may still consume Supadata credits.

YouTube Digest will not fall back to generated transcription.

### AI requests fail

- A `401` or `403` usually means the API key or account access is invalid.
- A `429` usually means a provider rate or spending limit was reached.
- A model error means the model name in Settings does not exist for that endpoint. Check the provider's documentation and use **Test connection**.
- Confirm the key was created in the provider account linked above and that the account has available credit.

Never share API keys, private transcripts, or personal notes in chats, screenshots, or logs.

## Checks for coding agents

Ask your coding agent to run these commands after changing the project:

```bash
npm test
npm run check
npm run package
```

The agent should also reload the unpacked extension in Chrome and test several real YouTube videos. Automated checks do not prove that live provider requests and YouTube interactions work.

## License

MIT. See [LICENSE](LICENSE).
