import { createServer as createHttpServer } from 'http';
import { signCreditData, getPublicKey } from './signing.js';
import type { JubjubPoint } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

export function createServer(providerSk: bigint, providerId: number) {
  const providerPk: JubjubPoint = getPublicKey(providerSk);

  const handler = (req: any, res: any) => {
    const cors = () => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    };

    cors();

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parseBody = (cb: (body: any) => void) => {
      let data = '';
      req.on('data', (chunk: any) => (data += chunk));
      req.on('end', () => {
        try { cb(JSON.parse(data)); }
        catch { cb({}); }
      });
    };

    const send = (status: number, body: any) => {
      const json = JSON.stringify(body);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(json);
    };

    if (req.method === 'POST' && req.url === '/attest') {
      parseBody((body) => {
        try {
          if (body.inflow0 == null || body.userPubKeyHash == null) {
            send(400, { error: 'Missing required fields' });
            return;
          }
          const userPubKeyHash = BigInt(body.userPubKeyHash);
          const signature = signCreditData(
            providerSk,
            body.inflow0, body.inflow1, body.inflow2,
            body.inflow3, body.inflow4, body.inflow5,
            body.liquidAssets, body.monthlyDebtService,
            userPubKeyHash,
          );
          send(200, {
            signature: {
              announcement: {
                x: signature.announcement.x.toString(),
                y: signature.announcement.y.toString(),
              },
              response: signature.response.toString(),
            },
          });
        } catch (err: any) {
          send(500, { error: err.message });
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/provider-info') {
      send(200, {
        providerId,
        publicKey: {
          x: providerPk.x.toString(),
          y: providerPk.y.toString(),
        },
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      send(200, { status: 'ok', providerId });
      return;
    }

    send(404, { error: 'Not found' });
  };

  return createHttpServer(handler);
}
