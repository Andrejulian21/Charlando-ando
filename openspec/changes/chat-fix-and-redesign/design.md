# Design: Chat Fix and Redesign

## 1. Architecture Overview

### Before (Current)
```
Server ──hasMany──> Channel ──morphMany──> Message
  │                                              │
  └──> ChannelList ──> MessageList               │
  └──> MessageInput ────────> POST /api/servers/{s}/channels/{c}/messages
                                socketConnected=false → DISABLED
```

### After (Target)
```
Server ──morphMany──> Message
  │                        │
  └──> MessageList ────────│
  └──> MessageInput ───────> POST /api/servers/{s}/messages
                                socketConnected=false → ENABLED (REST fallback)
```

### Key Simplification
- **Removed**: Channel model from user-facing chat (kept in DB for rollback)
- **Removed**: ChannelList component from group chat view
- **Removed**: `disabled={!socketConnected}` from message composers
- **Added**: Server-level message endpoints
- **Added**: Public group directory with one-click join
- **Kept**: DMs unchanged (just socket fix)

## 2. Data Model Changes

### Server Model (`app/Models/Server.php`)
- `messages()` morph relation ALREADY EXISTS (line 52-55)
- No model changes needed — messages can morph to Server already
- Channel records kept in DB (soft-deleted), used only for rollback

### Message Model (`app/Models/Message.php`)
- No changes needed — polymorphic `messagable` already supports any model
- Migration will update `messagable_type` from `App\Models\Channel` → `App\Models\Server`
- Migration will update `messagable_id` from channel ID → server ID (via `channels.server_id`)

### MessageSent Event (`app/Events/MessageSent.php`)
- **CHANGE** (line 99-103): Add `Server::class` case to `room()` method:
```php
return match ($type) {
    Channel::class => "channel:{$id}",
    DirectMessage::class => "dm:{$id}",
    Server::class => "server:{$id}",
    default => '',
};
```

### Database Migrations
- `is_public` column already exists on `servers` table (seeded migration)
- No new schema migrations needed
- Migration is a DATA migration (Artisan command)

## 3. API Design

### New Endpoints

```
GET    /api/servers/{server}/messages           → MessageController@indexForServer
POST   /api/servers/{server}/messages           → MessageController@storeForServer
```

These mirror the existing channel message endpoints but target `Server` as the morphable.

### Modified Endpoints

```
GET    /api/servers                             → ServerController@index
       (add ?filter=public query param support)
```

When `filter=public` is set:
- Return servers where `is_public = true` AND user is NOT a member
- Include `member_count` and `owner` info

### Redirected Endpoints (Backward Compatibility)

```
GET    /api/servers/{s}/channels/{c}/messages   → 307 → GET  /api/servers/{s}/messages
POST   /api/servers/{s}/channels/{c}/messages   → 307 → POST /api/servers/{s}/messages
```

307 redirect preserves the HTTP method and request body.

### Public Group Directory

