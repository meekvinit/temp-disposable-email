const EventEmitter = require('events');
const smtpServer = require('./smtp');
const apiServerFactory = require('./api');
const db = require('./db');
const config = require('./config');

class App extends EventEmitter { }
const appEvents = new App();

// Wrap db.saveEmail to emit events
const originalSaveEmail = db.saveEmail;
db.saveEmail = function (...args) {
    const result = originalSaveEmail.apply(this, args);
    // args: inboxId, from, to, subject, text, html
    appEvents.emit('email_received', {
        inbox_id: args[0],
        from_addr: args[1],
        subject: args[3],
        created_at: new Date().toISOString(),
        snippet: (args[4] || '').substring(0, 50)
    });
    return result;
};

// Start Cleanup Worker
setInterval(() => {
    console.log('Running cleanup...');
    const info = db.deleteOldEmails(config.EMAIL_RETENTION_MINUTES);
    if (info.changes > 0) console.log(`Deleted ${info.changes} old emails`);
}, 60 * 1000 * 5); // Every 5 minutes

// Start Servers
(async () => {
    try {
        await smtpServer.start();
        const api = apiServerFactory(appEvents);
        await api.start();

        console.log('Disposable Email Service Backend Started!');
        console.log(`SMTP: ${config.SMTP_PORT}`);
        console.log(`API: ${config.PORT}`);
    } catch (err) {
        console.error('Failed to start servers', err);
        process.exit(1);
    }
})();
