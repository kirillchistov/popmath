.PHONY: help install env dev build start

help:
	@echo "make install  — поставить зависимости"
	@echo "make env      — создать .env.local из примера, если файла ещё нет"
	@echo "make dev      — локальный сервер http://localhost:3000"
	@echo "make build    — production-сборка"
	@echo "make start    — запустить собранное приложение"

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
