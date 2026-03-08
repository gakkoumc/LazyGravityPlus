# LazyGravity Plus

> Antigravity を **Discord から快適に遠隔操作**するために作り直した、実運用向けフォーク版。

LazyGravity Plus は、Antigravity をローカルPCで動かしつつ、Discord から安全に操作できる bot です。  
このフォークは **Discord中心** で使う前提で、アカウント切替・DeepThink・運用性を強化しています。

---

## このフォークの方針

- Discord運用を最優先（Telegram はオプション扱い）
- 実務で困るポイント（誤接続・設定の揮発）を潰す
- チャネルごとに「どう使うか」を固定できる

---


## Download & Install Options

### 1) npm global install (recommended)

```bash
npm install -g lazy-gravity
lazy-gravity setup
```

### 2) npx (no install)

```bash
npx lazy-gravity
```

### 3) Download source ZIP from GitHub

1. Open the repository page.
2. Click **Code** → **Download ZIP**.
3. Extract and move to your workspace.
4. Run:

```bash
npm install
npm run build
npm run start
```


## Quick Setup
## 主な強化ポイント

### 1. Antigravity 複数アカウント対応
- `ANTIGRAVITY_ACCOUNTS` で複数インスタンス（port）を定義
- `/account [name]` でアカウント切替
- アカウント選択は **ユーザー単位 + チャネル単位** で保持
- ワークスペース接続時に安全なフォールバックを実施

### 2. DeepThink ループ
- `/loop [count]` でチャネルごとの推論深度を設定（1〜20）
- 設定値は永続化され、再起動後も維持
- 複雑タスクで「1回で終わる」問題を抑制

### 3. Discord 運用向け可視化
- `/status` で現在チャネルの `Account` / `DeepThink` を確認可能
- モード・接続・ミラー状態を1画面で把握

- Discord運用を最優先（Telegram はオプション扱い）
- 実務で困るポイント（誤接続・設定の揮発）を潰す
- チャネルごとに「どう使うか」を固定できる

---

## 主な強化ポイント

### 1. Antigravity 複数アカウント対応
- `ANTIGRAVITY_ACCOUNTS` で複数インスタンス（port）を定義
- `/account [name]` でアカウント切替
- アカウント選択は **ユーザー単位 + チャネル単位** で保持
- ワークスペース接続時に安全なフォールバックを実施

## Features

1. **Fully Local & Secure**
   - **No external server or port exposure** — runs as a local process on your PC, communicating directly with Discord/Telegram.
   - **Whitelist access control**: only authorized user IDs can interact with the bot (per-platform allowlists).
   - **Secure credential management**: Bot tokens and API keys are stored locally (never in source code).
   - **Path traversal prevention & resource protection**: sandboxed directory access and concurrent task limits prevent abuse.

