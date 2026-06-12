# Direct Message Specification

## Purpose

Enable authenticated users to create, list, message, and navigate direct message threads with other users.

## Requirements

| # | Requirement | Strength |
|---|-------------|----------|
| R1 | `POST /api/dms` with `{user_id}` creates or returns existing DM thread | MUST |
| R2 | DM thread MUST be unique per user pair — no duplicates | MUST |
| R3 | DM response includes the other user's id, name, display_name, avatar_url | MUST |
| R4 | `GET /api/dms` lists all DM threads for authenticated user | MUST |
| R5 | `GET /api/dms/{dm}/messages` returns paginated messages | MUST |
| R6 | `POST /api/dms/{dm}/messages` creates a message in the DM | MUST |
| R7 | Non-participant access to DM messages returns 403 | MUST |
| R8 | ServerSidebar MUST have a visible DM entry point | MUST |
| R9 | User MUST be able to switch between server chat and DM view | MUST |
| R10 | Clicking a search result SHOULD create or navigate to DM | SHOULD |
| R11 | Unauthenticated requests to any DM endpoint return 401 | MUST |

## Scenarios

### R1-R3: Create DM

#### Scenario: New DM thread

- GIVEN an authenticated user A
- WHEN `POST /api/dms` with `{user_id: 7}`
- THEN a new DM thread is created for users A and 7
- AND response includes user 7's id, name, display_name, avatar_url

#### Scenario: Existing DM returned

- GIVEN a DM thread exists between users A and B
- WHEN user A sends `POST /api/dms` with `{user_id: B}`
- THEN the existing DM is returned — no duplicate created

### R4: List DM Threads

#### Scenario: List threads

- GIVEN authenticated user with 3 DM threads
- WHEN `GET /api/dms`
- THEN returns all 3 threads with participant info

### R5-R7: DM Messages

#### Scenario: Read messages

- GIVEN authenticated user is participant in DM #5
- WHEN `GET /api/dms/5/messages?page=1`
- THEN returns paginated messages

#### Scenario: Send message

- GIVEN authenticated user is participant in DM #5
- WHEN `POST /api/dms/5/messages` with `{content: "Hello"}`
- THEN message is created with author info

#### Scenario: Forbidden access

- GIVEN authenticated user is NOT participant in DM #5
- WHEN attempting to read or send messages to DM #5
- THEN returns 403 Forbidden

### R8-R9: DM Navigation

#### Scenario: Open DMs from sidebar

- GIVEN authenticated user viewing a server channel
- WHEN clicking the DM button in ServerSidebar
- THEN the DM list view is displayed

#### Scenario: Switch back to server

- GIVEN authenticated user viewing a DM thread
- WHEN clicking a server channel in the sidebar
- THEN the server channel view is displayed

### R10: Search-to-DM

#### Scenario: Create DM from search

- GIVEN authenticated user viewing search results, no DM with that user
- WHEN clicking a user in search results
- THEN a DM is created and the UI navigates to it

#### Scenario: Navigate to existing DM from search

- GIVEN authenticated user viewing search results, `dm_exists: true` for that user
- WHEN clicking the user
- THEN the UI navigates to the existing DM thread

### R11: Authentication

#### Scenario: Unauthenticated request

- GIVEN no authentication token
- WHEN any DM endpoint is accessed
- THEN returns 401 Unauthorized
