import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initAnalyticsTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      tenant_id VARCHAR(100),
      user_email VARCHAR(255),
      user_display_name VARCHAR(255),
      policy_name VARCHAR(500),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_tenant_id ON analytics_events(tenant_id);
  `);
}

export async function trackEvent(
  eventType: string,
  data: {
    tenantId?: string;
    userEmail?: string;
    userDisplayName?: string;
    policyName?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO analytics_events (event_type, tenant_id, user_email, user_display_name, policy_name, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        eventType,
        data.tenantId || null,
        data.userEmail || null,
        data.userDisplayName || null,
        data.policyName || null,
        JSON.stringify(data.metadata || {}),
      ]
    );
  } catch (err: any) {
    console.error(`Failed to track event: ${err.message}`);
  }
}

export async function getAnalyticsSummary(): Promise<{
  totalSignIns: number;
  totalConversions: number;
  uniqueTenants: number;
  uniqueUsers: number;
  recentEvents: Array<{
    id: number;
    eventType: string;
    tenantId: string | null;
    userEmail: string | null;
    userDisplayName: string | null;
    policyName: string | null;
    metadata: Record<string, any>;
    createdAt: string;
  }>;
  signInsByDay: Array<{ date: string; count: number }>;
  conversionsByDay: Array<{ date: string; count: number }>;
  topTenants: Array<{ tenantId: string; signIns: number; conversions: number }>;
}> {
  const [
    totalSignInsResult,
    totalConversionsResult,
    uniqueTenantsResult,
    uniqueUsersResult,
    recentEventsResult,
    signInsByDayResult,
    conversionsByDayResult,
    topTenantsResult,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'sign_in'`),
    pool.query(`SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'conversion'`),
    pool.query(`SELECT COUNT(DISTINCT tenant_id) as count FROM analytics_events WHERE tenant_id IS NOT NULL`),
    pool.query(`SELECT COUNT(DISTINCT user_email) as count FROM analytics_events WHERE user_email IS NOT NULL`),
    pool.query(
      `SELECT id, event_type, tenant_id, user_email, user_display_name, policy_name, metadata, created_at
       FROM analytics_events ORDER BY created_at DESC LIMIT 50`
    ),
    pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM analytics_events WHERE event_type = 'sign_in' AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date`
    ),
    pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM analytics_events WHERE event_type = 'conversion' AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date`
    ),
    pool.query(
      `SELECT tenant_id,
              COUNT(*) FILTER (WHERE event_type = 'sign_in') as sign_ins,
              COUNT(*) FILTER (WHERE event_type = 'conversion') as conversions
       FROM analytics_events WHERE tenant_id IS NOT NULL
       GROUP BY tenant_id ORDER BY sign_ins DESC LIMIT 20`
    ),
  ]);

  return {
    totalSignIns: parseInt(totalSignInsResult.rows[0].count),
    totalConversions: parseInt(totalConversionsResult.rows[0].count),
    uniqueTenants: parseInt(uniqueTenantsResult.rows[0].count),
    uniqueUsers: parseInt(uniqueUsersResult.rows[0].count),
    recentEvents: recentEventsResult.rows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      tenantId: row.tenant_id,
      userEmail: row.user_email,
      userDisplayName: row.user_display_name,
      policyName: row.policy_name,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    })),
    signInsByDay: signInsByDayResult.rows.map((row) => ({
      date: row.date,
      count: parseInt(row.count),
    })),
    conversionsByDay: conversionsByDayResult.rows.map((row) => ({
      date: row.date,
      count: parseInt(row.count),
    })),
    topTenants: topTenantsResult.rows.map((row) => ({
      tenantId: row.tenant_id,
      signIns: parseInt(row.sign_ins),
      conversions: parseInt(row.conversions),
    })),
  };
}
