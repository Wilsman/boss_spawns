interface Env {
    DB: any;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders
            });
        }

        // Handle /api/changes endpoint
        if (url.pathname === '/api/changes') {
            try {
                if (request.method === 'GET') {
                    const since = url.searchParams.get('since');
                    let query = 'SELECT * FROM data_changes';
                    const params: any[] = [];

                    if (since) {
                        query += ' WHERE timestamp > ?';
                        params.push(parseInt(since));
                    }

                    query += ' ORDER BY timestamp DESC';

                    const { results } = await env.DB.prepare(query)
                        .bind(...params)
                        .all();

                    return new Response(JSON.stringify(results), {
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    });
                }

                if (request.method === 'POST') {
                    const changes = await request.json();

                    if (!Array.isArray(changes)) {
                        throw new Error('Invalid request body');
                    }

                    const stmt = await env.DB.prepare(`
            INSERT INTO data_changes (game_mode, map, boss, field, old_value, new_value, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

                    const batch = changes.map(change =>
                        stmt.bind(
                            change.gameMode,
                            change.map,
                            change.boss,
                            change.field,
                            change.oldValue,
                            change.newValue,
                            change.timestamp
                        )
                    );

                    await env.DB.batch(batch);

                    return new Response(JSON.stringify({ success: true }), {
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    });
                }
            } catch (error) {
                return new Response(
                    JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
                    {
                        status: 500,
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    },
};