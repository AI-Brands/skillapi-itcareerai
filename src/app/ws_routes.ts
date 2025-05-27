import express, { Request, Response } from 'express';
import expressWs, { Application } from 'express-ws';
import { wsConnection } from 'utils/ws_connection';
import { conversationHandler } from 'api/handlers/conversation';
import { sessionStartHandler, sessionEndHandler } from 'api/handlers/session';
import { WebSocket, WebSocketServer } from 'ws';
import cors from 'cors';
import { IncomingMessage } from 'http';
import { URL } from 'url';

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

// Define the SessionContext type since it's not exported from smskillsdk
interface SessionContext {
  [key: string]: any;
}

// Store active WebSocket connections
const activeWsConnections = new Map<string, WebSocket>();
const sessionContext = new Map<string, SessionContext>();
const pendingContext = new Map<string, SessionContext>();
const connectionTimeouts = new Map<string, NodeJS.Timeout>();

// Create a wrapper for WebSocket to match ConnectionWithContext interface
class WebSocketWrapper {
  private ws: WebSocket;
  public context?: any;
  public sessionId?: string;

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  async send(name: string, payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) {
        try {
          console.log(`Sending ${name} message:`, payload);
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

export function setupWebSocketServer(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      ws.close(1008, 'Missing sessionId parameter');
      return;
    }

    // Handle incoming messages
    ws.on('message', async (data: string) => {
      try {
        const msg = JSON.parse(data);

        switch (msg.type) {
          case 'context':
            if (msg.payload?.context) {
              // Store the WebSocket connection
              activeWsConnections.set(sessionId, ws);

              // Store the context
              sessionContext.set(sessionId, msg.payload.context);

              // Check if there's a pending context
              const pendingCtx = pendingContext.get(sessionId);
              if (pendingCtx) {
                // Send the pending context
                ws.send(JSON.stringify({
                  type: 'context',
                  payload: { context: pendingCtx }
                }));
                // Clear the pending context
                pendingContext.delete(sessionId);
              }
            }
            break;

          case 'reconnect':
            // Store the WebSocket connection
            activeWsConnections.set(sessionId, ws);

            // Send the stored context if available
            const context = sessionContext.get(sessionId);
            if (context) {
              ws.send(JSON.stringify({
                type: 'context',
                payload: { context }
              }));
            }
            break;

          default:
            console.warn('Unknown message type:', msg.type);
        }
      } catch (error: unknown) {
        console.error('Error handling message:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        ws.send(JSON.stringify({
          type: 'error',
          payload: {
            error: errorMessage
          }
        }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      activeWsConnections.delete(sessionId);
    });
  });
}

// Function to send message to a specific session
export function sendToSession(sessionId: string, message: any) {
  const ws = activeWsConnections.get(sessionId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Function to store context for a session that hasn't connected yet
export function storePendingContext(sessionId: string, context: SessionContext) {
  pendingContext.set(sessionId, context);
}

// Function to check if a session is connected
export function isSessionConnected(sessionId: string): boolean {
  const ws = activeWsConnections.get(sessionId);
  return ws?.readyState === WebSocket.OPEN;
}

export function setupWebSocketRoutes(app: Application) {
  wsInstance.ws('/ws', (ws: WebSocket) => {
    let sessionId: string | null = null;
    const wrappedWs = new WebSocketWrapper(ws);

    // Send immediate acknowledgment
    wrappedWs.send('connection', { status: 'connected' }).catch(console.error);

    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000); // Send ping every 30 seconds

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

            // Store context if provided
            if (msg.payload.context) {
              console.log('Received context for session:', sessionId, msg.payload.context);
              sessionContext.set(sessionId, msg.payload.context);
              console.log('Stored context for session:', sessionId);

              // Send acknowledgment
              await wrappedWs.send('sessionStart', { 
                status: 'success',
                sessionId,
                message: 'Session registered successfully'
              });

              // Send initial greeting if context exists
              const context = sessionContext.get(sessionId);
              if (context) {
                console.log('Sending initial greeting with context:', context);
                const greeting = `Hello ${context.name}! I'll be conducting your ${context.stage} interview for the ${context.jobTitle} position at ${context.company}. `;
                const stageMessage = context.stage === 'intro' ? 
                  "This is an initial screening call to get to know you better." :
                  context.stage === 'behavioral' ?
                  "I'll be asking you about your past experiences and how you've handled different situations." :
                  context.stage === 'technical' ?
                  "I'll be asking you technical questions to assess your knowledge and problem-solving abilities." :
                  context.stage === 'situational' ?
                  "I'll be presenting you with hypothetical scenarios to understand how you would handle them." :
                  "I'll be asking questions to understand how well you align with our company culture.";

                const difficultyMessage = context.difficulty === 'beginner' ?
                  "I'll keep the questions at a beginner level to help you get comfortable with the interview process." :
                  context.difficulty === 'intermediate' ?
                  "I'll ask questions at an intermediate level to challenge you appropriately." :
                  "I'll ask advanced questions to thoroughly assess your expertise.";

                const locationMessage = context.location ? 
                  ` I see you're interested in the ${context.location} location.` : '';

                const fullGreeting = greeting + stageMessage + difficultyMessage + locationMessage;

                console.log('Sending greeting:', fullGreeting);
                await wrappedWs.send('conversation', {
                  sessionId,
                  text: fullGreeting,
                  isGreeting: true
                });

                // Send initial question after a short delay
                if (context.initialQuestion) {
                  console.log('Sending initial question:', context.initialQuestion);
                  setTimeout(async () => {
                    await wrappedWs.send('conversation', {
                      sessionId,
                      text: context.initialQuestion,
                      isInitialQuestion: true
                    });
                  }, 2000);
                }
              }
            }
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
            console.log('Received conversation message:', msg.payload);
            
            // Get the latest context for this session
            const context = sessionContext.get(sessionId);
            if (!context) {
              console.error('No context found for session:', sessionId);
              await wrappedWs.send('error', {
                message: 'No interview context found. Please restart the session.',
                error: 'Missing context'
              });
              return;
            }

            // Handle name-related questions
            if (msg.payload.text.toLowerCase().includes('what is my name') || 
                msg.payload.text.toLowerCase().includes('what should i call you')) {
              console.log('Name question detected, responding with context:', context);
              await wrappedWs.send('conversation', {
                sessionId,
                text: `Your name is ${context.name}. You can call me your interview coach.`,
                isResponse: true
              });
              return;
            }

            // Handle start interview command
            if (/\b(start|begin) interview\b/i.test(msg.payload.text)) {
              console.log('Interview start detected');
              if (context?.initialQuestion) {
                console.log('Sending initial question:', context.initialQuestion);
                await wrappedWs.send('conversation', {
                  sessionId,
                  text: context.initialQuestion,
                  isInitialQuestion: true
                });
                return;
              }
            }

            // Add context to the connection
            wrappedWs.context = context;
            wrappedWs.sessionId = sessionId;

            const response = await conversationHandler(wrappedWs, msg.payload);
            if (response) {
              console.log('Sending conversation response:', response);
              await wrappedWs.send('conversation', {
                sessionId,
                text: response,
                isResponse: true
              });
            }
          }
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
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        } catch (sendError) {
          console.error('Error sending error message:', sendError);
        }
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      if (sessionId) {
        activeWsConnections.delete(sessionId);
        console.log('WebSocket connection closed for session:', sessionId);
      }
      clearInterval(pingInterval);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (sessionId) {
        activeWsConnections.delete(sessionId);
      }
      clearInterval(pingInterval);
    });

    // Handle pong
    ws.on('pong', () => {
      console.log('Received pong from client');
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

