import express, { Request, Response } from 'express';
import expressWs, { Application } from 'express-ws';
import { wsConnection } from 'utils/ws_connection';
import { conversationHandler } from 'api/handlers/conversation';
import { sessionStartHandler, sessionEndHandler } from 'api/handlers/session';
import WebSocket from 'ws';
import cors from 'cors';

// Create express app with WebSocket support
const app = express();
const wsApp = expressWs(app);
const wsInstance = wsApp.app as Application & { ws: (path: string, handler: (ws: WebSocket) => void) => void };

// Enable CORS for all routes
wsInstance.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Add type for global.activeWsConnections
if (!(global as any).activeWsConnections) {
  (global as any).activeWsConnections = new Map<string, WebSocket>();
}
const activeWsConnections = new Map<string, WebSocket>();

// Store pending context for sessions that haven't connected yet
const pendingContext = new Map<string, any>();

// Store session context for REST API fallback
const sessionContext = new Map<string, any>();

// Create a wrapper for WebSocket to match ConnectionWithContext interface
class WebSocketWrapper {
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  async send(name: string, payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ name, payload }), (err) => {
            if (err) reject(err);
            else resolve();
          });
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('WebSocket is not open'));
      }
    });
  }
}

export function setupWebSocketRoutes(app: Application) {
  wsInstance.ws('/ws', (ws: WebSocket) => {
    let sessionId: string | null = null;
    const wrappedWs = new WebSocketWrapper(ws);

    // Send immediate acknowledgment
    wrappedWs.send('connection', { status: 'connected' }).catch(console.error);

    ws.on('message', async (message: string) => {
      try {
        const msg = JSON.parse(message);
        console.log('Received WS message:', msg);

        // Handle session start message
        if (msg.name === 'sessionStart') {
          if (msg.payload && msg.payload.sessionId) {
            sessionId = msg.payload.sessionId;
            activeWsConnections.set(sessionId, ws);
            console.log('Registered wsConnection for session:', sessionId);
            console.log('Current activeWsConnections keys:', Array.from(activeWsConnections.keys()));

            // Store context if provided
            if (msg.payload.context) {
              sessionContext.set(sessionId, msg.payload.context);
              console.log('Stored context for session:', sessionId);
            }

            // Check if there's pending context for this session
            const pendingCtx = pendingContext.get(sessionId);
            if (pendingCtx) {
              console.log('Found pending context for session:', sessionId);
              try {
                await wrappedWs.send('context', pendingCtx);
                console.log('Sent pending context via WebSocket for session:', sessionId);
                pendingContext.delete(sessionId);
              } catch (error) {
                console.error('Error sending pending context:', error);
              }
            }

            // Send acknowledgment
            await wrappedWs.send('sessionStart', { 
              status: 'success',
              sessionId,
              message: 'Session registered successfully'
            });
            return;
          }
        }

        // Handle conversation messages
        if (msg.name === 'conversation') {
          if (!sessionId && msg.payload?.sessionId) {
            sessionId = msg.payload.sessionId;
            activeWsConnections.set(sessionId, ws);
            console.log('Registered wsConnection for session:', sessionId);
          }

          if (msg.payload?.text) {
            if (/\b(start|begin) interview\b/i.test(msg.payload.text)) {
              console.log('Interview start detected, sending initial question');
              const context = sessionContext.get(sessionId);
              if (context?.initialQuestion) {
                console.log('Found initial question in context:', context.initialQuestion);
                await wrappedWs.send('conversation', {
                  sessionId,
                  text: context.initialQuestion,
                  isInitialQuestion: true
                });
                return;
              }
            } else if (msg.payload.isInitialQuestion) {
              console.log('Sending initial question to avatar:', msg.payload.text);
              await wrappedWs.send('conversation', {
                sessionId,
                text: msg.payload.text,
                isInitialQuestion: true
              });
              return;
            }
          }
          await conversationHandler(wrappedWs, msg.payload);
          return;
        }

        // Handle other message types
        switch (msg.name) {
          case 'sessionEnd':
            await sessionEndHandler(wrappedWs, msg.payload);
            break;
          default:
            console.log(`Message name not recognized: ${msg.name}`);
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
        try {
          await wrappedWs.send('error', { 
            message: 'Error processing message',
            error: error.message 
          });
        } catch (sendError) {
          console.error('Error sending error message:', sendError);
        }
      }
    });

    ws.on('close', () => {
      if (sessionId) {
        activeWsConnections.delete(sessionId);
        console.log('Removed wsConnection for session:', sessionId);
        console.log('Current activeWsConnections keys:', Array.from(activeWsConnections.keys()));
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (sessionId) {
        activeWsConnections.delete(sessionId);
      }
    });
  });

  // Update the context endpoint to handle both WebSocket and REST
  wsInstance.post('/api/session/context', async (req: Request, res: Response) => {
    const { sessionId, context, useWebSocket } = req.body;
    console.log('Received context for session:', sessionId);
    console.log('Using WebSocket:', useWebSocket);
    console.log('Current activeWsConnections keys:', Array.from(activeWsConnections.keys()));

    // Always store context for REST API fallback
    sessionContext.set(sessionId, context);

    if (useWebSocket) {
      const wsConnection = activeWsConnections.get(sessionId);
      if (wsConnection) {
        try {
          const wrappedWs = new WebSocketWrapper(wsConnection);
          await wrappedWs.send('context', context);
          console.log('Context sent via WebSocket for session:', sessionId);
          res.status(200).json({ success: true, message: 'Context delivered in real-time via WebSocket' });
        } catch (error) {
          console.error('Error sending context via WebSocket:', error);
          // Fallback to REST API
          res.status(200).json({ 
            success: true, 
            message: 'Context stored for REST API delivery',
            context: context
          });
        }
      } else {
        console.log('No active WebSocket connection found, storing context for REST API');
        pendingContext.set(sessionId, context);
        res.status(200).json({ 
          success: true, 
          message: 'Context stored for REST API delivery',
          context: context
        });
      }
    } else {
      // REST API mode
      console.log('Using REST API for context delivery');
      res.status(200).json({ 
        success: true, 
        message: 'Context stored for REST API delivery',
        context: context
      });
    }
  });

  // Add endpoint to get context via REST API
  wsInstance.get('/api/session/context/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const context = sessionContext.get(sessionId);
    if (context) {
      res.status(200).json({ success: true, context });
    } else {
      res.status(404).json({ success: false, message: 'Context not found' });
    }
  });
}

export default wsInstance;
