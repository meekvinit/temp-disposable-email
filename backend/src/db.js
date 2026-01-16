const Database = require('better-sqlite3');
const config = require('./config');
const path = require('path');

const db = new Database(config.DB_PATH, { verbose: null }); // Set verbose: console.log for debugging

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inbox_id TEXT NOT NULL,
    from_addr TEXT NOT NULL,
    to_addr TEXT NOT NULL,
    subject TEXT,
    text_body TEXT,
    html_body TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_inbox_id ON emails(inbox_id);
  CREATE INDEX IF NOT EXISTS idx_created_at ON emails(created_at);
`);

module.exports = {
    // Insert a new email
    saveEmail: (inboxId, from, to, subject, text, html) => {
        const stmt = db.prepare(`
      INSERT INTO emails (inbox_id, from_addr, to_addr, subject, text_body, html_body)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        return stmt.run(inboxId, from, to, subject, text, html);
    },

    // Get emails for an inbox
    getEmails: (inboxId) => {
        const stmt = db.prepare(`
      SELECT id, from_addr, subject, created_at, substr(text_body, 1, 100) as snippet
      FROM emails
      WHERE inbox_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `);
        return stmt.all(inboxId);
    },

    // Get full email content
    getEmailById: (id) => {
        const stmt = db.prepare('SELECT * FROM emails WHERE id = ?');
        return stmt.get(id);
    },

    // Cleanup old emails
    deleteOldEmails: (minutes) => {
        const stmt = db.prepare(`
      DELETE FROM emails 
      WHERE created_at < datetime('now', '-' || ? || ' minutes')
    `);
        return stmt.run(minutes);
    }
};
