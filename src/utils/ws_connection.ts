import WebSocket from 'ws';

function buildMessage(name: string, payload: object): string {
  return JSON.stringify({ name: name, payload: payload });
}

export class Connection {
  async send(name: string, payload: object) {
    throw new Error('Send function not implemented');
  }
}

export class wsConnection extends Connection {
  ws: WebSocket;
  constructor(websocket: WebSocket) {
    super();
    this.ws = websocket;
  }

  async send(name: string, payload: object) {
    this.ws.send(buildMessage(name, payload));
  }
}
