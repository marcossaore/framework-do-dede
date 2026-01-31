# Benchmark Results (local)

Setup:
- Requests: 5000
- Concurrency: 50
- Warmup: 200
- Endpoint: /example

## Runs

Run 1
- Express: avg 3.28 ms, p50 2.43 ms, p95 8.16 ms, 8343.64 req/s
- Elysia: avg 3.11 ms, p50 2.57 ms, p95 7.37 ms, 8772.32 req/s

Run 2
- Express: avg 3.55 ms, p50 2.41 ms, p95 9.08 ms, 7833.60 req/s
- Elysia: avg 3.15 ms, p50 2.59 ms, p95 6.66 ms, 8941.13 req/s

Run 3
- Express: avg 3.20 ms, p50 2.52 ms, p95 8.38 ms, 8718.59 req/s
- Elysia: avg 3.21 ms, p50 2.74 ms, p95 6.90 ms, 8583.90 req/s

## Mean of 3 runs

Express
- avg 3.34 ms
- p50 2.45 ms
- p95 8.54 ms
- throughput 8298.61 req/s

Elysia
- avg 3.16 ms
- p50 2.63 ms
- p95 6.98 ms
- throughput 8765.78 req/s

## Notes
- Em 3 rodadas, Elysia teve p95 menor em todas.
- p50 ficou maior em todas as rodadas para Elysia.
- Throughput variou por rodada; média favoreceu Elysia.
