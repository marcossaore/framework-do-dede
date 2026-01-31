import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const benchArgs = {
  requests: process.env.BENCH_REQUESTS || '500',
  concurrency: process.env.BENCH_CONCURRENCY || '20',
  warmup: process.env.BENCH_WARMUP || '50',
};

function startServer(script, port) {
  const proc = spawn('bun', [script], { stdio: 'inherit', env: { ...process.env, PORT: String(port) } });
  return proc;
}

function runBenchmark(url) {
  return new Promise((resolve, reject) => {
    const args = [
      'bench/benchmark.mjs',
      `--url=${url}`,
      `--requests=${benchArgs.requests}`,
      `--concurrency=${benchArgs.concurrency}`,
      `--warmup=${benchArgs.warmup}`,
      '--json=true'
    ];

    const proc = spawn('node', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || `Benchmark failed with code ${code}`));
        return;
      }
      const lines = output.trim().split(/\r?\n/);
      const jsonLine = lines[lines.length - 1];
      resolve(JSON.parse(jsonLine));
    });
  });
}

function stopServer(proc) {
  return new Promise((resolve) => {
    if (!proc || proc.killed) return resolve();
    proc.once('exit', resolve);
    proc.kill('SIGINT');
  });
}

function formatDelta(label, a, b) {
  const diff = b - a;
  const sign = diff > 0 ? '+' : '';
  return `${label}: ${a.toFixed(2)} → ${b.toFixed(2)} (${sign}${diff.toFixed(2)})`;
}

(async () => {
  console.log('Starting Express server...');
  const expressPort = Number(process.env.BENCH_EXPRESS_PORT || '3100');
  const elysiaPort = Number(process.env.BENCH_ELYSIA_PORT || '3101');

  const expressProc = startServer('bench/express-server.ts', expressPort);
  await delay(800);
  const expressResult = await runBenchmark(`http://localhost:${expressPort}/example`);
  await stopServer(expressProc);

  console.log('Starting Elysia server...');
  const elysiaProc = startServer('bench/elysia-server.ts', elysiaPort);
  await delay(800);
  const elysiaResult = await runBenchmark(`http://localhost:${elysiaPort}/example`);
  await stopServer(elysiaProc);

  console.log('\nResults');
  console.log('Express', expressResult);
  console.log('Elysia', elysiaResult);

  console.log('\nComparison (Express → Elysia)');
  console.log(formatDelta('Avg latency (ms)', expressResult.avgMs, elysiaResult.avgMs));
  console.log(formatDelta('p50 latency (ms)', expressResult.p50Ms, elysiaResult.p50Ms));
  console.log(formatDelta('p95 latency (ms)', expressResult.p95Ms, elysiaResult.p95Ms));
  console.log(formatDelta('Throughput (req/s)', expressResult.rps, elysiaResult.rps));
})();
