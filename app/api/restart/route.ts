import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Ensure this route runs on Node.js runtime (process.exit is Node-only)
export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * Secure restart endpoint for Infomaniak hosting automation
 * 
 * When called with the correct secret token, this endpoint triggers process.exit(0),
 * which causes Infomaniak's orchestrator to automatically restart the application.
 * This is the recommended approach for automated deployments on Infomaniak's managed Node.js hosting.
 * 
 * Security: Uses a secret token from environment variables to prevent unauthorized restarts.
 * 
 * Usage: POST /api/restart with Authorization header: Bearer <RESTART_SECRET_TOKEN>
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    const token = (() => {
      if (!authHeader) return null;
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      return match ? match[1].trim() : null;
    })();

    // Get the secret from environment
    const restartSecret = process.env.RESTART_SECRET_TOKEN;

    // Validate secret token
    if (!restartSecret) {
      return NextResponse.json(
        { error: 'Restart endpoint not configured' },
        { status: 500 }
      );
    }

    // Optional safety: disable in non-production unless explicitly allowed
    if (process.env.NODE_ENV !== 'production' && process.env.RESTART_ALLOW_IN_DEV !== 'true') {
      console.warn('[RESTART] Unauthorized restart attempt');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Constant-time compare using SHA-256 digests
    const valid = (() => {
      if (!token) {
        return false;
      }
      try {
        const a = crypto.createHash('sha256').update(token).digest();
        const b = crypto.createHash('sha256').update(restartSecret).digest();
        return crypto.timingSafeEqual(a, b);
      } catch {
        return false;
      }
    })();

    if (!valid) {
      console.warn('[RESTART] Unauthorized restart attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Log the restart
    console.log('[RESTART] Authorized restart requested. Triggering graceful shutdown...');

    // Send response before exiting
    const response = NextResponse.json({
      success: true,
      message: 'Restart initiated. Application will be restarted by Infomaniak orchestrator.',
      timestamp: new Date().toISOString(),
    });

    // Trigger the restart after a short delay to allow response to be sent
    // Infomaniak's orchestrator will detect the exit and restart the app
    setTimeout(() => {
      process.exit(0);
    }, 500);

    return response;

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Reject other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

export async function OPTIONS() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
