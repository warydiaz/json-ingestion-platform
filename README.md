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
INGESTION_CRON=0 */10 * * * *   # optional, default: every 10 minutes
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
| `<field>` | Exact match for numbers/booleans, partial text (case-insensitive) for strings |
| `<field>_min` | Greater than or equal (e.g. `price_min=100`) |
| `<field>_max` | Less than or equal (e.g. `price_max=500`) |
| `<field>_gt` | Greater than |
| `<field>_lt` | Less than |
| `limit` | Results per page (1-100, default: 10) |
| `cursor` | Cursor for next page |

**Examples:**

```
GET /records?city=Ly&available=true&limit=50
GET /records?price_min=100&price_max=500
GET /records?source=source-1&city=Lyon&available=true
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

Datasets are configured in `datasets.config.json`. Each dataset supports an optional `fieldMapping` to normalize payload fields across different sources, so API consumers use unified field names regardless of the data source.

See [DATASETS.md](DATASETS.md) for details on adding new data sources and configuring field mappings.

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
