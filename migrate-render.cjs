const { Client } = require('pg');

const client = new Client({
  host: 'dpg-d92mocnaqgkc73fd0o80-a.oregon-postgres.render.com',
  port: 5432,
  database: 'charlando_ando_db',
  user: 'charlando_ando_db_user',
  password: 'GXDmRHpkqIEYrD3xtso6mywdMGNfyxGy',
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  `CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration VARCHAR(255) NOT NULL,
    batch INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
  )`,
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS sessions_last_activity_index ON sessions(last_activity)`,
  `CREATE TABLE IF NOT EXISTS cache (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    expiration INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS cache_locks (
    key VARCHAR(255) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    expiration INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    queue VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    attempts SMALLINT NOT NULL,
    reserved_at INTEGER NULL,
    available_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS jobs_queue_index ON jobs(queue)`,
  `CREATE TABLE IF NOT EXISTS job_batches (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_jobs INTEGER NOT NULL,
    pending_jobs INTEGER NOT NULL,
    failed_jobs INTEGER NOT NULL,
    failed_job_ids TEXT NOT NULL,
    options TEXT NULL,
    cancelled_at INTEGER NULL,
    created_at INTEGER NOT NULL,
    finished_at INTEGER NULL
  )`,
  `CREATE TABLE IF NOT EXISTS failed_jobs (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    connection TEXT NOT NULL,
    queue TEXT NOT NULL,
    payload TEXT NOT NULL,
    exception TEXT NOT NULL,
    failed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(255) NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255) NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) NULL`,
  `CREATE INDEX IF NOT EXISTS users_provider_provider_id_index ON users(provider, provider_id)`,
  `CREATE TABLE IF NOT EXISTS servers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(255) NULL,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
  )`,
  `CREATE INDEX IF NOT EXISTS servers_owner_id_index ON servers(owner_id)`,
  `CREATE TABLE IF NOT EXISTS channels (
    id BIGSERIAL PRIMARY KEY,
    server_id BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL DEFAULT 'text',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
  )`,
  `CREATE INDEX IF NOT EXISTS channels_server_id_index ON channels(server_id)`,
  `CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    channel_id BIGINT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
  )`,
  `CREATE INDEX IF NOT EXISTS messages_channel_id_index ON messages(channel_id)`,
  `CREATE INDEX IF NOT EXISTS messages_user_id_index ON messages(user_id)`,
  `CREATE TABLE IF NOT EXISTS direct_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
  )`,
  `CREATE INDEX IF NOT EXISTS direct_messages_sender_id_index ON direct_messages(sender_id)`,
  `CREATE INDEX IF NOT EXISTS direct_messages_receiver_id_index ON direct_messages(receiver_id)`,
  `CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    server_id BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(255) NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
  )`,
  `CREATE INDEX IF NOT EXISTS roles_server_id_index ON roles(server_id)`,
  `CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
  )`,
  `CREATE TABLE IF NOT EXISTS role_permission (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
  )`,
  `CREATE TABLE IF NOT EXISTS server_members (
    id BIGSERIAL PRIMARY KEY,
    server_id BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NULL REFERENCES roles(id) ON DELETE SET NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE(server_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS server_members_server_id_index ON server_members(server_id)`,
  `CREATE INDEX IF NOT EXISTS server_members_user_id_index ON server_members(user_id)`,
  `CREATE TABLE IF NOT EXISTS channel_overrides (
    id BIGSERIAL PRIMARY KEY,
    channel_id BIGINT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    role_id BIGINT NULL REFERENCES roles(id) ON DELETE CASCADE,
    user_id BIGINT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
  )`,
  `CREATE INDEX IF NOT EXISTS channel_overrides_channel_id_index ON channel_overrides(channel_id)`,
  `CREATE TABLE IF NOT EXISTS channel_override_permission (
    channel_override_id BIGINT NOT NULL REFERENCES channel_overrides(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (channel_override_id, permission_id)
  )`,
  `CREATE TABLE IF NOT EXISTS invites (
    id BIGSERIAL PRIMARY KEY,
    server_id BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    code VARCHAR(255) NOT NULL UNIQUE,
    max_uses INTEGER NULL,
    uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NULL,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
  )`,
  `CREATE INDEX IF NOT EXISTS invites_server_id_index ON invites(server_id)`,
  `CREATE INDEX IF NOT EXISTS invites_code_index ON invites(code)`,
  `ALTER TABLE servers ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE channels ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`,
];

async function main() {
  try {
    await client.connect();
    console.log('Connected to Render PostgreSQL');
    
    for (const sql of migrations) {
      try {
        await client.query(sql);
        console.log(`✓ ${sql.substring(0, 60)}...`);
      } catch (err) {
        console.error(`✗ ${err.message.substring(0, 100)}`);
      }
    }
    
    // Record migrations as ran
    const batch = 1;
    const migrationNames = [
      '0001_01_01_000000_create_users_table',
      '0001_01_01_000001_create_cache_table',
      '0001_01_01_000002_create_jobs_table',
      '2026_06_11_000001_add_oauth_fields_to_users_table',
      '2026_06_11_000002_create_servers_table',
      '2026_06_11_000003_create_channels_table',
      '2026_06_11_000004_create_messages_table',
      '2026_06_11_000005_create_direct_messages_table',
      '2026_06_11_000006_create_roles_table',
      '2026_06_11_000007_create_permissions_table',
      '2026_06_11_000008_create_role_permission_table',
      '2026_06_11_000009_create_server_members_table',
      '2026_06_11_000010_create_channel_overrides_table',
      '2026_06_11_000011_create_channel_override_permission_table',
      '2026_06_11_000012_create_invites_table',
      '2026_06_12_213440_add_is_public_to_servers_table',
      '2026_06_18_000001_add_soft_deletes_to_channels_table',
    ];
    
    for (const name of migrationNames) {
      await client.query(
        'INSERT INTO migrations (migration, batch) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [name, batch]
      );
      console.log(`✓ Recorded migration: ${name}`);
    }
    
    console.log('\n✅ All migrations completed!');
    await client.end();
  } catch (err) {
    console.error('Fatal error:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();
