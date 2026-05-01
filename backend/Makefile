.PHONY: help install lock lock-no-update dev format lint type-check typecheck test requirements clean gen-secret

help:
	@echo "Available commands:"
	@echo "  make install         - Install all dependencies (incl. dev group)"
	@echo "  make lock            - Refresh poetry.lock (re-resolve, allow updates)"
	@echo "  make lock-no-update  - Re-lock without updating versions (after pyproject edits)"
	@echo "  make dev             - Run development server with reload"
	@echo "  make format          - Format code with ruff (writes changes)"
	@echo "  make lint            - Run ruff lint checks"
	@echo "  make type-check      - Run mypy --strict on app/"
	@echo "  make test            - Run pytest"
	@echo "  make requirements    - Export requirements.txt for environments without poetry"
	@echo "  make gen-secret      - Generate a random base64 secret"
	@echo "  make clean           - Remove caches and compiled artefacts"

install:
	poetry install

lock:
	poetry lock

# Re-lock after editing pyproject.toml without bumping unrelated transitive versions.
lock-no-update:
	poetry lock --no-update

dev:
	poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

format:
	poetry run ruff format .
	poetry run ruff check --fix .

lint:
	poetry run ruff check .
	poetry run ruff format --check .

type-check:
	poetry run mypy app

# Alias for consistency with common conventions
typecheck: type-check

test:
	poetry run pytest -v

# Export a pip-style requirements.txt — handy for Docker / Lambda / Vercel-style
# deploy targets that don't speak poetry.
requirements:
	poetry export --without-hashes --format=requirements.txt --output=requirements.txt

gen-secret:
	@openssl rand -base64 32

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null; \
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null; \
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null; \
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null; \
	find . -name "*.pyc" -delete 2>/dev/null; \
	find . -name ".coverage" -delete 2>/dev/null; \
	echo "Cleaned."
