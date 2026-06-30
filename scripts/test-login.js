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
  let output = '';
  res.on('data', (d) => {
    output += d;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', output);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
