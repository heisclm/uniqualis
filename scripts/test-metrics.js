const http = require('http');

const data = JSON.stringify({
  email: 'admin@uniqualis.edu',
  password: 'SuperSecretAdminPassword123!'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  const cookie = res.headers['set-cookie'][0].split(';')[0];
  console.log('Cookie:', cookie);
  
  const req2 = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/metrics',
    method: 'GET',
    headers: {
      'Cookie': cookie
    }
  }, (res2) => {
    let output2 = '';
    res2.on('data', (d) => output2 += d);
    res2.on('end', () => {
      console.log('Status 2:', res2.statusCode);
      console.log('Body:', output2);
    });
  });
  req2.end();
});
req.write(data);
req.end();
