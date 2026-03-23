.PHONY: build dev test test-coverage lint typecheck clean install

# Build
build:
	pnpm build

# Development
dev:
	pnpm dev

# Start production server
start:
	node dist/server.js

# Run CLI
cli:
	pnpm cli

# Testing
test:
	pnpm test

test-watch:
	pnpm test:watch

test-coverage:
	pnpm test:coverage

# Code quality
lint:
	pnpm lint

typecheck:
	pnpm typecheck

# Setup
install:
	pnpm install

# Clean
clean:
	rm -rf dist coverage node_modules

# Docker
docker-build:
	docker build -t clawskill .

docker-up:
	docker compose up -d

docker-down:
	docker compose down