2. **Multi-Platform Support**
   - **Discord** (default): Full feature set with slash commands, rich embeds, reactions, and channel management.
   - **Telegram** (optional): Send prompts, receive responses, and use inline keyboard buttons. Requires [grammy](https://grammy.dev/) (`npm install grammy`).
   - Run both platforms simultaneously from a single process, or use either one standalone.

3. **Project Management (Channel-Directory Binding)**
   - **Discord**: Use `/project` to bind a channel to a local project directory via an interactive select menu.
   - **Telegram**: Use `/project` to bind a chat to a workspace directory.
   - Messages sent in a bound channel/chat are automatically forwarded to Antigravity with the correct project context.

4. **Context-Aware Replies**
   - **Discord**: Results delivered as rich Embeds. Use Reply to continue the conversation with full context preserved.
   - **Telegram**: Results delivered as formatted HTML messages with inline keyboard buttons.

5. **Real-Time Progress Monitoring**
   - Long-running Antigravity tasks report progress as a series of messages (delivery confirmed / planning / analysis / execution / implementation / final summary).

6. **File Attachments & Context Parsing**
   - Send images (screenshots, mockups) or text files — they are automatically forwarded to Antigravity as context.

## Usage & Commands

### Natural Language Messages
Just type in any bound channel:
> `refactor the components under src/components. Make the layout look like yesterday's screenshot` (with image attached)

### Slash Commands

- `📂 /project list` — Browse projects via select menu; selecting one auto-creates a category and session channel
- `📂 /project create <name>` — Create a new project directory + Discord category/channel
- `💬 /new` — Start a new Antigravity chat session in the current project
- `💬 /chat` — Show current session info and list all sessions in the project
- `⚙️ /model [name]` — Switch the LLM model (e.g. `gpt-4o`, `claude-3-opus`, `gemini-1.5-pro`)
- `⚙️ /mode` — Switch execution mode via dropdown (`code`, `architect`, `ask`, etc.)
- `📝 /template list` — Display registered templates with execute buttons
- `📝 /template add <name> <prompt>` — Register a new prompt template
- `📝 /template delete <name>` — Delete a template
- `🔗 /join` — Join an existing Antigravity session (shows up to 20 recent sessions)
- `🔗 /mirror` — Toggle PC→Discord message mirroring for the current session
- `🛑 /stop` — Force-stop a running Antigravity task
- `📸 /screenshot` — Capture and send Antigravity's current screen
- `🔧 /status` — Show bot connection status, current mode, and active project
- `✅ /autoaccept [on|off|status]` — Toggle auto-approval of file edit dialogs
- `📝 /output [embed|plain]` — Toggle output format between Embed and Plain Text (plain text is easier to copy on mobile)
- `🧠 /loop [count]` — Set deep-think refinement loop count (1-20) for this channel
- `👤 /account [name]` — Show or switch Antigravity account
- `📋 /logs [lines] [level]` — View recent bot logs (ephemeral)
- `🏓 /ping` — Check bot latency
- `🧹 /cleanup [days]` — Scan and clean up inactive session channels (default: 7 days)
- `❓ /help` — Display list of available commands

### Telegram Commands

Telegram commands use underscores instead of subcommand syntax (Telegram does not allow hyphens or spaces in command names).

- `/project` — Manage workspace bindings (list, select, create)
- `/project_create <name>` — Create a new workspace directory
- `/new` — Start a new chat session
- `/template` — List prompt templates with execute buttons
- `/template_add <name> <prompt>` — Add a new prompt template
- `/template_delete <name>` — Delete a prompt template
- `/mode` — Switch execution mode
- `/model` — Switch LLM model
- `/screenshot` — Capture Antigravity screenshot
- `/autoaccept [on|off]` — Toggle auto-accept mode
- `/logs [count]` — Show recent log entries
- `/stop` — Interrupt active LLM generation
- `/status` — Show bot status and connections
- `/ping` — Check bot latency
- `/help` — Show available commands

### CLI Commands
## クイックスタート

### 2. DeepThink ループ
- `/loop [count]` でチャネルごとの推論深度を設定（1〜20）
- 設定値は永続化され、再起動後も維持
- 複雑タスクで「1回で終わる」問題を抑制

### 3. Discord 運用向け可視化
- `/status` で現在チャネルの `Account` / `DeepThink` を確認可能
- モード・接続・ミラー状態を1画面で把握

---

## クイックスタート

Node.js 18+ が必要です。

```bash
npm install -g lazy-gravity
lazy-gravity setup
lazy-gravity open
lazy-gravity start
```

このレポジトリをソースから使う場合（**このページの Code ボタンで表示されるURLを使用**）:

```bash
git clone <このリポジトリのURL>
ソースから使う場合:

```bash
git clone https://github.com/tokyoweb3/LazyGravityPlus.git
cd LazyGravityPlus
npm install
cp .env.example .env
```

Edit `.env` and fill in the required values:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
GUILD_ID=your_guild_id_here
ALLOWED_USER_IDS=123456789,987654321
WORKSPACE_BASE_DIR=~/Code
BOT_LANGUAGE=ja
ANTIGRAVITY_ACCOUNTS=default:9222,work:9333
# ANTIGRAVITY_PATH=/path/to/antigravity.AppImage  # Optional: For Linux users or custom installations
```

Then start the bot:

```bash
npm run build
npm run start
```

> 例: GitHub 上でこのリポジトリが `https://github.com/<your-account>/LazyGravityPlus` なら、
> `git clone https://github.com/<your-account>/LazyGravityPlus.git` を使います。

---


---

## 必須設定（.env）

```env
DISCORD_BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
ALLOWED_USER_IDS=123456789012345678
WORKSPACE_BASE_DIR=~/Code

# このフォーク推奨
BOT_LANGUAGE=ja
ANTIGRAVITY_ACCOUNTS=default:9222,work:9333
```

### `ANTIGRAVITY_ACCOUNTS` の例
- `default:9222` → 通常作業
- `work:9333` → 検証/別アカウント用

---

## Discord コマンド

- `/project list` — プロジェクト一覧
- `/project create <name>` — 新規プロジェクト作成
- `/new` — 新規チャットセッション
- `/chat` — セッション状態確認
- `/mode` — 実行モード切替
- `/model [name]` — モデル切替
- `/account [name]` — Antigravityアカウント確認/切替
- `/loop [count]` — DeepThink回数の確認/設定
- `/status` — 接続状態 + Account + DeepThink 表示
- `/stop` — 生成停止
- `/screenshot` — スクリーンショット取得
- `/logs [lines] [level]` — ログ確認
- `/help` — ヘルプ

---

## セキュリティ

- 外部公開サーバー不要（ローカル実行）
- 許可ユーザーIDで制御
- 設定はローカル保存

---

## 運用メモ

- まず `/account` と `/loop` をチャネルごとに設定すると安定します。
- 長文/難問タスクは `loop` を 3〜8 程度に上げると改善しやすいです。
- 反応が不安定なときは `/status` で Account と接続先を確認してください。

---

## NPM公開（フォーク運用者向け）

この fork を npm 公開したい場合は、まず以下を実施してください。

1. `package.json` の `name / repository / bugs / homepage / author` を fork 用に更新
2. 公開物チェック:

```bash
npm ci
npm run build
npm run test
npm run pack:check
```

3. 手動公開:

```bash
npm login
npm publish --access public
```

4. 自動公開を使う場合は `npm run release:dry-run` で事前確認

詳細は `docs/NPM_PUBLISHING.md` を参照。

## ライセンス

MIT
