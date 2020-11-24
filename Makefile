
start:
	make start-services && make start-server

start-services:
	docker-compose up -d postgres elasticsearch

start-server:
	cd app && npm i && npm run check-elastic && npm run start:dev

stop-services:
	docker-compose stop postgres elasticsearch

remove-containers:
	@echo "Removing all stopped containers..."
	docker-compose rm postgres elasticsearch

burn:
	@echo "Stopping and removing all containers..."
	make stop-services && make remove-containers

clean-data:
	rm -rf ./docker/**/data

default: start
