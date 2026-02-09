# JSON Ingestion Platform

A scalable data ingestion platform built with NestJS that streams JSON data from external sources, stores it in MongoDB, and exposes a flexible query API with dynamic filtering and cursor-based pagination.

## Architecture

```
datasets.config.json
        |
        v
  [Scheduler] (cron every 10 min)
        |
        v
  [RabbitMQ] --> [Ingestion Worker]
                        |
                        v
                 [HTTP Streaming]
                        |
                        v
                 [Batch Insert] --> MongoDB

  [REST API] --> [MongoDB] --> Response with cursor pagination
```

## Prerequisites

- Node.js 18+
- Docker (for MongoDB and RabbitMQ)

## Setup

```bash
npm install
```

Start infrastructure services:

```bash
docker-compose up -d
```

Create a `.env` file:

```env
MONGO_URI=mongodb://localhost:27017/ingestion
RABBITMQ_URI=amqp://admin:admin@localhost:5672
```

## Running

```bash
# development (watch mode)
npm run start:dev

# production
npm run start:prod
```

## API Endpoints

### Query Records

```
GET /records
```

**Query Parameters:**

| Parameter | Description |
|-----------|-------------|
| `source` | Filter by data source |
| `datasetId` | Filter by dataset |
| `payload.*` | Dynamic filter on any payload field (e.g. `payload.address.city=Lyon`) |
| `limit` | Results per page (1-100, default: 10) |
| `cursor` | Cursor for next page |

**Example:**

```
GET /records?source=source-1&payload.address.country=France&payload.isAvailable=true&limit=50
```

**Response:**

```json
{
  "data": [...],
  "pagination": {
    "total": 1000,
    "limit": 50,
    "nextCursor": "64f1a2b3c4d5e6f7a8b9c0d1",
    "hasMore": true
  }
}
```

### Trigger Ingestion

```
POST /admin/trigger-ingestion
```

Manually triggers ingestion for all configured datasets.

### Health Check

```
GET /health
```

## Dataset Configuration

See [DATASETS.md](DATASETS.md) for details on adding new data sources.

## Tests

```bash
# unit tests
npm run test

# test coverage
npm run test:cov
```

## Project Structure

```
src/
├── api/                  # REST API (controllers, DTOs, use cases)
├── ingestion/            # Data ingestion pipeline (workers, adapters)
├── persistence/          # Database layer (repositories, schemas)
├── scheduler/            # Cron jobs and manual triggers
├── messaging/            # RabbitMQ publisher
├── health/               # Health checks
├── config/               # Configuration (MongoDB, RabbitMQ, datasets)
└── common/               # Shared utilities, constants, exceptions
```