`GET /api/servers?filter=public` returns:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Laravel Devs",
      "description": "Un grupo para devs de Laravel",
      "icon_url": null,
      "owner": { "id": 1, "name": "Admin" },
      "member_count": 42
    }
  ]
}
```

### Invite System (unchanged)
- `POST /api/servers/{server}/invites` → creates invite code (already exists)
- `POST /api/invites/{code}/redeem` → joins server (already exists)
- Private groups NOT listed in public directory

## 4. Frontend Component Architecture

### 4.1 DM Socket Fix

**File**: `resources/js/components/Dm/DmChat.jsx` — lines 24-25
```diff
- const socketConnected = useChatStore((s) => s.socketConnected);
```
```diff
- <DmComposer dmId={dm.id} disabled={!socketConnected} />
+ <DmComposer dmId={dm.id} />
```

**File**: `resources/js/components/Dm/DmChat.jsx` — DmComposer component
```diff
- function DmComposer({ dmId, disabled }) {
+ function DmComposer({ dmId }) {
```
```diff
- disabled={disabled || sending}
+ disabled={sending}
- placeholder={disabled ? 'Conectando…' : 'Mensaje'}
+ placeholder={'Mensaje'}
```

**File**: `resources/js/pages/Chat/Show.jsx` — lines 32-33
```diff
- const socketConnected = useChatStore((s) => s.socketConnected);
```

**File**: `resources/js/pages/Chat/Show.jsx` — line 95
```diff
- <MessageInput serverId={server.id} channelId={channel.id} disabled={!socketConnected} />
+ <MessageInput serverId={server.id} channelId={channel.id} />
```

**File**: `resources/js/components/Chat/MessageInput.jsx` — line 10
```diff
- export default function MessageInput({ serverId, channelId, disabled = false }) {
+ export default function MessageInput({ serverId, channelId }) {
```
```diff
- disabled={disabled || sending}
+ disabled={sending}
- placeholder={disabled ? 'Conectando…' : `Mensaje en #${channelId}`}
+ placeholder={'Mensaje'}
```

### 4.2 Group Chat UI Changes

**File**: `resources/js/pages/Chat/Show.jsx`
```diff
- import ChannelList from '../../components/Chat/ChannelList';
```
```diff
- <ChannelList server={server} activeChannelId={channel?.id} />
```
- Remove `channel` from page props (no longer needed — use server-level messages)
- MessageList receives server-level `fetchUrl` instead of constructing from serverId + channelId

**File**: `resources/js/components/Chat/ServerSidebar.jsx` — lines 99-100
```diff
- href={`/chat/${server.id}`}
+ href={`/chat/${server.id}`}
```
(Already correct — no channel param needed)

**File**: `resources/js/pages/Chat/Index.jsx`
- Enhance the publicServers section (already renders public servers with Join button)
- Add member_count to each public server card
- Better styling for the directory grid

**File**: `resources/js/components/Chat/ChannelList.jsx`
- Keep component (used for other contexts or references)
- Hide in group chat view by passing `server={null}` or removing the import

### 4.3 MessageList Adaptation

**File**: `resources/js/components/Chat/MessageList.jsx` — lines 62-68

```diff
- const resolvedFetchUrl = useMemo(() => {
-     if (fetchUrl) return fetchUrl;
-     if (serverId != null && channelId != null) {
-         return `/api/servers/${serverId}/channels/${channelId}/messages`;
-     }
-     return null;
- }, [fetchUrl, serverId, channelId]);
+ const resolvedFetchUrl = useMemo(() => {
+     if (fetchUrl) return fetchUrl;
+     if (serverId != null) {
+         return `/api/servers/${serverId}/messages`;
+     }
+     return null;
+ }, [fetchUrl, serverId]);
```

## 5. Event Broadcasting

### MessageSent for Server::class

**File**: `app/Events/MessageSent.php` — room() method

```php
private function room(): string
{
    $type = $this->message->messagable_type;
    $id = $this->message->messagable_id;

    return match ($type) {
        Channel::class => "channel:{$id}",
        DirectMessage::class => "dm:{$id}",
        Server::class => "server:{$id}",
        default => '',
    };
}
```

### Frontend Subscription (stores/useChatStore.js)

The store already subscribes to rooms starting with `channel:` and `dm:`:
```js
if (room.startsWith('channel:') || room.startsWith('dm:')) {
```

**CHANGE**: Add `server:` prefix support:
```js
if (room.startsWith('channel:') || room.startsWith('dm:') || room.startsWith('server:')) {
```

## 6. Migration Design

### Artisan Command: `php artisan migrate:groups`

```php
class MigrateGroups extends Command
{
    protected $signature = 'migrate:groups {--rollback : Revert the migration}';

    public function handle()
    {
        if ($this->option('rollback')) {
            $this->rollback();
            return;
        }

        $this->migrate();
    }

    protected function migrate()
    {
        // 1. Check idempotency — skip if already migrated
        $migratedCount = Server::whereHas('channels', function ($q) {
            $q->whereNull('deleted_at');
        })->count();
        
        if ($migratedCount === 0) {
            // Means channels already soft-deleted (migration done)
            $this->warn('Already migrated. Nothing to do.');
            return;
        }

        // 2. For each server with channels
        Server::chunk(100, function ($servers) {
            foreach ($servers as $server) {
                $channelIds = $server->channels()->pluck('id');

                // 3. Re-parent messages: messagable_type + messagable_id
                Message::whereIn('messagable_id', $channelIds)
                    ->where('messagable_type', (new Channel)->getMorphClass())
                    ->update([
                        'messagable_type' => $server->getMorphClass(),
                        'messagable_id' => $server->id,
                    ]);

                // 4. Soft-delete channels
                $server->channels()->delete();
            }
        });

        $this->info('Migration complete.');
    }

    protected function rollback()
    {
        // 1. Restore soft-deleted channels
        Channel::onlyTrashed()->chunk(100, function ($channels) {
            foreach ($channels as $channel) {
                // 2. Re-parent messages back to channel
                Message::where('messagable_id', $channel->server_id)
                    ->where('messagable_type', (new Server)->getMorphClass())
                    ->where('user_id', '!=', 0) // all messages for this server
                    ->update([
                        'messagable_type' => (new Channel)->getMorphClass(),
                        'messagable_id' => $channel->id,
                    ]);

                $channel->restore();
            }
        });

        $this->info('Rollback complete.');
    }
}
```

**IMPORTANT**: The rollback logic needs to track the original channel_id per message. Consider adding a pivot table or a `_migrated_from_channel_id` column if precise rollback is critical. Alternative: take a DB backup before migration.

## 7. Route Changes

### Web Routes (`routes/web.php`)

```diff
- Route::get('/chat/{server}/{channel}', [PageController::class, 'chatShow'])
-     ->where(['server' => '[0-9]+', 'channel' => '[0-9]+'])
-     ->name('chat.show');
+ Route::get('/chat/{server}', [PageController::class, 'chatShow'])
+     ->where('server', '[0-9]+')
+     ->name('chat.show');
+ Route::get('/chat/{server}/{channel}', function ($server, $channel) {
+     return redirect("/chat/{$server}", 302);
+ })->where(['server' => '[0-9]+', 'channel' => '[0-9]+']);
```

### API Routes (`routes/api.php`)

```diff
- Route::get('servers/{server}/channels/{channel}/messages', [MessageController::class, 'index'])
-     ->name('api.channels.messages.index');
- Route::post('servers/{server}/channels/{channel}/messages', [MessageController::class, 'store'])
-     ->name('api.channels.messages.store');
+ Route::get('servers/{server}/messages', [MessageController::class, 'indexForServer'])
+     ->name('api.servers.messages.index');
+ Route::post('servers/{server}/messages', [MessageController::class, 'storeForServer'])
+     ->name('api.servers.messages.store');
+ // Legacy redirects
+ Route::get('servers/{server}/channels/{channel}/messages', function ($server, $channel) {
+     return redirect()->route('api.servers.messages.index', ['server' => $server], 307);
+ });
+ Route::post('servers/{server}/channels/{channel}/messages', function ($server, $channel) {
+     return redirect()->route('api.servers.messages.store', ['server' => $server], 307);
+ });
```

### ServerController Changes

```diff
public function index(Request $request): JsonResponse
{
    $userId = Auth::id();

+   if ($request->query('filter') === 'public') {
+       $publicServers = Server::query()
+           ->where('is_public', true)
+           ->whereDoesntHave('members', fn ($q) => $q->where('users.id', $userId))
+           ->withCount('members')
+           ->get(['id', 'name', 'description', 'icon_url', 'owner_id'])
+           ->load('owner:id,name');
+       return response()->json(['data' => $publicServers]);
+   }

    // Existing logic for user's servers
    // ...
}
```

## 8. PageController Changes

```diff
- public function chatShow(Request $request, Server $server, Channel $channel): Response
+ public function chatShow(Request $request, Server $server): Response
  {
-     $this->ensureChannelBelongsToServer($server, $channel);
      $this->ensureMember($request, $server);

      $messages = $server->messages()
          ->orderByDesc('id')
          ->limit(self::MESSAGE_PAGE_SIZE + 1)
          ->get(['id', 'user_id', 'content', 'edited_at', 'created_at']);

      $hasMore = $messages->count() > self::MESSAGE_PAGE_SIZE;
      if ($hasMore) { $messages = $messages->take(self::MESSAGE_PAGE_SIZE); }

-     $server->load([
-         'channels' => fn ($q) => $q->orderBy('position')->orderBy('id'),
-         'members:id,name,display_name,avatar_url,status',
-     ]);
+     $server->load(['members:id,name,display_name,avatar_url,status']);

      $userId = $request->user()->getAuthIdentifier();
      $otherServers = Server::query()
          ->where(function ($q) use ($userId) {
              $q->whereHas('members', fn ($q) => $q->where('users.id', $userId))
                ->orWhere('is_public', true);
          })
          ->whereKeyNot($server->id)
-         ->with(['channels' => fn ($q) => $q->orderBy('position')->orderBy('id')])
          ->orderBy('name')
          ->get();

      return Inertia::render('Chat/Show', [
          'server' => $server,
-         'channel' => $channel,
          'messages' => $messages->values(),
          'nextCursor' => $hasMore ? (int) $messages->last()->id : null,
          'members' => $server->members,
          'otherServers' => $otherServers,
      ]);
  }

- private function ensureChannelBelongsToServer(Server $server, Channel $channel): void
- {
-     if ((int) $channel->server_id !== (int) $server->id) {
-         throw new HttpException(404, 'Channel not found in this server.');
-     }
- }
```

## 9. Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Keep Channel model in DB | Enables rollback; existing data integrity; some queries may reference it |
| Soft-delete channels | Rollback-friendly; no data loss risk |
| 307 redirect for old API endpoints | Preserves HTTP method (POST stays POST); non-breaking for existing clients |
| 302 redirect for old web URLs | Standard browser redirect; old bookmarks still work |
| Keep roles/permissions in DB | Would break migrations and factories; just hide from UX |
| Server memberships unchanged | Works well for both public and private groups |
| Socket remains optional | REST is the source of truth; socket is for real-time delivery only |
| Single Artisan command | Simple, focused, reversible |

## 10. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Rollback may not restore exact channel-per-message mapping | Add `_migrated_from_channel_id` column to messages or take DB snapshot before migration |
| MessageSent broadcasts use old room format after migration | New messages use `Server::class` → `server:{id}` rooms. Old messages already sent. |
| Tests reference channel-level endpoints | Update tests to use server-level endpoints after migration |
| Users in old channel URLs see redirect | 302 redirect is seamless; they land on the group chat |
