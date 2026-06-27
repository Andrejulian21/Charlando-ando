# User Search Specification

## Purpose

Enable authenticated users to search for other users by name or email to initiate direct messages.

## Requirements

| # | Requirement | Strength |
|---|-------------|----------|
| R1 | `GET /api/users/search?q=term` returns matching users excluding the authenticated user | MUST |
| R2 | Search matches against name, display_name, and email fields | MUST |
| R3 | Results limited to max 20, returned fields: id, name, display_name, avatar_url | MUST |
| R4 | Minimum query length of 1 character | SHOULD |
| R5 | Case-insensitive matching | SHOULD |
| R6 | Empty query returns empty results, not all users | MUST |
| R7 | Unauthenticated requests return 401 | MUST |
| R8 | Results include `dm_exists` boolean per user | SHOULD |

## Scenarios

### R1-R6: Search Users

#### Scenario: Successful search

- GIVEN an authenticated user
- WHEN `GET /api/users/search?q=mar`
- THEN returns up to 20 users with id, name, display_name, avatar_url matching case-insensitively

#### Scenario: Auth user excluded

- GIVEN an authenticated user "alice@example.com"
- WHEN searching for "alice"
- THEN the authenticated user is NOT in results

#### Scenario: Empty query

- GIVEN an authenticated user
- WHEN `GET /api/users/search?q=`
- THEN returns empty array `[]`

#### Scenario: Single character query

- GIVEN an authenticated user
- WHEN `GET /api/users/search?q=a`
- THEN SHOULD perform the search normally

### R7: Authentication

#### Scenario: Unauthenticated request

- GIVEN no authentication token
- WHEN `GET /api/users/search?q=any`
- THEN returns 401 Unauthorized

### R8: DM Status

#### Scenario: Existing DM

- GIVEN auth user has DM thread with user #42
- WHEN user #42 appears in search results
- THEN `dm_exists` is `true`

#### Scenario: No DM

- GIVEN auth user has no DM thread with user #99
- WHEN user #99 appears in search results
- THEN `dm_exists` is `false`
