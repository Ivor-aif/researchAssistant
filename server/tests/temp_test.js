
import http from 'http';

async function run() {
  // 1. Login
    const loginData = JSON.stringify({ username: 'testuser_' + Date.now(), password: 'password123' });
    const token = await new Promise((resolve, reject) => {
        const req = http.request('http://localhost:3000/auth/login', { // Assuming port 3000 based on app.js? No, usually 3000 or 4000. app.js handles frontend. server/index.js handles backend.
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
        }, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            if (res.statusCode === 200) {
                resolve(JSON.parse(data).token);
            } else {
                // Try registering if login fails (or just register first)
                register().then(resolve).catch(reject);
            }
        });
        });
        req.on('error', reject);
        req.write(loginData);
        req.end();
    });

    async function register() {
        return new Promise((resolve, reject) => {
            const req = http.request('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    // After register, login to get token
                    const lReq = http.request('http://localhost:3000/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    }, lRes => {
                        let lData = '';
                        lRes.on('data', c => lData += c);
                        lRes.on('end', () => resolve(JSON.parse(lData).token));
                    });
                    lReq.write(loginData);
                    lReq.end();
                });
            });
            req.write(loginData);
            req.end();
        });
    }
    
    // Actually, let's check the port first.
    }
