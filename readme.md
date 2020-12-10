# Airsoft Registration System Backend

## Requirements

- NodeJS >= 12
- Docker Desktop for Mac or Windows, Docker Server and docker-compose for linux
- make (for Mac, Linux and WLS)

## How to run

First create your `.env` file as `.env.sample`

### For Mac, Linux and WLS

run `make start`

### For Windows

```bash
docker-compose up -d postgres elasticsearch
npm i && npm run check-elastic && npm run start:dev
```
