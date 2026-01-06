import http from 'http';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        
        const req = http.request(`${BASE_URL}${path}`, options, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, body: json });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        const username = 'test_user_' + Date.now();
        const password = 'password123';
        
        // 1. Register
        console.log('Registering...');
        let res = await request('POST', '/auth/register', { username, password });
        if (res.status !== 200) throw new Error('Register failed: ' + JSON.stringify(res.body));
        
        // 2. Login
        console.log('Logging in...');
        res = await request('POST', '/auth/login', { username, password });
        if (res.status !== 200) throw new Error('Login failed: ' + JSON.stringify(res.body));
        const token = res.body.token;
        
        // 3. Get initial settings
        console.log('Getting settings...');
        res = await request('GET', '/config/settings', null, token);
        console.log('Initial settings:', res.body);
        
        // 4. Update settings with new fields
        console.log('Updating settings...');
        const newSettings = {
        timezone: 'Asia/Shanghai',
        author_name: 'San Zhang',
        affiliations: ['University A', 'Institute B'],
        email: 'san.zhang@example.com',
        email_url: 'https://example.com/contact'
        };
        res = await request('POST', '/config/settings', newSettings, token);
        if (res.status !== 200) throw new Error('Update failed: ' + JSON.stringify(res.body));
        
        // 5. Verify update
        console.log('Verifying settings...');
        res = await request('GET', '/config/settings', null, token);
        console.log('Updated settings:', res.body);
        
        if (res.body.author_name !== newSettings.author_name) throw new Error('Author name mismatch');
        if (JSON.stringify(res.body.affiliations) !== JSON.stringify(newSettings.affiliations)) throw new Error('Affiliations mismatch');
        if (res.body.email !== newSettings.email) throw new Error('Email mismatch');
        if (res.body.email_url !== newSettings.email_url) throw new Error('Email URL mismatch');
        
        console.log('TEST PASSED');
    } catch (e) {
        console.error('TEST FAILED:', e);
        process.exit(1);
    }
}

run();