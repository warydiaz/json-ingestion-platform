# Dataset Configuration

This document explains how to add new JSON files for ingestion.

## Adding a New Dataset

Edit the `datasets.config.json` file in the project root.

### Example

```json
{
  "datasets": [
    {
      "datasetId": "structured-data",
      "source": "source-1",
      "sourceType": "HTTP",
      "url": "https://buenro-tech-assessment-materials.s3.eu-north-1.amazonaws.com/structured_generated_data.json",
      "description": "Structured Data (~200kb)",
      "fieldMapping": {
        "id": "id",
        "name": "name",
        "city": "address.city",
        "country": "address.country",
        "available": "isAvailable",
        "price": "priceForNight"
      }
    },
    {
      "datasetId": "large-data",
      "source": "source-2",
      "sourceType": "HTTP",
      "url": "https://buenro-tech-assessment-materials.s3.eu-north-1.amazonaws.com/large_generated_data.json",
      "description": "Large Data (~150MB)",
      "fieldMapping": {
        "id": "id",
        "city": "city",
        "available": "availability",
        "price": "pricePerNight",
        "priceSegment": "priceSegment"
      }
    }
  ]
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `datasetId` | string | Unique dataset identifier |
| `source` | string | Data source name |
| `sourceType` | "HTTP" \| "S3" | Source type (only HTTP is currently implemented) |
| `url` | string | Full URL of the JSON file (for sourceType: HTTP) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Dataset description |
| `fieldMapping` | object | Maps normalized field names to source field paths (see below) |
| `bucket` | string | S3 bucket name (for sourceType: S3, future) |
| `key` | string | S3 object key (for sourceType: S3, future) |

## Field Mapping (Payload Normalization)

Different data sources often use different field names for the same concept (e.g. `isAvailable` vs `availability`). The `fieldMapping` option normalizes payloads during ingestion so API consumers can use **unified field names** regardless of the data source.

### Format

```json
"fieldMapping": {
  "normalizedField": "sourceField"
}
```

- **Key**: the normalized field name stored in MongoDB (used for API queries)
- **Value**: the original field path in the source JSON
- **Dot notation** is supported for nested fields (e.g. `"city": "address.city"`)
- Only mapped fields are kept in the stored payload

### Example

Source 1 original data:
```json
{ "address": { "city": "Lyon" }, "isAvailable": true, "priceForNight": 120 }
```

Source 2 original data:
```json
{ "city": "Lyon", "availability": true, "pricePerNight": 120 }
```

With the configured mappings, both are normalized to:
```json
{ "city": "Lyon", "available": true, "price": 120 }
```

### API Usage

After normalization, consumers query all sources with the same field names:

```
GET /records?city=Lyon        # exact text (case-insensitive partial match)
GET /records?city=Ly          # matches "Lyon", "Lyonnais", etc.
GET /records?available=true   # boolean exact match
GET /records?price=120        # numeric exact match
```

**Numeric ranges** use `_min`, `_max`, `_gt`, `_lt` suffixes:

```
GET /records?price_min=100&price_max=500   # 100 ≤ price ≤ 500
GET /records?price_gt=200                  # price > 200
```

Any query parameter that is not `source`, `datasetId`, `limit`, or `cursor` is automatically treated as a payload filter. No prefix needed.

## How It Works

1. The scheduler (`PublishIngestionJobsTask`) reads `datasets.config.json` on each run
2. Publishes an ingestion job for each configured dataset
3. Workers process jobs: existing records for the dataset are deleted first, then new data is streamed and stored in MongoDB in batches of 1000
4. Data is available via the API: `GET /records?source=X&datasetId=Y`

## Deduplication

On each ingestion run, existing records matching the same `source` + `datasetId` are removed before inserting new data. This prevents duplicate accumulation across scheduler runs.

## Ingestion Frequency

The scheduler runs **every 10 minutes** by default (`0 */10 * * * *`).

To change the frequency, set the `INGESTION_CRON` environment variable:

```bash
INGESTION_CRON="0 0 * * * *" npm run start
```

| Expression | Description |
|-----------|-------------|
| `0 */10 * * * *` | Every 10 minutes (default) |
| `0 0 * * * *` | Every hour |
| `0 0 0 * * *` | Daily at midnight |
| `0 0 */6 * * *` | Every 6 hours |

## Manual Trigger

You can trigger ingestion immediately without waiting for the scheduler:

```bash
curl -X POST http://localhost:3000/admin/trigger-ingestion
```

## Reloading Configuration

The configuration is read on every scheduler run. To apply changes:

1. Edit `datasets.config.json`
2. Wait for the next scheduler cycle (max 10 min)
3. Or trigger manually via `POST /admin/trigger-ingestion`

## Infrastructure

Start MongoDB and RabbitMQ with Docker:

```bash
docker-compose up -d
```

## Troubleshooting

### Error: "Failed to load datasets configuration"

The `datasets.config.json` file is missing or has syntax errors.

1. Verify the file exists in the project root
2. Validate JSON syntax: `cat datasets.config.json | jq .`
3. Ensure all datasets have the required fields

### New datasets not appearing

1. The scheduler has not run yet (wait up to 10 minutes or trigger manually)
2. Check application logs for errors
3. Verify the dataset URL is accessible
