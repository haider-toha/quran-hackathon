.PHONY: help install lock dev format lint type-check test clean

help:
	@echo "Quran Hackathon — orchestrates backend (FastAPI) + frontend (Next.js)."
	@echo ""
	@echo "Available commands:"
	@echo "  make install     - Install backend (poetry) and frontend (pnpm) deps"
	@echo "  make lock        - Refresh backend poetry.lock"
	@echo "  make dev         - Run backend (port 8000) and frontend (port 3000) concurrently"
	@echo "  make format      - Format both sides"
	@echo "  make lint        - Lint both sides"
	@echo "  make type-check  - Type-check both sides"
	@echo "  make test        - Run all tests"
	@echo "  make clean       - Remove caches and build artefacts"

install:
	$(MAKE) -C backend install
	cd frontend && pnpm install

lock:
	$(MAKE) -C backend lock

dev:
	$(MAKE) -C backend dev &
	cd frontend && pnpm dev

format:
	$(MAKE) -C backend format
	cd frontend && pnpm format

lint:
	$(MAKE) -C backend lint
	cd frontend && pnpm lint

type-check:
	$(MAKE) -C backend type-check
	cd frontend && pnpm type-check

test:
	$(MAKE) -C backend test

clean:
	$(MAKE) -C backend clean
	rm -rf frontend/.next frontend/out frontend/coverage frontend/tsconfig.tsbuildinfo
	@echo "Cleaned."
