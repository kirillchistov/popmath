.PHONY: help install env dev build start digest

help:
	@echo "make install  — поставить зависимости"
	@echo "make env      — создать .env.local из примера, если файла ещё нет"
	@echo "make dev      — локальный сервер http://localhost:3000"
	@echo "make build    — production-сборка"
	@echo "make start    — запустить собранное приложение"
	@echo "make digest   — собрать недельные ссылки для когорты (нужен CRON_SECRET)"

install:
	npm install

env:
	@test -f .env.local || cp .env.example .env.local

dev: env
	npm run dev

build:
	npm run build

start:
	npm start

digest:
	@test -f .env.local || (echo "Нет .env.local" && exit 1)
	@set -a && . ./.env.local && set +a && \
	curl -sS -X POST \
	  -H "Authorization: Bearer $$CRON_SECRET" \
	  "http://127.0.0.1:$${PORT:-3000}/api/cron/digest"
