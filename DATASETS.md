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
      "description": "Structured Data (~200kb)"
    },
    {
      "datasetId": "large-data",
      "source": "source-2",
      "sourceType": "HTTP",
      "url": "https://buenro-tech-assessment-materials.s3.eu-north-1.amazonaws.com/large_generated_data.json",
      "description": "Large Data (~150MB)"
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
| `bucket` | string | S3 bucket name (for sourceType: S3, future) |
| `key` | string | S3 object key (for sourceType: S3, future) |

## How It Works

1. The scheduler (`PublishIngestionJobsTask`) reads `datasets.config.json` on each run
2. Publishes an ingestion job for each configured dataset
3. Workers process jobs: existing records for the dataset are deleted first, then new data is streamed and stored in MongoDB in batches of 1000
4. Data is available via the API: `GET /records?source=X&datasetId=Y`

## Deduplication

On each ingestion run, existing records matching the same `source` + `datasetId` are removed before inserting new data. This prevents duplicate accumulation across scheduler runs.

## Ingestion Frequency

The scheduler runs **every 10 minutes** by default (`0 */10 * * * *`).

To change the frequency, edit the cron expression in `src/common/constants/scheduler.constants.ts`.

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
