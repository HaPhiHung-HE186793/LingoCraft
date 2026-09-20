/**
 * Worker process entrypoint.
 *
 * Per spec §16.1: "worker xử lý tác vụ lâu" — separate from API process.
 * Per ADR-005: pg-boss for job queue (M1+ when actual jobs are added).
 *
 * M0 scaffold: starts but does nothing useful until T07.
 * Gate (from IMPLEMENTATION_PLAN.md): "Không mở AI feature trước khi core review và scope chạy được."
 */

// eslint-disable-next-line no-console
console.log('LingoCraft worker starting (M0 scaffold — no jobs registered yet)');

// Keep process alive for future job registration
// In production (T07+), pg-boss.start() and job handlers go here.
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('Worker received SIGTERM, shutting down gracefully');
  process.exit(0);
});
