import { performance } from 'node:perf_hooks';

const args = new Map();
for (const part of process.argv.slice(2)) {
  const [key, value] = part.split('=');
  if (key && value !== undefined) args.set(key.replace(/^--/, ''), value);
}

const url = args.get('url') || 'http://localhost:3000/example';
const total = Number(args.get('requests') || 500);
const concurrency = Number(args.get('concurrency') || 20);
const warmup = Number(args.get('warmup') || 50);
const jsonOutput = args.get('json') === '1' || args.get('json') === 'true';

if (!globalThis.fetch) {
  console.error('This script requires Node 18+ (fetch).');
  process.exit(1);
}

async function runBatch(size) {
  const latencies = [];
  const start = performance.now();
  const tasks = Array.from({ length: size }, async () => {
    const t0 = performance.now();
    const res = await fetch(url, { method: 'GET' });
    await res.arrayBuffer();
    const t1 = performance.now();
    latencies.push(t1 - t0);
  });
  await Promise.all(tasks);
  const end = performance.now();
  return { latencies, durationMs: end - start };
}

async function warmupRun() {
  const batches = Math.ceil(warmup / concurrency);
  for (let i = 0; i < batches; i++) {
    const size = Math.min(concurrency, warmup - i * concurrency);
    await runBatch(size);
  }
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

(async () => {
  await warmupRun();

  const allLatencies = [];
  let totalDuration = 0;
  const batches = Math.ceil(total / concurrency);

  for (let i = 0; i < batches; i++) {
    const size = Math.min(concurrency, total - i * concurrency);
    const { latencies, durationMs } = await runBatch(size);
    allLatencies.push(...latencies);
    totalDuration += durationMs;
  }

  const p50 = percentile(allLatencies, 50).toFixed(2);
  const p95 = percentile(allLatencies, 95).toFixed(2);
  const avg = (allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length).toFixed(2);
  const rps = (allLatencies.length / (totalDuration / 1000)).toFixed(2);

  if (jsonOutput) {
    console.log(JSON.stringify({
      url,
      requests: allLatencies.length,
      concurrency,
      warmup,
      avgMs: Number(avg),
      p50Ms: Number(p50),
      p95Ms: Number(p95),
      rps: Number(rps)
    }));
    return;
  }

  console.log('Benchmark results');
  console.log(`URL: ${url}`);
  console.log(`Requests: ${allLatencies.length}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Avg latency (ms): ${avg}`);
  console.log(`p50 latency (ms): ${p50}`);
  console.log(`p95 latency (ms): ${p95}`);
  console.log(`Throughput (req/s): ${rps}`);
})();
