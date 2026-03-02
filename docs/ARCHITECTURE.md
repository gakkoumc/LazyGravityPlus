# Architecture & Core Design

## 1. システム全体構成 / System Overview
LazyGravity は外部の中間サーバーを経由せず、ユーザーのローカルPC内で完結してDiscord/Telegram API とやり取りします。

```mermaid
graph TD
    A[📱 Discord アプリ] -->|WebSocket Gateway| B[🔒 Local PC - LazyGravity Bot]
    T[📱 Telegram アプリ] -->|Long Polling| B
    B -->|REST API| A
    B -->|Bot API| T

    subgraph Local Environment (Your PC)
        B -->|Platform Abstraction Layer| PA[PlatformAdapter]
        PA -->|CDP / WebSocket| C[Antigravity / AI Coding Agent]
        B -->|Read/Write| D[📁 Local Workspaces]
        B -.->|Secure Storage| E[.env File (Local)]
        B -.->|Persist State| F[SQLite Database]
    end
```

## 1.5. プラットフォーム抽象化レイヤー / Platform Abstraction Layer

コアロジックをプラットフォーム非依存にするため、抽象化レイヤーを導入。

```
src/platform/
├── types.ts              # 共通インターフェース (PlatformMessage, PlatformChannel, RichContent, etc.)
├── adapter.ts            # PlatformAdapter / PlatformAdapterEvents インターフェース
├── richContentBuilder.ts # イミュータブルビルダー (createRichContent → withTitle → addField → pipe)
├── discord/
│   ├── discordAdapter.ts # DiscordAdapter implements PlatformAdapter
│   └── wrappers.ts       # discord.js オブジェクト ↔ Platform 型の変換
└── telegram/
    ├── telegramAdapter.ts    # TelegramAdapter implements PlatformAdapter
    ├── telegramFormatter.ts  # Markdown → Telegram HTML 変換
    └── wrappers.ts           # Telegram オブジェクト ↔ Platform 型の変換
```

### 主要な共通型
- `PlatformMessage` — メッセージ（送信者、チャンネル、テキスト、添付ファイル）
- `PlatformChannel` — チャンネル/チャット（send で MessagePayload を送信）
- `RichContent` — Discord Embed / Telegram HTML の抽象化（title, description, fields, color, footer）
- `MessagePayload` — 送信内容（text + richContent + components + ephemeral）
- `PlatformButtonInteraction` / `PlatformSelectInteraction` — ボタン/セレクトメニューの抽象化

### イベントフロー
1. `PlatformAdapter.start(events)` でプラットフォーム固有イベントを登録
2. `EventRouter` が全プラットフォームからのイベントを統一ハンドラーに振り分け
3. プラットフォーム非依存の `messageHandler`, `buttonHandler`, `selectHandler`, `commandHandler` が処理
4. `WorkspaceQueue` がワークスペース単位でリクエストをシリアライズ（プラットフォーム横断）

## 2. 認証・セキュリティ設計
外部公開をしないためポートマッピングやWebhookは使用しません。

- **Bot TokenとAPI Keyの管理:**
  - `dotenv`パッケージを利用し、ローカルの `.env` ファイルに保存しますが、セキュリティを高めるため、**ファイルパーミッションを厳格化 (例: `chmod 600`)** することを推奨します（必要に応じてOSネイティブのクレデンシャル連携も検討）。
  - GitHub上には `.env.example` のみを提供し、機密情報の漏洩を防止します。
- **認可 (Authorization):**
  - **Discord**: `messageCreate`, `interactionCreate` イベントの冒頭で `allowedUserIds` ホワイトリストチェック。
  - **Telegram**: `EventRouter` が `telegramAllowedUserIds` で認証。未設定の場合は全ユーザーを拒否（warn ログ出力）。
  - プラットフォーム横断で `platform:userId` 形式の認証管理。
- **入力値の検証とパストラバーサル対策 (Directory Traversal Protection):**
  - ユーザー入力やワークスペース指定に対するディレクトリトラバーサル攻撃（例: `../../etc/passwd`）を防ぐため、基準となるルートディレクトリ（`WORKSPACE_BASE_DIR`）を定義し、すべてのパス解決がその配下に収まることを `path.resolve` 等を用いて厳格にバリデーションします。

## 3. プロジェクト管理（カテゴリ↔プロジェクト、チャンネル↔チャットセッション）
Discordの **カテゴリ = プロジェクト**、**チャンネル = チャットセッション** として管理します。

### 実装済みの機能
- **`/project`**: ベースディレクトリ配下のサブディレクトリ一覧（最大25件）をセレクトメニューで表示。選択するとカテゴリ + `session-1` チャンネルを自動作成しバインド。
- **`/new`**: 現在のプロジェクトカテゴリ配下に新しいセッションチャンネル（`session-N`）を作成し、Antigravityで新規チャットを開始。
- **`/chat`**: 現在のチャットセッション情報（セッション番号、プロジェクト、リネーム状態）と同プロジェクトの全セッション一覧を統合表示。
- **自動リネーム**: セッションチャンネルで初回メッセージ送信時、プロンプト内容からチャンネル名を自動生成してリネーム（例: `session-1` → `1-react認証バグ修正`）。

