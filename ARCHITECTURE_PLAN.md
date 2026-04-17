# Wonderland Agent Architecture Plan

## Philosophy: Thin TS / Heavy Python

```
Browser (TS Nervous System)          Python (Deep Brain)
        │                                    │
        ├─ IndexedDB ──────────────────────►│ (long-term memory)
        │     │                              │
        ├─ High Priority ─────────────────►│ (confessions, filters)
        │     │                              │
        ├─ Batched ───────────────────────►│ (standard thoughts)
        │     │                              │
        ◄─ Response ────────────────────────┤
```

---

## Phase 1: Core Infrastructure (COMPLETED)

### Files Created

| File | Purpose |
|------|---------|
| `agent/` | Python FastAPI server with personas |
| `engine/core/alice-proxy.ts` | TS wrapper for Python API |
| `engine/core/local-memory.ts` | IndexedDB for short-term storage |
| `engine/core/syncGuard.ts` | Batches memory writes |

### Data Flow (Phase 1)
```
Browser Action
     ↓
IndexedDB (instant save) ← localMemory
     ↓
SyncGuard (batches)
     ↓
Python Memory Bank (persistent)
```

---

## Phase 2: Truth-First Filtering (IN PROGRESS)

### The Problem
Your "AI Laws" and constitutional filtering need:
1. Real-time validation (stop if law broken)
2. Confession persistence (don't lose error logs)
3. Separation of State and Law

### The Solution

#### Priority System
```typescript
enum SyncPriority {
  STANDARD = 0,    // Batched via SyncGuard (standard thoughts)
  HIGH = 1,        // Send immediately (confessions, warnings)
  CRITICAL = 2     // Block until confirmed (law violations)
}
```

#### New Components

##### 1. FilterGuard (`engine/core/filter-guard.ts`)
- Lightweight TS validation before batching
- Checks against AI Laws (from `personas.ts`)
- Routes content based on priority

##### 2. ConfessionService (`engine/core/confession-service.ts`)
- High-priority storage for agent errors
- Persists even if Python crashes
- Logs to both IndexedDB and Python

##### 3. AuditLog (`engine/core/audit-log.ts`)
- Tracks all law violations
- Separate from standard memory
- Queryable for review

### Files to Create (Phase 2)

```
engine/core/
├── filter-guard.ts        # Pre-flight validation
├── confession-service.ts   # High-priority confessions
├── audit-log.ts          # Law violation tracker
└── alice-proxy.ts (update) # Add confess(), filter(), auditLog()
```

### Data Flow (Phase 2)

```
Standard Thought
     ↓
localMemory.saveThought()
     ↓
SyncGuard.queueThought() → batched sync
     ↓
Python Memory Bank

---

Confession/Error
     ↓
FilterGuard.validate()
     ↓
SyncPriority.HIGH → aliceProxy.confess()
     ↓
IndexedDB (log) + Python (persist)

---

Law Violation
     ↓
SyncPriority.CRITICAL
     ↓
Block request
     ↓
AuditLog.logViolation()
     ↓
User notification
```

### AI Laws (from personas.ts)
```typescript
const AI_LAWS = [
  'You cannot lie. If uncertain, explicitly say so.',
  'Be transparent: explain what, how, and why in plain language.',
  'Prefer safe, auditable actions and clearly flag risk.',
  'Always include at least one limitation, risk, or uncertainty confession when relevant.',
  'Never hallucinate facts. If unsure, explicitly confess uncertainty.',
  'Verify all facts before stating them. Flag any assumptions made.',
  'For every action taken, explain: TRUTH, WHAT, WHY, HOW.',
];
```

### Implementation Notes

#### FilterGuard Logic
```typescript
// Pseudo-code
function validateAgainstLaws(content: string): ValidationResult {
  for (const law of AI_LAWS) {
    if (violates(content, law)) {
      return {
        passed: false,
        violation: law,
        priority: SyncPriority.CRITICAL
      };
    }
  }
  return { passed: true, priority: SyncPriority.STANDARD };
}
```

#### ConfessionService Logic
```typescript
async function recordConfession(confession: string): Promise<void> {
  // Save to IndexedDB immediately (survives crashes)
  await localMemory.saveConfession(confession, Date.now());
  
  // Send to Python for permanent storage
  await aliceProxy.confess(confession);
}
```

---

## Phase 3: Future Enhancements (TBD)

- [ ] PlayCanvas integration with memory sync
- [ ] Multi-user memory sharing
- [ ] Cloud deployment (swap Python URL)
- [ ] Real-time collaboration features

---

## Usage Examples

### Basic (Phase 1)
```typescript
import { alice } from '@/core/alice-proxy';
import { syncGuard } from '@/core/syncGuard';

await syncGuard.start();
const wisdom = await alice.consult("What path should I take?");
```

### With Filtering (Phase 2)
```typescript
import { filterGuard } from '@/core/filter-guard';
import { confessionService } from '@/core/confession-service';

const result = await filterGuard.validate(userInput);
if (result.priority === 'CRITICAL') {
  await auditLog.logViolation(result);
  return { blocked: true, reason: result.violation };
}

// Confessions go straight to Python
await confessionService.recordConfession(errorReport);
```

---

## Disk Space Monitoring

| Phase | Before | After | Change |
|-------|--------|-------|--------|
| Phase 1 | 69% | 70% | +1% |
| Phase 2 | TBD | TBD | ~1-2% |

**Target: Stay under 80% (4G free)**
