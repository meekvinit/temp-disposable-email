const nodemailer = require('nodemailer');
const http = require('http');

async function runTest() {
    console.log('1. Sending Email...');

    // Create transporter
    let transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 2525,
        secure: false,
        tls: { rejectUnauthorized: false }
    });

    try {
        let info = await transporter.sendMail({
            from: '"Tester" <tester@example.com>',
            to: 'e2etest@localhost',
            subject: 'Verification Email',
            text: 'This is a test email to verify the disposable email service.',
            html: '<b>This is a test email</b> to verify the disposable email service.'
        });
        console.log('   Email sent: %s', info.messageId);
    } catch (e) {
        console.error('   Failed to send email:', e);
        process.exit(1);
    }

    console.log('2. Verifying via API...');

    // Check API
    const checkApi = () => {
        http.get('http://localhost:3000/api/inbox/e2etest@localhost', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.emails && json.emails.length > 0) {
                        const email = json.emails[0];
                        if (email.subject === 'Verification Email') {
                            console.log('   SUCCESS: Email found in inbox!');
                            console.log('   ID:', email.id);
                            console.log('   Subject:', email.subject);
                            process.exit(0);
                        } else {
                            console.log('   Email found but subject mismatch.');
                            process.exit(1);
                        }
                    } else {
                        console.log('   Inbox empty. Retrying...');
                        setTimeout(checkApi, 1000);
                    }
                } catch (e) {
                    console.error('   API Error:', e);
                    process.exit(1);
                }
            });
        }).on('error', (e) => {
            console.error('   API Connection Error:', e);
            process.exit(1);
        });
    };

    setTimeout(checkApi, 1000);
}

runTest();