### データフロー
1. ユーザーが `/project` → セレクトメニューでプロジェクトを選択
2. `ChannelManager.ensureCategory()` でカテゴリを作成、`createSessionChannel()` で `session-1` チャンネルを作成
3. `WorkspaceBindingRepository` が `workspace_bindings` テーブルに channel_id ↔ workspace_path を永続化
4. `ChatSessionRepository` が `chat_sessions` テーブルにセッション情報（カテゴリID、セッション番号、リネーム状態）を永続化
5. `/new` → 同カテゴリ配下に `session-N` を新規作成 + Antigravityで新規チャット開始
6. 初回メッセージ送信時 → `TitleGeneratorService` がタイトル生成 → `ChannelManager.renameChannel()` でリネーム

### アーキテクチャ
```
src/database/workspaceBindingRepository.ts  — SQLite CRUD (workspace_bindings テーブル)
src/database/chatSessionRepository.ts       — SQLite CRUD (chat_sessions テーブル)
src/database/telegramBindingRepository.ts   — SQLite CRUD (telegram_bindings テーブル: chat_id ↔ workspace)
src/services/workspaceService.ts            — FS操作・パス検証 (scanWorkspaces, validatePath)
src/services/channelManager.ts              — Discord カテゴリ/チャンネル管理 (ensureCategory, createSessionChannel, renameChannel)
src/services/titleGeneratorService.ts       — チャンネル名自動生成 (CDP経由 + テキスト抽出フォールバック)
src/services/chatSessionService.ts          — Antigravity UI操作 (CDP経由で新規チャット開始・セッション情報取得)
src/commands/workspaceCommandHandler.ts     — /project コマンド + セレクトメニュー処理
src/commands/chatCommandHandler.ts          — /new, /chat コマンド
src/bot/telegramMessageHandler.ts           — Telegram メッセージ→CDP直接連携ハンドラー
src/bot/eventRouter.ts                      — マルチプラットフォームイベント振り分け + 認証
src/bot/workspaceQueue.ts                   — ワークスペース単位の排他キュー（プラットフォーム横断）
```

### 将来の拡展
- CDP経由でAntigravityのワークスペースを直接切り替え（現在はプロンプトプレフィックス方式）
- LLM APIによる高精度タイトル生成（現在はテキスト抽出ベース）

## 4. コンテキスト（文脈）の引継ぎ
LLMエージェントへの指示と実行結果を、Discordの「リプライチェーン」によって管理・永続化する。

- **Embedへのメタデータ埋め込み:**
  - 長いログや結果はEmbedに格納。
  - Embedの `Footer` や `Author URL` などの見えにくい部分、またはローカルのSQLiteにメッセージIDをキーとしたステートを保存し、対象のファイルパスや直前の指示履歴（タスクID）を保持。
- **リプライ(Reply)による後続指示:**
  - ユーザーがBotの出力したEmbedに対して「返信」を行った場合、Botは親メッセージに含まれるメタデータ（あるいはSQLiteから引いた文脈）を元に、「続きから作業している」状態として元のディレクトリとコンテキストをAntigravityに渡す。

## 5. 定期実行タスク (Cron / Scheduling) **※将来実装予定 (Coming Soon)**
- コードレベルでのバックエンドは実装が進んでいますが、Discordコマンドとの接合は今後のフェーズで対応予定です。
- ローカルPCの `node-cron` を使用。
- SQLiteでスケジュール設定を永続化（`id`, `cron_expression`, `prompt`, `workspace_id`, `status`）。
- Bot起動時にSQLiteから定義を読み込み、オンメモリのnode-cronに再スケジュールする機能が必要。

## 6. プログレスバーのリアルタイム更新
- Antigravityなどの裏側のAIエージェントのログやステータス出力（標準出力や特定フォーマットのログ）をストリームで監視する。
- 数秒（例: 3〜5秒）に一度だけDiscordのメッセージ編集API (`message.edit`) を叩き、Rate Limit（API制限）に引っかからないようDebounce/Throttle制御を強くかけること。

> **詳細:** ResponseMonitor による CDP ベースの応答監視・プロセスログ抽出の仕組みについては [RESPONSE_MONITOR.md](./RESPONSE_MONITOR.md) を参照。

## 7. Antigravity プロセスの起動方式 (CLI Spawn) とリソース制御
- **CLI Spawn:** Antigravity(または対象ディレクトリのAIコーディングツール)は、`child_process.spawn` を用いて、独立したバックグラウンドプロセスとして起動します。
- **排他制御とキューイング (Task Queue):** ローカルPCのリソース枯渇（DoS状態）を防ぐため、ワークスペース単位、または全体での同時実行タスク数を制限（Mutex/Queue）します。
- **強制終了機能 (Kill Switch):** 無限ループや暴走に備え、発行したプロセスのPIDを管理し、Discordからの中断コマンド (`/stop`) でプロセスツリーを強制終了（kill）できる仕組みを設けます。
- **Discord制限の回避 (Message Chunking):** Discordの文字数制限（通常2000文字、Embedで4096文字）を超える大量の出力に対しては、長文を分割送信する、またはテキストファイルとして添付送信するフォールバック機構を実装します。
