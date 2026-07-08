# @dreammakerhub/playground-sync

Sync client for playground.dreammakerhub.website to sync data with the main DreamMakerHub site.

## Installation

```bash
npm install @dreammakerhub/playground-sync
```

## Setup

### 1. Get your sync key

Contact DreamMakerHub admin to get a sync key, or use the one from your Supabase `sync_keys` table.

### 2. Configure environment variables

```bash
DREAMMAKERHUB_API_URL=https://dreammakerhub.website
PLAYGROUND_SYNC_KEY=your-sync-key-here
```

### 3. Initialize the client

```typescript
import { PlaygroundSync } from '@dreammakerhub/playground-sync';

const sync = new PlaygroundSync({
  apiUrl: 'https://dreammakerhub.website',
  syncKey: 'your-sync-key'
});
```

## Usage

### Track Token Usage

```typescript
// When a user uses AI in the playground
await sync.trackUsage('user-123', 150, 'gpt-4', 'session-abc');
```

### Manage Token Balance

```typescript
// Add tokens (e.g., after purchase)
await sync.addTokens('user-123', 500, 'purchase');

// Subtract tokens (e.g., during usage)
await sync.subtractTokens('user-123', 100, 'ai_usage');

// Set balance directly
await sync.setTokens('user-123', 1000, 'admin_adjustment');

// Get current balance
const balance = await sync.getTokenBalance('user-123');
console.log(balance.data?.balance); // 1000
```

### Report Session Status

```typescript
// Report session start
await sync.reportStatus('user-123', 'started', 'session-abc', 'gpt-4');

// Report active session
await sync.reportStatus('user-123', 'active', 'session-abc');

// Report completion
await sync.reportStatus('user-123', 'completed', 'session-abc');

// Report error
await sync.reportStatus('user-123', 'error', 'session-abc', 'gpt-4', 'Rate limited');
```

### Get Usage Data

```typescript
// Get combined usage from playground + main site
const usage = await sync.getUsage('user-123');
console.log(usage.data?.combined.totalTokens); // Combined total
```

### Get Session Status

```typescript
// Get all active sessions
const status = await sync.getStatus();
console.log(status.data?.activeCount); // Number of active sessions

// Get sessions for a specific user
const userStatus = await sync.getStatus('user-123');
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sync/playground-usage` | POST | Track token usage |
| `/api/sync/playground-usage` | GET | Get combined usage |
| `/api/sync/playground-tokens` | POST | Add/subtract/set tokens |
| `/api/sync/playground-tokens` | GET | Get token balance |
| `/api/sync/playground-status` | POST | Report session status |
| `/api/sync/playground-status` | GET | Get active sessions |

## Error Handling

All methods return a `SyncResponse` object with an `ok` field:

```typescript
const result = await sync.trackUsage('user-123', 100);

if (!result.ok) {
  console.error('Sync failed:', result.error);
} else {
  console.log('Sync successful');
}
```

## TypeScript Support

This library is fully typed. Import types from the package:

```typescript
import type { 
  PlaygroundSyncConfig,
  UsageData,
  TokenData,
  StatusData,
  SyncResponse 
} from '@dreammakerhub/playground-sync';
```
