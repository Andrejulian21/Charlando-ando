# Tasks: Chat Fix and Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: DM Socket Fix

- [ ] 1.1 `Dm/DmChat.jsx` — Remove `socketConnected` selector (line 24), remove `disabled` prop from `<DmComposer>` (line 78), remove `disabled` param from `DmComposer` signature (line 83), change `disabled={disabled \|\| sending}` to `disabled={sending}` (line 132), update placeholder (line 133)
- [ ] 1.2 `Chat/MessageInput.jsx` — Remove `disabled` default prop (line 10), change `disabled={disabled \|\| sending}` to `disabled={sending}` (line 67), update placeholder (line 68)
- [ ] 1.3 `Chat/Show.jsx` — Remove `socketConnected` selector (line 31), remove `disabled={!socketConnected}` from `<MessageInput>` (line 95)
- [ ] 1.4 Run `php artisan test` + `npx vitest run` to verify input always enabled

## Phase 2: Server-Level Message API

- [ ] 2.1 `MessageController.php` — Add `indexForServer(Server $server)` (queries `$server->messages()`) and `storeForServer(Request, Server $server)` (associates to Server, dispatches MessageSent) — ~40 lines
- [ ] 2.2 `routes/api.php` — Add `GET|POST servers/{server}/messages` routes pointing to new methods; add 307 redirect stubs for old `channels/{channel}/messages` routes
- [ ] 2.3 `Events/MessageSent.php` — Add `Server::class => "server:{$id}"` case to `room()` match (line 99)
- [ ] 2.4 `stores/useChatStore.js` — Add `\|\| room.startsWith('server:')` to `_listenToRoom` condition (line 234)

## Phase 3: PageController + Route Changes

- [ ] 3.1 `PageController.php` — Change `chatShow()` signature to accept only `Server $server` (no Channel). Remove `ensureChannelBelongsToServer`. Query `$server->messages()` instead of `$channel->messages()`. Remove channels eager-load, keep members only. Remove `channel` from Inertia props.
- [ ] 3.2 `routes/web.php` — Change `/chat/{server}/{channel}` to `/chat/{server}` as primary route; add 302 redirect for old `/chat/{server}/{channel}` URLs
- [ ] 3.3 `ServerController.php` — Add `?filter=public` support to `index()`: return public servers user hasn't joined, with `member_count` and `owner` load

## Phase 4: Frontend Group Chat

- [ ] 4.1 `Chat/Show.jsx` — Remove `ChannelList` import and `<ChannelList>` render. Change room from `channel:${channel.id}` to `server:${server.id}`. Remove `channelId` props from `<MessageList>` and `<MessageInput>`. Remove channel from page props destructuring.
- [ ] 4.2 `Chat/MessageList.jsx` — Update `resolvedFetchUrl` to use only `serverId` (remove `channelId` dependency, line 62-68)
- [ ] 4.3 `Chat/Index.jsx` — Enhance publicServers section: add member count, owner name, better card styling with grid layout. Keep existing Join button behavior.

## Phase 5: Migration Command

- [ ] 5.1 Create `app/Console/Commands/MigrateGroups.php` — `migrate:groups` re-parents channel messages to `Server`, soft-deletes channels; `--rollback` restores. Run `php artisan migrate:groups` and test with `--rollback`.

## Phase 6: Tests

- [ ] 6.1 Add `tests/Feature/ServerMessageTest.php` — test `indexForServer` (cursor pagination, member-only), `storeForServer` (201, 403 for non-member). Follow existing test patterns (`RefreshDatabase`, `actingAs`).
- [ ] 6.2 Add `tests/Feature/PublicGroupDirectoryTest.php` — test `GET /api/servers?filter=public` returns only unjoined public servers with `member_count`, excludes private, shows Join button state.
- [ ] 6.3 Add `tests/Feature/MigrateGroupsTest.php` — test migrate + rollback idempotency, message re-parenting, channel soft-delete. Run `php artisan test` to verify all pass.
