const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const db = require('./db');
const config = require('./config');

const server = new SMTPServer({
    disabledCommands: ['AUTH'], // No authentication required suitable for inbound trash mail
    onData(stream, session, callback) {
        simpleParser(stream, (err, parsed) => {
            if (err) {
                console.error('Error parsing email:', err);
                return callback(new Error('Error parsing email'));
            }

            const { from, to, subject, text, html } = parsed;

            // Extract the TO address to identify the inbox
            // In a real scenario, we might handle multiple recipients, but for now take the first valid one
            // The 'to' field from mailparser returns an object or array.

            let inboxId = 'unknown';
            if (to && to.value && to.value.length > 0) {
                // Extract local part (before @) to use as inbox ID
                const address = to.value[0].address;
                inboxId = address.split('@')[0];
            }

            // Normalize inbox ID (case insensitive, or just the user part)
            // For simplicity, we store the full address as inbox_id
            const fromAddr = from && from.value && from.value.length > 0 ? from.value[0].address : 'unknown';

            console.log(`Received email for ${inboxId} from ${fromAddr}`);

            try {
                db.saveEmail(inboxId, fromAddr, inboxId, subject || '(No Subject)', text, html);
                callback(); // Accept the email
            } catch (e) {
                console.error('Error saving email to DB:', e);
                callback(new Error('Internal storage error'));
            }
        });
    },
    onRcptTo(address, session, callback) {
        // Open relay check could happen here, but for a disposable service we generally accept all valid local domains
        // For now, accept everything.
        callback();
    }
});

module.exports = {
    start: () => {
        return new Promise((resolve, reject) => {
            server.listen(config.SMTP_PORT, config.SMTP_BIND_ADDR, () => {
                console.log(`SMTP Server listening on ${config.SMTP_BIND_ADDR}:${config.SMTP_PORT} for domain ${config.EMAIL_DOMAIN}`);
                resolve(server);
            });
            server.on('error', reject);
        });
    }
};
