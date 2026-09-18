import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Ensure this route runs on Node.js runtime (process.exit is Node-only)
export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * Secure kill endpoint for deployment automation
 * 
 * When called with the correct secret token, this endpoint triggers process.exit(0),
 * which terminates the current Node.js process. The deployment script will then
 * start a new process with the updated code.
 * 
 * Security: Uses a secret token from environment variables to prevent unauthorized kills.
 * 
 * Usage: POST /api/kill with Authorization header: Bearer <RESTART_SECRET_TOKEN>
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
        { error: 'Kill endpoint not configured' },
        { status: 500 }
      );
    }

    // Optional safety: disable in non-production unless explicitly allowed
    if (process.env.NODE_ENV !== 'production' && process.env.RESTART_ALLOW_IN_DEV !== 'true') {
      console.warn('[KILL] Unauthorized kill attempt');
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
      console.warn('[KILL] Unauthorized kill attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Log the kill
    console.log('[KILL] Authorized kill requested. Terminating process and supervisor loop if present...');

    // Send response before exiting
    const response = NextResponse.json({
      success: true,
      message: 'Process termination initiated. Supervisor loop will be signaled. Deployment script will start new process.',
      timestamp: new Date().toISOString(),
    });

    // Attempt to terminate the supervisor loop (parent bash -c) before exiting Node
    const ppid = process.ppid;
    try {
      if (ppid && ppid !== 1) {
        console.log('[KILL] Signaling parent process (possible loop) with SIGTERM. PPID =', ppid);
        // Give the parent a chance to stop its loop gracefully
        setTimeout(() => {
          try {
            process.kill(ppid, 'SIGTERM');
          } catch {
          }
        }, 50);

        // If it is still alive shortly after, force kill
        setTimeout(() => {
          try {
            // probe: signal 0 throws if process is gone
            process.kill(ppid, 0 as any);
            process.kill(ppid, 'SIGKILL');
          } catch {
            // already gone
          }
        }, 450);
      }
    } catch {
    }

    // Trigger the exit after a short delay to allow response and parent kill attempt
    setTimeout(() => {
      process.exit(0);
    }, 800);

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
