import WebSocket from 'ws';
export interface ConnectionContext {
    initialQuestion?: string;
    context?: string;
}
export interface ConnectionWithContext {
    ws: WebSocket;
    context: ConnectionContext;
    send: (type: string, data: any) => Promise<void>;
}
export declare class Connection implements ConnectionWithContext {
    ws: WebSocket;
    context: ConnectionContext;
    constructor(ws: WebSocket, context?: ConnectionContext);
    send(type: string, data: any): Promise<void>;
}
export declare const wsConnection: Connection;
