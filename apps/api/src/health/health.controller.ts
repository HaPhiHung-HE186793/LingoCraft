import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@lingocraft/contracts';

/**
 * Health endpoint — public, no auth required.
 *
 * Per spec §23.5:
 *   "Health endpoint public không lộ phiên bản bí mật, DB URL hoặc status provider chi tiết."
 *   "Liveness chỉ cho biết process còn sống."
 *
 * This endpoint does NOT call AI, database, or external services.
 * Readiness checks (DB ping) are separate and not exposed publicly.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      // Version from env or build-time constant — not a secret
      version: process.env['APP_VERSION'] ?? '0.0.1-dev',
    };
  }
}
