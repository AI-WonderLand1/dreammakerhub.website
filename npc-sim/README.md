# NPC Civilization Simulation Island

A standalone, high-performance NPC simulation engine designed to run as an independent service (Docker or CLI) within the DreamMakerHub ecosystem.

## Architecture

This "island" is architected for scale and isolation, separated from the main web application to allow independent scaling and resource allocation.

### Core Components

- **Decision Layer (Hybrid AI)**: Combines fast, rule-based **Utility AI** for the general population with high-fidelity **LLM reasoning** (via Claude Haiku) for key/named characters.
- **Tick Engine**: An atomic, transaction-safe simulation loop that processes needs, decisions, and event logging in discrete steps.
- **Social Graph**: A sparse relationship engine managing social scores, decay, and group affiliations (Tribes/Religions).
- **Intent Detection**: A gesture-based input gatekeeper that distinguishes deliberate user commands from incidental movement.

## Directory Structure

```text
/npc-sim/
├── api/                # Standalone API endpoints (Next.js/Node)
├── core/               # The "Brain"
│   ├── decision-layer.ts # Hybrid LLM/Utility logic
│   ├── intent.ts         # Gesture intent detection
│   ├── patterns.ts       # Motion pattern recognition
│   ├── relationships.ts  # Social graph dynamics
│   ├── timing.ts         # Adaptive frame rate control
│   ├── tribe-groups.ts   # Tribe/Group logic
│   ├── tick.ts           # Main simulation loop
│   ├── utility-ai.ts     # Rule-based decision engine
│   └── types.ts          # Shared interfaces/enums
├── db/                 # The "Memory"
│   ├── schema/           # Drizzle ORM definitions
│   └── seed/             # Initialization scripts
└── README.md
```

## Development & Running

### CLI Mode (Local Development)
For rapid testing and debugging without container overhead.
```bash
# Example command (to be implemented via Makefile)
make local
```

### Docker Mode (Production/Stable)
For running the simulation in a fully isolated, portable container.
```bash
# Example command (to be implemented via Makefile)
make docker
```

## Status
- [x] Phase 1: Data Model (Schema defined)
- [x] Phase 2: Tick Loop (Engine implemented)
- [x] Phase 3: Decision Layer (Hybrid AI implemented)
- [ ] Phase 4: Relationships & Social Graph
- [ ] Phase 5: Group Identity
- [ ] Phase 6: Persistence
- [ ] Phase 7: Visualization
- [ ] Phase 8: Stretch Goals
