# NPC Sim Makefile

.PHONY: local docker step logs

local:
	npm run api --prefix .

docker:
	docker build -t npc-sim .
	docker run -p 3000:3000 --env-file .env npc-sim

step:
	curl -X POST http://localhost:3000/tick -H "Content-Type: application/json" -d '{"count": 1}'

logs:
	docker logs -f npc-sim
