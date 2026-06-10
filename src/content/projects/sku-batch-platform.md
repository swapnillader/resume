---
title: "SKU Batch Processing Platform"
blurb: "Backend pipeline handling millions of SKUs through reliable, observable batch processing."
tags: ["Python", "FastAPI", "AWS"]
featured: true
date: 2024-06-01
---

## Problem

Catalog operations at millions-of-SKUs scale can't run on request/response patterns — work has to be batched, monitored, and safe to retry.

## Approach

Designed the batch architecture end to end: chunked processing with idempotent retries, dead-letter handling for poison records, and Grafana dashboards for throughput and failure rates. Failure is treated as a first-class concern — the pipeline self-heals from partial failures instead of requiring manual restarts.
