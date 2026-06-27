# Delta Spec: Chat Fix and Redesign

## ADDED Requirements

### Requirement: Server-Level Message API
Server messages SHALL be addressed at `/api/servers/{server}/messages` (no channel nesting). Messages morph to `Server`, not `Channel`. `MessageSent` MUST broadcast to room `server:{server.id}`.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | List messages | Member of server 5 | GET `/api/servers/5/messages?cursor=N` | 200, paginated messages DESC, `next_cursor` in response |
| 2 | Send message | Member of server 5 | POST `/api/servers/5/messages` `{content:"hi"}` | 201, message persisted with `messagable_type=App\Models\Server`, `MessageSent` broadcasts to `server:5` |
| 3 | Non-member blocked | Not a member | POST `/api/servers/5/messages` | 403 |

### Requirement: Public Group Directory
`GET /api/servers?filter=public` MUST list public servers the user has not joined. Each entry SHALL include `id, name, description, icon_url, owner` and `member_count`. Frontend `/chat` page SHALL render these in a browseable grid with a one-click **Join** button per group.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Browse public groups | Authenticated user, 3 public groups exist | User visits `/chat` (no server selected) | Sees 3 public groups with name, description, icon, owner, member count |
| 2 | Join public group | User not member of public server | Clicks Join → POST `/api/servers/{id}/join` | 200, user added as member, group moves to "My Servers" |
| 3 | Already member | User is member of public server | Server is viewed in directory | Join button is hidden or shows "Joined" (disabled) |

### Requirement: Private Group Invite Links
Server owner SHALL generate invite links at `POST /api/servers/{server}/invites`. The invite URL format SHALL be `{base}/invite/{code}`. Visiting `/invite/{code}` MUST display group info and a **Join** button that calls `POST /api/invites/{code}/redeem`. Private groups MUST NOT appear in the public directory.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Generate invite | Owner of private server | POST `/api/servers/5/invites` | 201, returns `{code, expires_at, max_uses}` |
| 2 | Redeem invite | Auth user with valid code | Visits `/invite/AbCdEf12` → sees group card → clicks Join | 201, user becomes member, redirected to group chat |
| 3 | Invite not found | Invalid code | POST `/api/invites/bogus/redeem` | 422 with error message |
| 4 | Private group hidden | Private server exists | GET `/api/servers?filter=public` | Private server NOT in response |

### Requirement: Migration Command
`php artisan migrate:groups` SHALL preserve all data: servers, members, and messages. Channel messages MUST be re-parented to `messagable_type=Server, messagable_id={server_id}`. Channel records MUST be soft-deleted. Member lists MUST remain untouched. The command SHALL be reversible via `php artisan migrate:groups --rollback`.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Migrate single server | Server with 3 channels, 50 messages | `php artisan migrate:groups` | All 50 messages have `messagable_type=Server`, channels soft-deleted, members unchanged |
| 2 | Rollback | Migration completed | `php artisan migrate:groups --rollback` | Channel soft-deletes restored, messages re-parented to original channels |
| 3 | Idempotent | Already migrated | Run command again | No-op, reports "already migrated" |

## MODIFIED Requirements

### Requirement: Composer Input Always Enabled
Message composers MUST NOT require a Socket.io connection. Sending uses REST; the socket provides real-time delivery only. Messages submitted while disconnected SHALL be sent via REST normally.

(Previously: `DmComposer` and `MessageInput` received `disabled={!socketConnected}`, blocking input when the socket was disconnected.)

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | DM with socket disconnected | Socket.io sidecar stopped, user opens DM | User types and presses Enter | Message sent via REST, 201 response. Input remains enabled throughout. |
| 2 | DM with socket connected | Socket connected | User sends DM | Message sent via REST AND broadcast via socket for real-time receipt |
| 3 | Group chat with socket disconnected | Socket.io stopped, user in group chat | User types and presses Enter | Message sent via REST, 201. Input never disabled. |

### Requirement: Group Chat Routes Simplified
Web route `/chat/{server}` SHALL render the group chat directly (no channel param). `/chat/{server}/{channel}` SHALL redirect (302) to `/chat/{server}`. API route `servers/{server}/channels/{channel}/messages` SHALL redirect (307) to `servers/{server}/messages`.

(Previously: URLs required a channel ID; chat page rendered a channel list and channel-scoped messages.)

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1 | Navigate to group | User visits `/chat/5` | Page loads | Renders single chat, no channel list sidebar |
| 2 | Old URL redirect | User has bookmarked `/chat/5/2` | Visits URL | 302 redirect to `/chat/5` |
| 3 | Old API redirect | Client POSTs to `/api/servers/5/channels/2/messages` | Request | 307 redirect to `/api/servers/5/messages` |
| 4 | Server sidebar adapts | Servers present in sidebar | Click server icon | Links to `/chat/{server.id}` (no channel) |

## REMOVED Requirements

### Requirement: Channel-Level Message Endpoints
(Reason: Channels are flattened into server-level conversations. All messaging targets servers.)
(Migration: Old POST endpoints redirect 307; old GET endpoints redirect 307. Channel DB records soft-deleted post-migration.)
