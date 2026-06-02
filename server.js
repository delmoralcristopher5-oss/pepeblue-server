const https = require('https');
const http = require('http');

const ACCESS_TOKEN = 'APP_USR-3880768931038695-053019-306e8c3c0847c6c68dec02289be0b00f-224863757';
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/crear-pago') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { items } = JSON.parse(body);
        const preference = {
          items: items.map(item => ({
            title: item.name,
            quantity: Number(item.qty),
            unit_price: Number(item.price),
            currency_id: 'MXN'
          })),
          back_urls: {
            success: 'https://sparkling-sopapillas-301d4f.netlify.app/?pago=exitoso',
            failure: 'https://sparkling-sopapillas-301d4f.netlify.app/?pago=fallido',
            pending: 'https://sparkling-sopapillas-301d4f.netlify.app/?pago=pendiente'
          },
          auto_return: 'approved',
          statement_descriptor: 'PEPEBLUE',
          external_reference: 'pepeblue-' + Date.now()
        };

        const data = JSON.stringify(preference);
        const options = {
          hostname: 'api.mercadopago.com',
          path: '/checkout/preferences',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          }
        };

        const mpReq = https.request(options, (mpRes) => {
          let mpBody = '';
          mpRes.on('data', chunk => mpBody += chunk);
          mpRes.on('end', () => {
            const result = JSON.parse(mpBody);
            if (result.init_point) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ url: result.init_point }));
            } else {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Error MercadoPago', detail: result }));
            }
          });
        });

        mpReq.on('error', (err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });

        mpReq.write(data);
        mpReq.end();

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error al procesar' }));
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Pepe&Blue Payment Server OK');
  }
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
