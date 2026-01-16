const fastify = require('fastify')({ logger: true });
const config = require('./config');
const db = require('./db');
const cors = require('@fastify/cors');

// Enable CORS
fastify.register(cors, {
    origin: true // Allow all for development flexibility
});

// SSE Clients
let clients = [];

function broadcast(event, data) {
    clients.forEach(client => {
        client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    });
}

// Check for new emails periodically (Basic polling for SSE broadcast trigger or use DB triggers ideally)
// For simplicity in this SQLite setup, we can poll or let the Frontend poll. 
// BUT, to satisfy "Real-time SSE", we should trigger broadcast when email is saved.
// We can modify db.js to emit an event, or just wrap the save call.
// For now, let's export a notify function that smtp.js can call, OR just use frontend polling if SSE is too complex for 'better-sqlite3' multi-process. 
// Wait, we are single process Node.js. easy.

module.exports = (smtpEvents) => {

    // API Routes

    fastify.get('/api/address', async (req, reply) => {
        const random = Math.random().toString(36).substring(7);
        const domain = config.EMAIL_DOMAIN;
        return { address: `${random}@${domain}` };
    });

    // Get messages for an inbox
    fastify.get('/api/inbox/:id', async (req, reply) => {
        const { id } = req.params;
        const emails = db.getEmails(id);
        return { emails };
    });

    // Get full message
    fastify.get('/api/message/:id', async (req, reply) => {
        const { id } = req.params;
        const email = db.getEmailById(id);
        if (!email) return reply.code(404).send({ error: 'Not found' });
        return email;
    });

    // SSE Endpoint
    fastify.get('/api/events', async (req, reply) => {
        const { inbox } = req.query;
        console.log(`SSE Client connected for inbox: ${inbox}`);

        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        const client = { res: reply.raw, inbox };
        clients.push(client);

        req.raw.on('close', () => {
            clients = clients.filter(c => c !== client);
            console.log('SSE Client disconnected');
        });
    });

    // Trigger SSE broadcast
    smtpEvents.on('email_received', (email) => {
        // Filter clients watching this inbox
        clients.filter(c => c.inbox === email.inbox_id).forEach(c => {
            c.res.write(`event: new_email\ndata: ${JSON.stringify(email)}\n\n`);
        });
    });

    return {
        start: async () => {
            try {
                await fastify.listen({ port: config.PORT, host: config.HOST });
                console.log(`API Server running at http://${config.HOST}:${config.PORT}`);
            } catch (err) {
                fastify.log.error(err);
                process.exit(1);
            }
        }
    };
};
