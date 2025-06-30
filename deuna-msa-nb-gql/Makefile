# .env.public use postgres as default database
ENV_FILE = $(shell [ -e ".env" ] && echo ".env" || echo ".env.public")

include $(ENV_FILE)

.DEFAULT_GOAL := help # when you run make, it defaults to printing available commands

COMPOSE_PROJECT_NAME = deuna-msa-nb-gql
BUILD_IMAGES_DEP = deuna-build-dep
CONTAINER_APP_FOLDER  = /app

# Available platforms: linux/amd64 | linux/arm64/v8 | linux/x86_64
PLATFORM = linux/x86_64

# Determine the user's home directory and .npmrc path
ifeq ($(OS),Windows_NT)
    USER_HOME := $(shell echo %USERPROFILE%)
else
    USER_HOME := $(shell echo $$HOME)
endif
USER_NPMRC := $(USER_HOME)/.npmrc

ifeq ($(OS),Windows_NT)
	DIR := $(shell powershell "(New-Object -ComObject Scripting.FileSystemObject).GetFolder('.').ShortPath")
else
	DIR := "$$(pwd)"
endif

# include dependencies and codebase to a container excluding local dependencies that could conflict with one from volumes
DEV_VOLUMES = \
	-v $(DIR):$(CONTAINER_APP_FOLDER) \
	-v $(USER_NPMRC):/root/.npmrc:ro \
	-v $(CONTAINER_APP_FOLDER)/node_modules \
	-v $(COMPOSE_PROJECT_NAME)-packages:$(CONTAINER_APP_FOLDER)/node_modules

BUILD_VOLUMES = \
	-v $(USER_NPMRC):/root/.npmrc:ro \
	-v $(DIR):$(CONTAINER_APP_FOLDER) \
	-v $(CONTAINER_APP_FOLDER)/node_modules \
	-v $(BUILD_IMAGES_DEP)-packages:$(CONTAINER_APP_FOLDER)/node_modules

.PHONY: docker-clean
docker-clean: ## stop+kill all running containers. prune stopped containers. remove all untagged images
ifeq ($(OS),Windows_NT)
	powershell "docker ps -qa | foreach-object {docker kill $$_}; docker container prune --force; docker system prune --force;"
else
	docker ps -qa | xargs docker kill; docker container prune --force; docker system prune --force;
endif

.PHONY: build-dep
build-dep: ## build dep backend container image
	docker build --platform $(PLATFORM) \
		-t $(BUILD_IMAGES_DEP) -f Dockerfile.build .

.PHONY: interactive-build
interactive-build: ## interactive build
	docker run -it --workdir="$(CONTAINER_APP_FOLDER)" \
		--platform $(PLATFORM) \
		$(BUILD_VOLUMES) \
		$(BUILD_IMAGES_DEP):latest /bin/ash

.PHONY: clean-install
clean-install: ## test clean install
	docker run -it --workdir="$(CONTAINER_APP_FOLDER)" \
		--platform $(PLATFORM) \
		$(BUILD_VOLUMES) \
		$(BUILD_IMAGES_DEP):latest /bin/ash -ci "node -v && npm -v && npm ci"

.PHONY: build-dev
build-dev: ## build dev backend container image
	docker build --platform $(PLATFORM) --target base \
		--build-arg NPMRC="$$(cat $(USER_NPMRC))" \
		-t $(COMPOSE_PROJECT_NAME) .

.PHONY: install-dependencies
install-dependencies: ## install packages
	docker run -it --workdir="$(CONTAINER_APP_FOLDER)" $(DEV_VOLUMES) \
		--platform $(PLATFORM) \
		$(COMPOSE_PROJECT_NAME) /bin/ash -ci "npm i"

.PHONY: build-release
build-release: ## build release backend container image
	docker build --platform $(PLATFORM) --target release \
		--build-arg NPMRC="$$(cat $(USER_NPMRC))" \
		-t $(COMPOSE_PROJECT_NAME):release .

.PHONY: interactive
interactive: ## run the api standalone only for healthcheck and no db connection
	docker run -it --workdir="$(CONTAINER_APP_FOLDER)" \
		--platform $(PLATFORM) \
		$(DEV_VOLUMES) \
		-p "3000:3000" \
		$(COMPOSE_PROJECT_NAME):latest /bin/ash

.PHONY: launch-local
launch-local: docker-clean ## launch the multi-container on local machine
	docker-compose --env-file $(ENV_FILE) -f docker-compose/docker-compose.local.yml up

.PHONY: stop-local
stop-local: ## locally stop all containers for local development
	docker-compose --env-file=$(ENV_FILE) -f docker-compose/docker-compose.local.yml down

.PHONY: help
help:  ## show all make commands
ifeq ($(OS),Windows_NT)
	powershell "((type Makefile) -match '##') -notmatch 'grep'"
else
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
endif