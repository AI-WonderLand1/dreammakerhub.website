import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://spatial:spatial@localhost:5432/spatial',
})

async function seed(): Promise<void> {
  console.log('Seeding database...')

  // Create users
  await pool.query(`
    INSERT INTO users (id, username, email, password_hash, role)
    VALUES
      ('seed-admin-1', 'admin', 'admin@spatial.local', '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qm0nG0nG0nG0nG0nG0nG0nG0nO', 'admin'),
      ('seed-user-1', 'demo', 'demo@spatial.local', '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qm0nG0nG0nG0nG0nG0nG0nG0nO', 'user')
    ON CONFLICT (email) DO NOTHING
  `)

  // Create worlds
  await pool.query(`
    INSERT INTO worlds (id, name, description, owner_id, visibility, scene_data)
    VALUES
      ('seed-world-1', 'Demo World', 'A demo world for testing', 'seed-admin-1', 'public', '{}'),
      ('seed-world-2', 'Test Environment', 'A test environment', 'seed-user-1', 'public', '{}')
    ON CONFLICT (id) DO NOTHING
  `)

  // Create assets
  await pool.query(`
    INSERT INTO assets (id, name, url, type, owner_id)
    VALUES
      ('seed-asset-1', 'Demo Box Model', '/models/box.glb', 'model', 'seed-admin-1'),
      ('seed-asset-2', 'Demo Texture', '/textures/demo.png', 'texture', 'seed-admin-1')
    ON CONFLICT (id) DO NOTHING
  `)

  console.log('Seed complete.')
  await pool.end()
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
