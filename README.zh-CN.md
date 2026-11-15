# YouTube Digest

[English](README.md) | [简体中文](README.zh-CN.md)

把每个 YouTube 视频变成一份可以深入学习的资料。YouTube Digest 把字幕、双语翻译、AI 概览、内容讲解和时间戳笔记放进同一个 Chrome 侧边栏，让你可以持续学习视频中的知识和语言，同时不丢失原视频上下文。

- 把零碎字幕变成清晰、可搜索的学习资料。
- 查看原文、简体中文翻译，或中英双语对照字幕来学习语言。
- 通过 AI 概览、章节、重点引用和选中文本讲解建立系统理解。
- 点击字幕、概览或笔记中的时间戳，快速跳转到对应位置。
- 保存自动润色的时间戳笔记，方便之后复习。
- 在“对话”标签里继续追问视频内容，并把整段对话导出保存。
- 使用自己的 API Key，数据保存在本地 Chrome 中，不包含分析统计或行为追踪。

YouTube Digest 是一个需要自行提供 API Key 的开源项目，通过 GitHub 安装。目前没有上架 Chrome 应用商店，不赠送 API 额度，也没有开发者运营的服务器。

点击查看演示和教学视频（小白友好）：[https://www.bilibili.com/video/BV1dnuq6dEak/](https://www.bilibili.com/video/BV1dnuq6dEak/)

![YouTube Digest 双语演示](YouTube%20Digest%20demo%20bilingual.png)

## v1.5.0 更新

- “对话”回答更精简、更好扫读：先直接回答，再用简短的加粗要点展开，每个要点最多引用一个可点击的 [M:SS] 时间戳，不再堆叠时间区间。输出上限为 2048 tokens。
- 对话里的时间戳可以点击：当前视频会直接跳转到对应位置；历史对话里的时间戳会在新标签页打开当时的视频并定位到该时间。
- 设置页新增 **仅使用免费字幕** 字幕来源，该模式绝不调用 Supadata、不消耗任何积分。免费字幕读取失败时，侧边栏会显示失败原因；**免费字幕优先** 仍会在有密钥时回退到 Supadata。

## v1.4.0 更新

- “对话”回答更深入：先给一句话结论，再分点展开，并尽量用 [M:SS] 引用字幕里的证据；补充的背景知识会标注为“背景补充”，字幕没有提到的内容会明确说明。模型会收到视频时长、链接、简介、已有概览，以及最多 6 万字的字幕，最多可输出 4096 tokens。
- AI 思考时显示三点跳动动画，界面不会看起来卡住。
- 对话按视频保存在本机：重新打开同一个视频，对话会自动恢复；换一个视频就是新对话。对话标签里的 **历史** 可以打开以前任意视频的对话（带视频链接）、删除对话，以及导出带链接的对话记录。
- 默认模型 `deepseek-v4-flash` 回答更快；想要更深入的分析，可以把 **模型名称** 改为 `deepseek-v4-pro`。

## v1.3.0 更新

- 默认免费读取视频自带的 YouTube 字幕，不需要第三方字幕服务，也不需要 API Key；Supadata 保留为可选备用来源。
- 设置页可以修改 AI 接口地址和模型名称，默认仍是 DeepSeek V4 Flash，也可以接入任何兼容 OpenAI 接口的服务。
- 新增“对话”标签：只引用当前视频，等你输入问题并发送后才回答，支持多轮对话，并可一键导出整段对话。
- 侧边栏顶部可以直接粘贴视频地址跳转到对应视频。

## v1.2.0 更新

- 搜索字幕中的单词或短语，并依次查看所有匹配位置。
- 在 Transcript、Overview 和 Notes 中共用 Original、中文和双语设置。新视频默认保持 Original，不会自动消耗翻译 token。
- 只翻译当前可见的 Overview 和 Notes 内容，并通过小批次渐进显示和缓存结果。
- 选中字幕后，可以直接讲解内容或保存带时间戳的笔记。
- 页面跳转后保留字幕阅读位置，并在离开 YouTube 视频页面时自动关闭侧边栏。

## 让你的编程 Agent 帮你安装

你不需要看懂代码，也不需要会使用命令行。把下面这段话发送给你的编程 Agent：

> 请把这个项目下载或克隆到我选择的长期保留文件夹，告诉我准确的完整路径，并让 Chrome“加载已解压的扩展程序”使用同一个文件夹。如果我在第一次安装时需要位置建议，可以推荐 macOS 或 Linux 上的 `~/Documents/youtube-digest`，或 Windows 上的 `%USERPROFILE%\Documents\youtube-digest`，但不要假设我一定使用这些路径。请用简单易懂的语言一步一步指导我完成安装和配置。https://github.com/zarazhangrui/youtube-digest

你的 Agent 应该帮你：

1. 先询问你想把项目长期保存在哪里，再下载或克隆到那里，并告诉你准确的完整路径。如果你需要建议，可以推荐 macOS 或 Linux 上的 `~/Documents/youtube-digest`，或 Windows 上的 `%USERPROFILE%\Documents\youtube-digest`。
2. 打开下方 DeepSeek 官方页面，指导你创建自己的账号。Supadata 账号是可选的，只有启用备用字幕服务时才需要。
3. 指导你在 Chrome 中通过“加载已解压的扩展程序”选择你刚才确定的那个准确项目文件夹。
4. 告诉你应该在扩展的“设置”页面哪个位置填写 API Key。
5. 打开一个带字幕的 YouTube 视频，确认字幕、翻译和对话功能可以使用。

安装后请让这个文件夹留在原位。如果移动或删除它，Chrome 中加载的本地扩展会失效，需要从新的长期存放位置重新加载。

不要把 API Key 发送到 AI 对话、源代码、截图或公开消息中。请你自己在 YouTube Digest 的设置页面直接填写。编程 Agent 可以告诉你填写位置，但不需要看到 Key。

## 手动安装

如果你想自己操作：

1. 打开 [github.com/zarazhangrui/youtube-digest](https://github.com/zarazhangrui/youtube-digest)。
2. 点击 **Code**，再选择 **Download ZIP**。
3. 选择一个长期保留的文件夹，并把项目解压到这里。可选建议是 macOS 或 Linux 上的 `~/Documents/youtube-digest`，或 Windows 上的 `%USERPROFILE%\Documents\youtube-digest`。你也可以使用其他文件夹。
4. 在 Chrome 地址栏打开 `chrome://extensions`。
5. 打开右上角的“开发者模式”。
6. 点击“加载已解压的扩展程序”。
7. 选择你刚才确定的那个准确项目文件夹，其中必须包含 `manifest.json`。
8. 如果需要，可以在 Chrome 扩展菜单中固定 YouTube Digest。

这是一个本地加载的扩展，不会自动更新。下载新版或让 Agent 修改代码后，请在 `chrome://extensions` 中找到 YouTube Digest 并点击“重新加载”，然后刷新已经打开的 YouTube 页面。如果移动或删除源代码文件夹，Chrome 中加载的扩展会失效，需要从新的位置重新加载。

## 设置 API Key

YouTube Digest 默认免费读取视频自带的 YouTube 字幕，所以获取字幕不需要 Key。下面两个 Key 都是可选的，并且使用你自己的服务账号：

1. **Supadata API Key** 是可选备用方案，用于页面无法交出字幕的视频。
2. **AI API Key**（默认 DeepSeek）用于生成概览、讲解内容、翻译、自动润色笔记和“对话”标签。

不填 Supadata Key 也可以正常使用。不填 AI Key 时，免费字幕和翻译缓存仍然可用，但 AI 功能会提示你先添加 Key。

### 获取 Supadata API Key（可选）

1. 打开 Supadata 官方[注册页面](https://dash.supadata.ai/auth/sign-up)。
2. 创建账号并完成简短的新手引导。
3. Supadata 会在新手引导过程中自动生成 API Key。
4. 之后可以随时打开 [Supadata 控制台](https://dash.supadata.ai/)查找或管理 Key。
5. 复制 Key，并粘贴到 YouTube Digest 设置中的 **Supadata API 密钥**。
6. 把 **字幕来源** 设为 **自动（优先免费字幕）**，让它只在免费字幕失败时使用；或设为 **Supadata** 强制使用该服务。

如果页面流程发生变化，请查看 [Supadata 官方文档](https://docs.supadata.ai/)。

### 获取 DeepSeek API Key

1. 打开 DeepSeek 官方 [API Keys 页面](https://platform.deepseek.com/api_keys)。
2. 按照提示登录，或创建 DeepSeek 开放平台账号。
3. 点击 **Create new API key**，填写容易识别的名称，例如 `YouTube Digest`，然后创建 Key。
4. 立即复制 Key。完整 Key 可能只会显示一次。
5. 把 Key 粘贴到 YouTube Digest 设置中的 **AI API 密钥**。
6. 如果 DeepSeek 提示余额不足，请在 DeepSeek 开放平台账号中充值后再试。

当前账号和接口说明请查看 [DeepSeek 官方 API 文档](https://api-docs.deepseek.com/)。

在侧边栏中打开 **Settings**。你也可以在 `chrome://extensions` 的 YouTube Digest 卡片中打开扩展选项。Key 只能粘贴到这些设置输入框中。不要把 Key 发送到 AI 对话、项目文件、截图或公开消息中。

默认 AI 配置是 DeepSeek V4 Flash：

```text
Base URL: https://api.deepseek.com
Model: deepseek-v4-flash
```

设置页中的 **AI 接口地址** 和 **模型名称** 都可以修改，因此你可以接入任何兼容 OpenAI 接口的服务（例如自建网关或其他模型服务），并填写该服务的模型名称。修改后点 **测试连接** 验证 Key、地址和模型是否可用。DeepSeek 官方地址当前接受 `deepseek-v4-flash`（默认）、`deepseek-flash`、`deepseek-v4-pro` 等模型名；如果填了其他名字，测试连接会提示找不到模型，这时修改 **模型名称** 即可。DeepSeek 专用的请求字段只会发送给官方 `https://api.deepseek.com` 地址，其他兼容服务不会收到它们可能拒绝的参数。使用自定义地址时，Chrome 会询问一次是否允许访问该域名。

API Key 和设置保存在你设备上的 Chrome 扩展本地存储中。发布包不会包含或使用 `config.js`。

## 使用 YouTube Digest

1. 打开一个有字幕的普通 YouTube 视频页面。
2. 点击 YouTube Digest 扩展图标，打开侧边栏。
3. 阅读带时间戳的字幕，或选择 **Original**、**中文**、**双语**。
4. 打开 **Overview**，查看 AI 生成的章节和重点引用。
5. 选中字幕，获取 AI 内容讲解。
6. 从播放器或重点引用中保存笔记，之后可以在 **Notes** 中查看。

7. 打开 **对话**，输入你想问的问题。在你发送之前，这个标签只引用当前视频，不会自动请求或总结。对话会按视频保存在本机：重新打开该视频即可继续，也可以点 **历史** 回到以前的对话。点 **导出对话** 可以把整段对话（含视频链接）下载为文本文件。
8. 在顶部输入框粘贴视频地址并回车，可以直接跳转到那个视频。

## 当前支持范围

- Chrome 116 或更高版本。
- 标准的 `youtube.com/watch` 视频页面。
- 默认免费解析视频自带的 YouTube 字幕；配置 Supadata 后可作为备用来源。
- 原文、简体中文和双语对照字幕。
- AI 概览、选中文本讲解、翻译、自动润色笔记，以及自由提问的“对话”标签。
- 本地笔记、对话记录，以及最近字幕、概览和翻译的本地缓存。
- 默认使用 DeepSeek V4 Flash。接口地址和模型名称都可以修改，也可以接入其他兼容 OpenAI 接口的服务。

Shorts、直播、私密视频、受访问限制的视频，以及没有字幕轨的视频可能无法使用。目前没有测试 Firefox、Safari、移动浏览器或其他 Chromium 浏览器。

免费字幕路径失败时，YouTube Digest 会先向页面请求它自己的字幕轨，只有在配置了 Key 时才回退到 Supadata。它不会请求 AI 生成转录，也不会在本地转录音频。

## Supadata 免费额度和请求成本

从 v1.3.0 起 Supadata 是可选的。免费字幕路径使用视频自带的字幕，大多数情况不产生费用。下面这些说明只在启用备用服务时适用。

截至 2026 年 8 月 9 日，[Supadata 价格页面](https://supadata.ai/pricing)显示免费版每月提供 **100 credits**，不需要信用卡，未使用的额度不会结转。价格可能变化，使用前请查看最新页面。

[Supadata 字幕接口文档](https://docs.supadata.ai/get-transcript)说明了不同模式的计费方式：

- 获取一次原生字幕消耗 **1 credit**，与视频时长无关。
- AI 生成字幕每分钟消耗 **2 credits**。YouTube Digest 不会使用这条路径，因为它强制使用 `mode=native`。
- 如果没有可用原生字幕并返回 HTTP `206`，仍会消耗 **1 credit**。

按照当前只获取原生字幕的方式，如果每次请求都成功，免费版每月大约可以查询 100 个视频。由于默认先走免费字幕路径，这 100 credits 只会用在页面无法交出字幕的视频上。重试和没有字幕的查询也会消耗额度，所以实际成功数量可能更少。

AI 的额度与 Supadata 分开计算，由你配置的服务商计费。YouTube Digest 不收款，也不转售 API 服务。建议为自己的账号设置消费上限并定期查看用量。

## AI 服务价格（默认 DeepSeek V4 Flash）

默认使用 DeepSeek V4 Flash。截至 2026 年 8 月 27 日，DeepSeek 官方[价格页面](https://api-docs.deepseek.com/quick_start/pricing/)列出的每 100 万 token 美元价格如下：

| Token 类型 | 非高峰 | 高峰 |
| --- | ---: | ---: |
| 缓存命中输入 | $0.007 | $0.014 |
| 缓存未命中输入 | $0.22 | $0.44 |
| 输出 | $0.66 | $1.32 |

高峰时段为周一至周五 UTC 01:00–04:00 和 06:00–10:00，其他时间使用非高峰价格。

一个实测的 20 分钟英文视频使用约 **32,600 个输入 token**，并在 43 个小批次中产生约 **3,500 到 4,500 个输出 token**。按当前价格，完整翻译该视频的费用约为：

- **非高峰：$0.003 到 $0.010 USD**。
- **高峰：$0.005 到 $0.020 USD**。

低值假设大部分重复输入命中 DeepSeek 缓存，高值假设输入未命中缓存。翻译按需执行并复用缓存，只翻译部分视频时费用会更低。使用前请查看官方页面确认最新价格。

## 用编程 Agent 改造成自己的版本

这是一个个人 Remix 项目，不接受上游 Issue 或 Pull Request。如果功能出错，或者你想增加新功能，请下载或 Fork 自己的副本，再让你的编程 Agent 帮你修复、改造和个性化。

YouTube Digest 使用原生 HTML、CSS 和 JavaScript，没有构建步骤，很适合用编程 Agent 做个人项目。你可以尝试：

- 增加更多翻译语言，并让每个人选择自己的学习语言。
- 为课程、访谈、教程、测评或研究视频增加自定义总结模板。
- 增加生词本，保存单词、原句、解释和视频时间戳。
- 把笔记和生词导出到 Markdown、CSV、Anki 或其他学习工具。
- 增加个人主题筛选，只突出与你目标相关的章节。
- 增加本地模型选项，获得不同的隐私和成本方案。
- 改善键盘操作、字体大小和高对比度等无障碍体验。

请让 Agent 保留用户自带 API Key 的模式，不要把秘密写入源代码，并运行下方检查。分享自己的版本前，也要在真实视频上测试。

如果想使用其他 AI 服务或模型，直接在设置页修改 **AI 接口地址** 和 **模型名称**，再填写该服务的 Key 并点 **测试连接** 即可。设置页中的安全自定义 prompt 仍然保留，用于更深入的本地改造：交给编程 Agent 处理你自己的本地副本，但不要加入任何 API Key。

## 隐私和数据流向

YouTube Digest 会直接从扩展发送请求：

1. 默认在 YouTube 页面内读取视频自带的字幕，字幕不会离开你的浏览器。
2. 如果启用 Supadata 备用服务，会把标准化的 YouTube 视频地址发送给 Supadata 获取原生字幕。
3. 当你使用 AI 功能（包括“对话”标签）时，把字幕和相关视频信息发送给你配置的 AI 接口。
4. 翻译或讲解等功能只发送当前需要的内容，例如选中的文本和上下文，或少量字幕分段。
5. API Key、设置、笔记、对话记录和最近缓存保存在 Chrome 本地。

YouTube Digest 没有账号系统、广告、分析统计或行为追踪。Supadata 和你配置的 AI 服务商仍会按照各自的条款和隐私政策处理数据。详情请查看 [PRIVACY.md](PRIVACY.md)。

## 常见问题

### YouTube 视频页面没有显示 Digest 按钮

- 在 `chrome://extensions` 中找到 YouTube Digest，点击“重新加载”，然后刷新 YouTube 页面。
- 确认当前页面是标准 `https://www.youtube.com/watch?...` 页面，而不是 Shorts、嵌入页面或直播页面。
- 当前版本会在 YouTube 响应式操作栏变化时自动重新定位按钮。页面加载完成后可以稍等片刻。
- 如果你使用的是较早下载的版本，可以先横向调整一次 YouTube 窗口宽度让按钮出现，然后下载最新版，这样之后不再需要调整窗口。
- 如果按钮仍然没有出现，让你的编程 Agent 在这个具体视频页面检查 content script。

### 侧边栏无法打开

- 确认你打开的是标准 `https://www.youtube.com/watch?...` 页面。
- 在 `chrome://extensions` 中确认 YouTube Digest 已启用，并点击“重新加载”。
- 重新加载扩展后，刷新 YouTube 页面。
- 如果问题仍然存在，让你的编程 Agent 检查扩展。

### YouTube Digest 提示需要设置

- 打开 **Settings**，保存 AI API Key（Supadata Key 只在启用兜底字幕服务时才需要）。
- 默认地址和模型是 DeepSeek V4 Flash，**AI 接口地址** 和 **模型名称** 都可以修改，改完点 **测试连接** 验证。
- 如果设置提示旧的自定义服务已移除，请重新填写你要使用的 AI Key。旧 AI Key 已安全清除，避免被错误用于新的服务。

### 界面是新的，但测试连接、对话或免费字幕不生效

- 这说明后台服务仍在运行旧代码。打开 `chrome://extensions`，在 YouTube Digest 卡片上点击“重新加载”，然后刷新 YouTube 页面再试。
- 之后打开侧边栏设置检查：**模型名称** 必须是服务支持的模型名（DeepSeek 官方可用 `deepseek-v4-flash`、`deepseek-flash`、`deepseek-v4-pro`）。
- 字幕标签的「字幕来源」会显示本次用的是 **YouTube 自带** 还是 **Supadata**。如果显示 Supadata，说明免费字幕这一次没有读到，已按设置回退。

### 找不到字幕

- 确认视频是公开的，并且有原生字幕。
- 检查 Supadata Key、剩余额度、限速和账号状态。
- 没有字幕的查询和手动重试也可能消耗额度。

YouTube Digest 不会自动改用 AI 生成字幕。

### AI 请求失败

- `401` 或 `403` 通常表示 DeepSeek Key 或账号权限有问题。
- `429` 通常表示达到了 DeepSeek 服务限速或消费上限。
- 确认 Key 来自上方链接的 DeepSeek 开放平台账号，并且账号有可用额度。
- 如果你把本地副本改成了其他模型，请再次使用设置中的自定义 prompt，让编程 Agent 检查本地实现。

不要在对话、截图或日志中分享 API Key、私密字幕或个人笔记。

## 给编程 Agent 的检查命令

修改项目后，让你的编程 Agent 运行：

```bash
npm test
npm run check
npm run package
```

Agent 还应该在 Chrome 中重新加载扩展，并测试多个真实 YouTube 视频。自动检查通过，不代表真实服务请求和 YouTube 交互一定正常。

## 开源许可

MIT，详见 [LICENSE](LICENSE)。
