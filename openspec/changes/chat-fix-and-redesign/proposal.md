# Proposal: Chat Fix and Redesign

## Intent
Fix the DM composer bug where message input is disabled when Socket.io is disconnected, and redesign group chats from a Discord-like server/channel model to a WhatsApp-like single-chat-per-group model for simplicity.

## Scope

### In Scope
- Remove `disabled={!socketConnected}` from DM and group chat composers
- Simplify group chat: one chat per group, no channels
- Public group directory with one-click join
- Private group invite links
- Migrate existing servers/channels/messages to new model

### Out of Scope
- DM feature redesign or UX changes beyond the socket fix
- Voice channels
- Roles and permissions system (kept in DB but not surfaced)
- Real-time socket infrastructure changes

## Capabilities

### New Capabilities
- `public-group-directory`: List public groups, allow authenticated users to join
- `private-group-invite`: Generate shareable invite links for private groups; redeem to join
- `group-message-rest-api`: POST/GET messages at server level instead of channel level

### Modified Capabilities
- `direct-message-composer`: Sending MUST NOT require socket connection
- `group-chat-composer`: Sending MUST NOT require socket connection; target changes from channel to server

## Approach
1. **DM fix**: Remove `disabled={!socketConnected}` prop from `DmComposer` and `MessageInput` components. Messages already send via REST; socket remains for real-time broadcast only.
2. **Group redesign**: Flatten server→channel hierarchy. Treat each server as a single chat. Add server-level message endpoints (`/api/servers/{server}/messages`). Update frontend to render server chat without channel list. Keep channel DB records hidden or migrate messages to server morph target.
3. **Migration**: Write an artisan command that iterates existing servers, moves channel messages to server-level `messagable`, deletes channel records, and preserves member lists.
4. **Public/private**: Leverage existing `is_public` column. Public servers listed on index page. Private servers require invite redemption via existing `Invite` system.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `resources/js/components/Dm/DmChat.jsx` | Modified | Remove `disabled={!socketConnected}` from `DmComposer` |
| `resources/js/pages/Chat/Show.jsx` | Modified | Remove `disabled={!socketConnected}` from `MessageInput` |
| `resources/js/components/Chat/MessageInput.jsx` | Modified | Remove `disabled` prop usage |
| `app/Http/Controllers/Servers/ServerController.php` | Modified | Add server-level message endpoints, public listing |
| `routes/api.php` | Modified | Add `/api/servers/{server}/messages` routes |
| `app/Models/Server.php` | Modified | Ensure `messages()` morph relation works for server-level |
| `database/migrations` | New | Migration command or data migration for existing servers |
| `resources/js/components/Chat/ServerSidebar.jsx` | Modified | Adapt to group model |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Data loss during migration | Low | Backup DB before migration; make migration reversible |
| Breaking existing server URLs | Med | Keep `/chat/{server}/{channel}` redirects or adapt routing |
| Users confused by channel disappearance | Med | Show single chat immediately; no channel UI |

## Rollback Plan
1. Revert frontend commits to restore channel UI
2. Restore channel routes and controllers
3. If migration ran, run reverse migration to restore channel records from backup

## Dependencies
- Existing `is_public` migration already applied
- Existing `Invite` model and controller available

## Success Criteria
- [ ] DM input works with Socket.io sidecar stopped
- [ ] Group chat shows single conversation per server
- [ ] Public groups visible and joinable without invite
- [ ] Private groups accessible only via invite link
- [ ] Existing server messages preserved after migration
- [ ] `php artisan test` passes
