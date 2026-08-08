# NPC Sim Makefile

.PHONY: dev api seed seed-world step ticks status docker logs clean

# Run API server with hot reload
dev:
	npm run dev --prefix .

# Run API server (no hot reload)
api:
	npm run api --prefix .

# Seed world state (run once)
seed-world:
	npx tsx db/seed/world-state.ts

# Seed NPCs (run once)
seed-npcs:
	npx tsx db/seed/npcs.ts

# Seed everything
seed: seed-world seed-npcs

# Run single tick
step:
	curl -X POST http://localhost:3000/tick -H "Content-Type: application/json" -d '{"count": 1}'

# Run multiple ticks
ticks:
	curl -X POST http://localhost:3000/tick -H "Content-Type: application/json" -d '{"count": $(or $(count),10)}'

# Check simulation status
status:
	@echo "=== World State ==="
	@curl -s http://localhost:3000/status | python3 -m json.tool 2>/dev/null || echo "API not running"

# Docker
docker:
	docker build -t npc-sim .
	docker run -p 3000:3000 --env-file .env npc-sim

logs:
	docker logs -f npc-sim

clean:
	rm -f local.db
	rm -rf dist
