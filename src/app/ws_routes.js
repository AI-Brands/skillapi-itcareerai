"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocketRoutes = setupWebSocketRoutes;
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const conversation_1 = require("api/handlers/conversation");
const session_1 = require("api/handlers/session");
const ws_1 = __importDefault(require("ws"));
const cors_1 = __importDefault(require("cors"));
const ws_connection_1 = require("../utils/ws_connection");
// Create express app with WebSocket support
const app = (0, express_1.default)();
const wsApp = (0, express_ws_1.default)(app);
const wsInstance = wsApp.app;
// Enable CORS for all routes
wsInstance.use((0, cors_1.default)({
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
// Add type for global.activeWsConnections
if (!global.activeWsConnections) {
    global.activeWsConnections = new Map();
}
const activeWsConnections = new Map();
// Store pending context for sessions that haven't connected yet
const pendingContext = new Map();
// Store session context for REST API fallback
const sessionContext = new Map();
// Create a wrapper for WebSocket to match ConnectionWithContext interface
class WebSocketWrapper {
    constructor(ws) {
        this.ws = ws;
    }
    async send(name, payload) {
        return new Promise((resolve, reject) => {
            if (this.ws.readyState === ws_1.default.OPEN) {
                try {
                    this.ws.send(JSON.stringify({ name, payload }), (err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                }
                catch (error) {
                    reject(error);
                }
            }
            else {
                reject(new Error('WebSocket is not open'));
            }
        });
    }
}
const router = express_1.default.Router();
const sessions = new Map();
// WebSocket connection handler
router.ws('/ws', (ws) => {
    let sessionId = null;
    ws.on('message', async (message) => {
        var _a;
        try {
            const msg = JSON.parse(message);
            const connection = new ws_connection_1.Connection(ws);
            if (msg.type === 'start_session') {
                sessionId = msg.sessionId;
                if (!sessionId) {
                    throw new Error('Session ID is required');
                }
                // Store the WebSocket connection
                activeWsConnections.set(sessionId, ws);
                // Check if we have context for this session
                if ((_a = msg.payload) === null || _a === void 0 ? void 0 : _a.context) {
                    sessionContext.set(sessionId, msg.payload.context);
                }
                // Check if we have pending context
                const pendingCtx = pendingContext.get(sessionId);
                if (pendingCtx) {
                    sessionContext.set(sessionId, pendingCtx);
                    pendingContext.delete(sessionId);
                }
                // Handle session start
                await (0, session_1.sessionStartHandler)(connection, { sessionId });
            }
            else if (msg.type === 'end_session') {
                if (!sessionId) {
                    throw new Error('Session ID is required');
                }
                // Handle session end
                await (0, session_1.sessionEndHandler)(connection, { sessionId });
                // Clean up
                activeWsConnections.delete(sessionId);
                sessionContext.delete(sessionId);
                sessionId = null;
            }
            else if (msg.type === 'conversation') {
                if (!sessionId) {
                    throw new Error('Session ID is required');
                }
                // Get context for this session
                const context = sessionContext.get(sessionId);
                if (context) {
                    connection.context = context;
                }
                // Handle conversation
                await (0, conversation_1.conversationHandler)(connection, { ...msg, sessionId });
            }
        }
        catch (error) {
            console.error('WebSocket error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            }));
        }
    });
    ws.on('close', () => {
        if (sessionId) {
            activeWsConnections.delete(sessionId);
            sessionContext.delete(sessionId);
        }
    });
});
// Helper functions
function handleStartInterview(sessionId, data) {
    const ws = sessions.get(sessionId);
    if (!ws)
        return;
    // Store session context
    const context = {
        sessionId,
        startTime: Date.now(),
        ...data.context
    };
    // Send initial greeting
    ws.send(JSON.stringify({
        type: 'avatar_message',
        message: "Hello, I'm your interview coach. Let's begin the interview.",
        timestamp: Date.now()
    }));
    // Send initial question after a short delay
    setTimeout(() => {
        ws.send(JSON.stringify({
            type: 'avatar_message',
            message: data.initialQuestion,
            timestamp: Date.now()
        }));
    }, 2000);
}
function handleUserMessage(sessionId, data) {
    const ws = sessions.get(sessionId);
    if (!ws)
        return;
    // Process user message and generate avatar response
    // This is where you'd integrate with your AI/avatar system
    ws.send(JSON.stringify({
        type: 'avatar_message',
        message: `I understand you said: "${data.message}"`,
        timestamp: Date.now()
    }));
}
function handleEndInterview(sessionId) {
    const ws = sessions.get(sessionId);
    if (!ws)
        return;
    ws.send(JSON.stringify({
        type: 'interview_ended',
        message: 'Interview session ended',
        timestamp: Date.now()
    }));
    // Clean up
    sessions.delete(sessionId);
}
function setupWebSocketRoutes(app) {
    wsInstance.ws('/ws', (ws) => {
        let sessionId = null;
        const wrappedWs = new WebSocketWrapper(ws);
        // Send immediate acknowledgment
        wrappedWs.send('connection', { status: 'connected' }).catch(console.error);
        ws.on('message', async (message) => {
            var _a, _b;
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
                            }
                            catch (error) {
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
                    if (!sessionId && ((_a = msg.payload) === null || _a === void 0 ? void 0 : _a.sessionId)) {
                        sessionId = msg.payload.sessionId;
                        activeWsConnections.set(sessionId, ws);
                        console.log('Registered wsConnection for session:', sessionId);
                    }
                    if ((_b = msg.payload) === null || _b === void 0 ? void 0 : _b.text) {
                        if (/\b(start|begin) interview\b/i.test(msg.payload.text)) {
                            console.log('Interview start detected, sending initial question');
                            const context = sessionContext.get(sessionId);
                            if (context === null || context === void 0 ? void 0 : context.initialQuestion) {
                                console.log('Found initial question in context:', context.initialQuestion);
                                await wrappedWs.send('conversation', {
                                    sessionId,
                                    text: context.initialQuestion,
                                    isInitialQuestion: true
                                });
                                return;
                            }
                        }
                        else if (msg.payload.isInitialQuestion) {
                            console.log('Sending initial question to avatar:', msg.payload.text);
                            await wrappedWs.send('conversation', {
                                sessionId,
                                text: msg.payload.text,
                                isInitialQuestion: true
                            });
                            return;
                        }
                    }
                    await (0, conversation_1.conversationHandler)(wrappedWs, msg.payload);
                    return;
                }
                // Handle other message types
                switch (msg.name) {
                    case 'sessionEnd':
                        await (0, session_1.sessionEndHandler)(wrappedWs, msg.payload);
                        break;
                    default:
                        console.log(`Message name not recognized: ${msg.name}`);
                        break;
                }
            }
            catch (error) {
                console.error('Error handling message:', error);
                try {
                    await wrappedWs.send('error', {
                        message: 'Error processing message',
                        error: error.message
                    });
                }
                catch (sendError) {
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
    wsInstance.post('/api/session/context', async (req, res) => {
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
                }
                catch (error) {
                    console.error('Error sending context via WebSocket:', error);
                    // Fallback to REST API
                    res.status(200).json({
                        success: true,
                        message: 'Context stored for REST API delivery',
                        context: context
                    });
                }
            }
            else {
                console.log('No active WebSocket connection found, storing context for REST API');
                pendingContext.set(sessionId, context);
                res.status(200).json({
                    success: true,
                    message: 'Context stored for REST API delivery',
                    context: context
                });
            }
        }
        else {
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
    wsInstance.get('/api/session/context/:sessionId', (req, res) => {
        const { sessionId } = req.params;
        const context = sessionContext.get(sessionId);
        if (context) {
            res.status(200).json({ success: true, context });
        }
        else {
            res.status(404).json({ success: false, message: 'Context not found' });
        }
    });
}
exports.default = wsInstance;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3Nfcm91dGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid3Nfcm91dGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBbU1BLG9EQW9MQztBQXZYRCxzREFBcUQ7QUFDckQsNERBQW9EO0FBRXBELDREQUFnRTtBQUNoRSxrREFBOEU7QUFDOUUsNENBQTJCO0FBQzNCLGdEQUF3QjtBQUV4QiwwREFBb0Q7QUFFcEQsNENBQTRDO0FBQzVDLE1BQU0sR0FBRyxHQUFHLElBQUEsaUJBQU8sR0FBRSxDQUFDO0FBQ3RCLE1BQU0sS0FBSyxHQUFHLElBQUEsb0JBQVMsRUFBQyxHQUFHLENBQUMsQ0FBQztBQUM3QixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsR0FBcUYsQ0FBQztBQUUvRyw2QkFBNkI7QUFDN0IsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFBLGNBQUksRUFBQztJQUNsQixNQUFNLEVBQUUsR0FBRyxFQUFFLG9DQUFvQztJQUNqRCxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQztJQUNuQyxjQUFjLEVBQUUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDO0lBQ2pELFdBQVcsRUFBRSxJQUFJO0NBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBRUosMENBQTBDO0FBQzFDLElBQUksQ0FBRSxNQUFjLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUN4QyxNQUFjLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7QUFDckUsQ0FBQztBQUNELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7QUFFekQsZ0VBQWdFO0FBQ2hFLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7QUFFOUMsOENBQThDO0FBQzlDLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7QUFFOUMsMEVBQTBFO0FBQzFFLE1BQU0sZ0JBQWdCO0lBR3BCLFlBQVksRUFBYTtRQUN2QixJ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QztRQUM5QyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ1osR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDbkQsQ0FBQzthQUFNLENBQUM7WUFDTixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQztRQUN6RSxDQUFDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsa0JBQWUsVUFBVSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MsIHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcbmltcG9ydCBleHByZXNzV3MsIHsgQXBwbGljYXRpb24gfSBmcm9tICdleHByZXNzLXdzJztcbmltcG9ydCB7IHdzQ29ubmVjdGlvbiB9IGZyb20gJ3V0aWxzL3dzX2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHsgY29udmVyc2F0aW9uSGFuZGxlciB9IGZyb20gJ2FwaS9oYW5kbGVycy9jb252ZXJzYXRpb24nO1xuaW1wb3J0IHsgc2Vzc2lvblN0YXJ0SGFuZGxlciwgc2Vzc2lvbkVuZEhhbmRsZXIgfSBmcm9tICdhcGkvaGFuZGxlcnMvc2Vzc2lvbic7XG5pbXBvcnQgV2ViU29ja2V0IGZyb20gJ3dzJztcbmltcG9ydCBjb3JzIGZyb20gJ2NvcnMnO1xuaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5pbXBvcnQgeyBDb25uZWN0aW9uIH0gZnJvbSAnLi4vdXRpbHMvd3NfY29ubmVjdGlvbic7XG5cbi8vIENyZWF0ZSBleHByZXNzIGFwcCB3aXRoIFdlYlNvY2tldCBzdXBwb3J0XG5jb25zdCBhcHAgPSBleHByZXNzKCk7XG5jb25zdCB3c0FwcCA9IGV4cHJlc3NXcyhhcHApO1xuY29uc3Qgd3NJbnN0YW5jZSA9IHdzQXBwLmFwcCBhcyBBcHBsaWNhdGlvbiAmIHsgd3M6IChwYXRoOiBzdHJpbmcsIGhhbmRsZXI6ICh3czogV2ViU29ja2V0KSA9PiB2b2lkKSA9PiB2b2lkIH07XG5cbi8vIEVuYWJsZSBDT1JTIGZvciBhbGwgcm91dGVzXG53c0luc3RhbmNlLnVzZShjb3JzKHtcbiAgb3JpZ2luOiAnKicsIC8vIEFsbG93IGFsbCBvcmlnaW5zIGZvciBkZXZlbG9wbWVudFxuICBtZXRob2RzOiBbJ0dFVCcsICdQT1NUJywgJ09QVElPTlMnXSxcbiAgYWxsb3dlZEhlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ0F1dGhvcml6YXRpb24nXSxcbiAgY3JlZGVudGlhbHM6IHRydWVcbn0pKTtcblxuLy8gQWRkIHR5cGUgZm9yIGdsb2JhbC5hY3RpdmVXc0Nvbm5lY3Rpb25zXG5pZiAoIShnbG9iYWwgYXMgYW55KS5hY3RpdmVXc0Nvbm5lY3Rpb25zKSB7XG4gIChnbG9iYWwgYXMgYW55KS5hY3RpdmVXc0Nvbm5lY3Rpb25zID0gbmV3IE1hcDxzdHJpbmcsIFdlYlNvY2tldD4oKTtcbn1cbmNvbnN0IGFjdGl2ZVdzQ29ubmVjdGlvbnMgPSBuZXcgTWFwPHN0cmluZywgV2ViU29ja2V0PigpO1xuXG4vLyBTdG9yZSBwZW5kaW5nIGNvbnRleHQgZm9yIHNlc3Npb25zIHRoYXQgaGF2ZW4ndCBjb25uZWN0ZWQgeWV0XG5jb25zdCBwZW5kaW5nQ29udGV4dCA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XG5cbi8vIFN0b3JlIHNlc3Npb24gY29udGV4dCBmb3IgUkVTVCBBUEkgZmFsbGJhY2tcbmNvbnN0IHNlc3Npb25Db250ZXh0ID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcblxuLy8gQ3JlYXRlIGEgd3JhcHBlciBmb3IgV2ViU29ja2V0IHRvIG1hdGNoIENvbm5lY3Rpb25XaXRoQ29udGV4dCBpbnRlcmZhY2VcbmNsYXNzIFdlYlNvY2tldFdyYXBwZXIge1xuICBwcml2YXRlIHdzOiBXZWJTb2NrZXQ7XG5cbiAgY29uc3RydWN0b3Iod3M6IFdlYlNvY2tldCkge1xuICAgIHRoaXMud3MgPSB3cztcbiAgfVxuXG4gIGFzeW5jIHNlbmQobmFtZTogc3RyaW5nLCBwYXlsb2FkOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKHRoaXMud3MucmVhZHlTdGF0ZSA9PT0gV2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aGlzLndzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBuYW1lLCBwYXlsb2FkIH0pLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIGVsc2UgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1dlYlNvY2tldCBpcyBub3Qgb3BlbicpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5jb25zdCByb3V0ZXIgPSBleHByZXNzLlJvdXRlcigpO1xuY29uc3Qgc2Vzc2lvbnMgPSBuZXcgTWFwPHN0cmluZywgV2ViU29ja2V0PigpO1xuXG4vLyBXZWJTb2NrZXQgY29ubmVjdGlvbiBoYW5kbGVyXG5yb3V0ZXIud3MoJy93cycsICh3czogV2ViU29ja2V0KSA9PiB7XG4gIGxldCBzZXNzaW9uSWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gIHdzLm9uKCdtZXNzYWdlJywgYXN5bmMgKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtc2cgPSBKU09OLnBhcnNlKG1lc3NhZ2UpO1xuICAgICAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKHdzKTtcblxuICAgICAgaWYgKG1zZy50eXBlID09PSAnc3RhcnRfc2Vzc2lvbicpIHtcbiAgICAgICAgc2Vzc2lvbklkID0gbXNnLnNlc3Npb25JZDtcbiAgICAgICAgaWYgKCFzZXNzaW9uSWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Nlc3Npb24gSUQgaXMgcmVxdWlyZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0b3JlIHRoZSBXZWJTb2NrZXQgY29ubmVjdGlvblxuICAgICAgICBhY3RpdmVXc0Nvbm5lY3Rpb25zLnNldChzZXNzaW9uSWQsIHdzKTtcblxuICAgICAgICAvLyBDaGVjayBpZiB3ZSBoYXZlIGNvbnRleHQgZm9yIHRoaXMgc2Vzc2lvblxuICAgICAgICBpZiAobXNnLnBheWxvYWQ/LmNvbnRleHQpIHtcbiAgICAgICAgICBzZXNzaW9uQ29udGV4dC5zZXQoc2Vzc2lvbklkLCBtc2cucGF5bG9hZC5jb250ZXh0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgcGVuZGluZyBjb250ZXh0XG4gICAgICAgIGNvbnN0IHBlbmRpbmdDdHggPSBwZW5kaW5nQ29udGV4dC5nZXQoc2Vzc2lvbklkKTtcbiAgICAgICAgaWYgKHBlbmRpbmdDdHgpIHtcbiAgICAgICAgICBzZXNzaW9uQ29udGV4dC5zZXQoc2Vzc2lvbklkLCBwZW5kaW5nQ3R4KTtcbiAgICAgICAgICBwZW5kaW5nQ29udGV4dC5kZWxldGUoc2Vzc2lvbklkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBzZXNzaW9uIHN0YXJ0XG4gICAgICAgIGF3YWl0IHNlc3Npb25TdGFydEhhbmRsZXIoY29ubmVjdGlvbiwgeyBzZXNzaW9uSWQgfSk7XG4gICAgICB9IGVsc2UgaWYgKG1zZy50eXBlID09PSAnZW5kX3Nlc3Npb24nKSB7XG4gICAgICAgIGlmICghc2Vzc2lvbklkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTZXNzaW9uIElEIGlzIHJlcXVpcmVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgc2Vzc2lvbiBlbmRcbiAgICAgICAgYXdhaXQgc2Vzc2lvbkVuZEhhbmRsZXIoY29ubmVjdGlvbiwgeyBzZXNzaW9uSWQgfSk7XG5cbiAgICAgICAgLy8gQ2xlYW4gdXBcbiAgICAgICAgYWN0aXZlV3NDb25uZWN0aW9ucy5kZWxldGUoc2Vzc2lvbklkKTtcbiAgICAgICAgc2Vzc2lvbkNvbnRleHQuZGVsZXRlKHNlc3Npb25JZCk7XG4gICAgICAgIHNlc3Npb25JZCA9IG51bGw7XG4gICAgICB9IGVsc2UgaWYgKG1zZy50eXBlID09PSAnY29udmVyc2F0aW9uJykge1xuICAgICAgICBpZiAoIXNlc3Npb25JZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU2Vzc2lvbiBJRCBpcyByZXF1aXJlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IGNvbnRleHQgZm9yIHRoaXMgc2Vzc2lvblxuICAgICAgICBjb25zdCBjb250ZXh0ID0gc2Vzc2lvbkNvbnRleHQuZ2V0KHNlc3Npb25JZCk7XG4gICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgY29ubmVjdGlvbi5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBjb252ZXJzYXRpb25cbiAgICAgICAgYXdhaXQgY29udmVyc2F0aW9uSGFuZGxlcihjb25uZWN0aW9uLCB7IC4uLm1zZywgc2Vzc2lvbklkIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdXZWJTb2NrZXQgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgfSkpO1xuICAgIH1cbiAgfSk7XG5cbiAgd3Mub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgIGlmIChzZXNzaW9uSWQpIHtcbiAgICAgIGFjdGl2ZVdzQ29ubmVjdGlvbnMuZGVsZXRlKHNlc3Npb25JZCk7XG4gICAgICBzZXNzaW9uQ29udGV4dC5kZWxldGUoc2Vzc2lvbklkKTtcbiAgICB9XG4gIH0pO1xufSk7XG5cbi8vIEhlbHBlciBmdW5jdGlvbnNcbmZ1bmN0aW9uIGhhbmRsZVN0YXJ0SW50ZXJ2aWV3KHNlc3Npb25JZDogc3RyaW5nLCBkYXRhOiBhbnkpIHtcbiAgY29uc3Qgd3MgPSBzZXNzaW9ucy5nZXQoc2Vzc2lvbklkKTtcbiAgaWYgKCF3cykgcmV0dXJuO1xuXG4gIC8vIFN0b3JlIHNlc3Npb24gY29udGV4dFxuICBjb25zdCBjb250ZXh0ID0ge1xuICAgIHNlc3Npb25JZCxcbiAgICBzdGFydFRpbWU6IERhdGUubm93KCksXG4gICAgLi4uZGF0YS5jb250ZXh0XG4gIH07XG5cbiAgLy8gU2VuZCBpbml0aWFsIGdyZWV0aW5nXG4gIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgIHR5cGU6ICdhdmF0YXJfbWVzc2FnZScsXG4gICAgbWVzc2FnZTogXCJIZWxsbywgSSdtIHlvdXIgaW50ZXJ2aWV3IGNvYWNoLiBMZXQncyBiZWdpbiB0aGUgaW50ZXJ2aWV3LlwiLFxuICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxuICB9KSk7XG5cbiAgLy8gU2VuZCBpbml0aWFsIHF1ZXN0aW9uIGFmdGVyIGEgc2hvcnQgZGVsYXlcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICB0eXBlOiAnYXZhdGFyX21lc3NhZ2UnLFxuICAgICAgbWVzc2FnZTogZGF0YS5pbml0aWFsUXVlc3Rpb24sXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICB9KSk7XG4gIH0sIDIwMDApO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVVc2VyTWVzc2FnZShzZXNzaW9uSWQ6IHN0cmluZywgZGF0YTogYW55KSB7XG4gIGNvbnN0IHdzID0gc2Vzc2lvbnMuZ2V0KHNlc3Npb25JZCk7XG4gIGlmICghd3MpIHJldHVybjtcblxuICAvLyBQcm9jZXNzIHVzZXIgbWVzc2FnZSBhbmQgZ2VuZXJhdGUgYXZhdGFyIHJlc3BvbnNlXG4gIC8vIFRoaXMgaXMgd2hlcmUgeW91J2QgaW50ZWdyYXRlIHdpdGggeW91ciBBSS9hdmF0YXIgc3lzdGVtXG4gIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgIHR5cGU6ICdhdmF0YXJfbWVzc2FnZScsXG4gICAgbWVzc2FnZTogYEkgdW5kZXJzdGFuZCB5b3Ugc2FpZDogXCIke2RhdGEubWVzc2FnZX1cImAsXG4gICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gIH0pKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlRW5kSW50ZXJ2aWV3KHNlc3Npb25JZDogc3RyaW5nKSB7XG4gIGNvbnN0IHdzID0gc2Vzc2lvbnMuZ2V0KHNlc3Npb25JZCk7XG4gIGlmICghd3MpIHJldHVybjtcblxuICB3cy5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICB0eXBlOiAnaW50ZXJ2aWV3X2VuZGVkJyxcbiAgICBtZXNzYWdlOiAnSW50ZXJ2aWV3IHNlc3Npb24gZW5kZWQnLFxuICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxuICB9KSk7XG5cbiAgLy8gQ2xlYW4gdXBcbiAgc2Vzc2lvbnMuZGVsZXRlKHNlc3Npb25JZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXR1cFdlYlNvY2tldFJvdXRlcyhhcHA6IEFwcGxpY2F0aW9uKSB7XG4gIHdzSW5zdGFuY2Uud3MoJy93cycsICh3czogV2ViU29ja2V0KSA9PiB7XG4gICAgbGV0IHNlc3Npb25JZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgY29uc3Qgd3JhcHBlZFdzID0gbmV3IFdlYlNvY2tldFdyYXBwZXIod3MpO1xuXG4gICAgLy8gU2VuZCBpbW1lZGlhdGUgYWNrbm93bGVkZ21lbnRcbiAgICB3cmFwcGVkV3Muc2VuZCgnY29ubmVjdGlvbicsIHsgc3RhdHVzOiAnY29ubmVjdGVkJyB9KS5jYXRjaChjb25zb2xlLmVycm9yKTtcblxuICAgIHdzLm9uKCdtZXNzYWdlJywgYXN5bmMgKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbXNnID0gSlNPTi5wYXJzZShtZXNzYWdlKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1JlY2VpdmVkIFdTIG1lc3NhZ2U6JywgbXNnKTtcblxuICAgICAgICAvLyBIYW5kbGUgc2Vzc2lvbiBzdGFydCBtZXNzYWdlXG4gICAgICAgIGlmIChtc2cubmFtZSA9PT0gJ3Nlc3Npb25TdGFydCcpIHtcbiAgICAgICAgICBpZiAobXNnLnBheWxvYWQgJiYgbXNnLnBheWxvYWQuc2Vzc2lvbklkKSB7XG4gICAgICAgICAgICBzZXNzaW9uSWQgPSBtc2cucGF5bG9hZC5zZXNzaW9uSWQ7XG4gICAgICAgICAgICBhY3RpdmVXc0Nvbm5lY3Rpb25zLnNldChzZXNzaW9uSWQsIHdzKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZWdpc3RlcmVkIHdzQ29ubmVjdGlvbiBmb3Igc2Vzc2lvbjonLCBzZXNzaW9uSWQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0N1cnJlbnQgYWN0aXZlV3NDb25uZWN0aW9ucyBrZXlzOicsIEFycmF5LmZyb20oYWN0aXZlV3NDb25uZWN0aW9ucy5rZXlzKCkpKTtcblxuICAgICAgICAgICAgLy8gU3RvcmUgY29udGV4dCBpZiBwcm92aWRlZFxuICAgICAgICAgICAgaWYgKG1zZy5wYXlsb2FkLmNvbnRleHQpIHtcbiAgICAgICAgICAgICAgc2Vzc2lvbkNvbnRleHQuc2V0KHNlc3Npb25JZCwgbXNnLnBheWxvYWQuY29udGV4dCk7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTdG9yZWQgY29udGV4dCBmb3Igc2Vzc2lvbjonLCBzZXNzaW9uSWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSdzIHBlbmRpbmcgY29udGV4dCBmb3IgdGhpcyBzZXNzaW9uXG4gICAgICAgICAgICBjb25zdCBwZW5kaW5nQ3R4ID0gcGVuZGluZ0NvbnRleHQuZ2V0KHNlc3Npb25JZCk7XG4gICAgICAgICAgICBpZiAocGVuZGluZ0N0eCkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRm91bmQgcGVuZGluZyBjb250ZXh0IGZvciBzZXNzaW9uOicsIHNlc3Npb25JZCk7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgd3JhcHBlZFdzLnNlbmQoJ2NvbnRleHQnLCBwZW5kaW5nQ3R4KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnU2VudCBwZW5kaW5nIGNvbnRleHQgdmlhIFdlYlNvY2tldCBmb3Igc2Vzc2lvbjonLCBzZXNzaW9uSWQpO1xuICAgICAgICAgICAgICAgIHBlbmRpbmdDb250ZXh0LmRlbGV0ZShzZXNzaW9uSWQpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgcGVuZGluZyBjb250ZXh0OicsIGVycm9yKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZW5kIGFja25vd2xlZGdtZW50XG4gICAgICAgICAgICBhd2FpdCB3cmFwcGVkV3Muc2VuZCgnc2Vzc2lvblN0YXJ0JywgeyBcbiAgICAgICAgICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXG4gICAgICAgICAgICAgIHNlc3Npb25JZCxcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ1Nlc3Npb24gcmVnaXN0ZXJlZCBzdWNjZXNzZnVsbHknXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgY29udmVyc2F0aW9uIG1lc3NhZ2VzXG4gICAgICAgIGlmIChtc2cubmFtZSA9PT0gJ2NvbnZlcnNhdGlvbicpIHtcbiAgICAgICAgICBpZiAoIXNlc3Npb25JZCAmJiBtc2cucGF5bG9hZD8uc2Vzc2lvbklkKSB7XG4gICAgICAgICAgICBzZXNzaW9uSWQgPSBtc2cucGF5bG9hZC5zZXNzaW9uSWQ7XG4gICAgICAgICAgICBhY3RpdmVXc0Nvbm5lY3Rpb25zLnNldChzZXNzaW9uSWQsIHdzKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZWdpc3RlcmVkIHdzQ29ubmVjdGlvbiBmb3Igc2Vzc2lvbjonLCBzZXNzaW9uSWQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChtc2cucGF5bG9hZD8udGV4dCkge1xuICAgICAgICAgICAgaWYgKC9cXGIoc3RhcnR8YmVnaW4pIGludGVydmlld1xcYi9pLnRlc3QobXNnLnBheWxvYWQudGV4dCkpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludGVydmlldyBzdGFydCBkZXRlY3RlZCwgc2VuZGluZyBpbml0aWFsIHF1ZXN0aW9uJyk7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBzZXNzaW9uQ29udGV4dC5nZXQoc2Vzc2lvbklkKTtcbiAgICAgICAgICAgICAgaWYgKGNvbnRleHQ/LmluaXRpYWxRdWVzdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdGb3VuZCBpbml0aWFsIHF1ZXN0aW9uIGluIGNvbnRleHQ6JywgY29udGV4dC5pbml0aWFsUXVlc3Rpb24pO1xuICAgICAgICAgICAgICAgIGF3YWl0IHdyYXBwZWRXcy5zZW5kKCdjb252ZXJzYXRpb24nLCB7XG4gICAgICAgICAgICAgICAgICBzZXNzaW9uSWQsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBjb250ZXh0LmluaXRpYWxRdWVzdGlvbixcbiAgICAgICAgICAgICAgICAgIGlzSW5pdGlhbFF1ZXN0aW9uOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1zZy5wYXlsb2FkLmlzSW5pdGlhbFF1ZXN0aW9uKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTZW5kaW5nIGluaXRpYWwgcXVlc3Rpb24gdG8gYXZhdGFyOicsIG1zZy5wYXlsb2FkLnRleHQpO1xuICAgICAgICAgICAgICBhd2FpdCB3cmFwcGVkV3Muc2VuZCgnY29udmVyc2F0aW9uJywge1xuICAgICAgICAgICAgICAgIHNlc3Npb25JZCxcbiAgICAgICAgICAgICAgICB0ZXh0OiBtc2cucGF5bG9hZC50ZXh0LFxuICAgICAgICAgICAgICAgIGlzSW5pdGlhbFF1ZXN0aW9uOiB0cnVlXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IGNvbnZlcnNhdGlvbkhhbmRsZXIod3JhcHBlZFdzLCBtc2cucGF5bG9hZCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIG90aGVyIG1lc3NhZ2UgdHlwZXNcbiAgICAgICAgc3dpdGNoIChtc2cubmFtZSkge1xuICAgICAgICAgIGNhc2UgJ3Nlc3Npb25FbmQnOlxuICAgICAgICAgICAgYXdhaXQgc2Vzc2lvbkVuZEhhbmRsZXIod3JhcHBlZFdzLCBtc2cucGF5bG9hZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc29sZS5sb2coYE1lc3NhZ2UgbmFtZSBub3QgcmVjb2duaXplZDogJHttc2cubmFtZX1gKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBoYW5kbGluZyBtZXNzYWdlOicsIGVycm9yKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCB3cmFwcGVkV3Muc2VuZCgnZXJyb3InLCB7IFxuICAgICAgICAgICAgbWVzc2FnZTogJ0Vycm9yIHByb2Nlc3NpbmcgbWVzc2FnZScsXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSBcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoc2VuZEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2VuZGluZyBlcnJvciBtZXNzYWdlOicsIHNlbmRFcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHdzLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgIGlmIChzZXNzaW9uSWQpIHtcbiAgICAgICAgYWN0aXZlV3NDb25uZWN0aW9ucy5kZWxldGUoc2Vzc2lvbklkKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1JlbW92ZWQgd3NDb25uZWN0aW9uIGZvciBzZXNzaW9uOicsIHNlc3Npb25JZCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdDdXJyZW50IGFjdGl2ZVdzQ29ubmVjdGlvbnMga2V5czonLCBBcnJheS5mcm9tKGFjdGl2ZVdzQ29ubmVjdGlvbnMua2V5cygpKSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB3cy5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1dlYlNvY2tldCBlcnJvcjonLCBlcnJvcik7XG4gICAgICBpZiAoc2Vzc2lvbklkKSB7XG4gICAgICAgIGFjdGl2ZVdzQ29ubmVjdGlvbnMuZGVsZXRlKHNlc3Npb25JZCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIC8vIFVwZGF0ZSB0aGUgY29udGV4dCBlbmRwb2ludCB0byBoYW5kbGUgYm90aCBXZWJTb2NrZXQgYW5kIFJFU1RcbiAgd3NJbnN0YW5jZS5wb3N0KCcvYXBpL3Nlc3Npb24vY29udGV4dCcsIGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcbiAgICBjb25zdCB7IHNlc3Npb25JZCwgY29udGV4dCwgdXNlV2ViU29ja2V0IH0gPSByZXEuYm9keTtcbiAgICBjb25zb2xlLmxvZygnUmVjZWl2ZWQgY29udGV4dCBmb3Igc2Vzc2lvbjonLCBzZXNzaW9uSWQpO1xuICAgIGNvbnNvbGUubG9nKCdVc2luZyBXZWJTb2NrZXQ6JywgdXNlV2ViU29ja2V0KTtcbiAgICBjb25zb2xlLmxvZygnQ3VycmVudCBhY3RpdmVXc0Nvbm5lY3Rpb25zIGtleXM6JywgQXJyYXkuZnJvbShhY3RpdmVXc0Nvbm5lY3Rpb25zLmtleXMoKSkpO1xuXG4gICAgLy8gQWx3YXlzIHN0b3JlIGNvbnRleHQgZm9yIFJFU1QgQVBJIGZhbGxiYWNrXG4gICAgc2Vzc2lvbkNvbnRleHQuc2V0KHNlc3Npb25JZCwgY29udGV4dCk7XG5cbiAgICBpZiAodXNlV2ViU29ja2V0KSB7XG4gICAgICBjb25zdCB3c0Nvbm5lY3Rpb24gPSBhY3RpdmVXc0Nvbm5lY3Rpb25zLmdldChzZXNzaW9uSWQpO1xuICAgICAgaWYgKHdzQ29ubmVjdGlvbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHdyYXBwZWRXcyA9IG5ldyBXZWJTb2NrZXRXcmFwcGVyKHdzQ29ubmVjdGlvbik7XG4gICAgICAgICAgYXdhaXQgd3JhcHBlZFdzLnNlbmQoJ2NvbnRleHQnLCBjb250ZXh0KTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnQ29udGV4dCBzZW50IHZpYSBXZWJTb2NrZXQgZm9yIHNlc3Npb246Jywgc2Vzc2lvbklkKTtcbiAgICAgICAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdDb250ZXh0IGRlbGl2ZXJlZCBpbiByZWFsLXRpbWUgdmlhIFdlYlNvY2tldCcgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2VuZGluZyBjb250ZXh0IHZpYSBXZWJTb2NrZXQ6JywgZXJyb3IpO1xuICAgICAgICAgIC8vIEZhbGxiYWNrIHRvIFJFU1QgQVBJXG4gICAgICAgICAgcmVzLnN0YXR1cygyMDApLmpzb24oeyBcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsIFxuICAgICAgICAgICAgbWVzc2FnZTogJ0NvbnRleHQgc3RvcmVkIGZvciBSRVNUIEFQSSBkZWxpdmVyeScsXG4gICAgICAgICAgICBjb250ZXh0OiBjb250ZXh0XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdObyBhY3RpdmUgV2ViU29ja2V0IGNvbm5lY3Rpb24gZm91bmQsIHN0b3JpbmcgY29udGV4dCBmb3IgUkVTVCBBUEknKTtcbiAgICAgICAgcGVuZGluZ0NvbnRleHQuc2V0KHNlc3Npb25JZCwgY29udGV4dCk7XG4gICAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgXG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSwgXG4gICAgICAgICAgbWVzc2FnZTogJ0NvbnRleHQgc3RvcmVkIGZvciBSRVNUIEFQSSBkZWxpdmVyeScsXG4gICAgICAgICAgY29udGV4dDogY29udGV4dFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUkVTVCBBUEkgbW9kZVxuICAgICAgY29uc29sZS5sb2coJ1VzaW5nIFJFU1QgQVBJIGZvciBjb250ZXh0IGRlbGl2ZXJ5Jyk7XG4gICAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7IFxuICAgICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgICAgbWVzc2FnZTogJ0NvbnRleHQgc3RvcmVkIGZvciBSRVNUIEFQSSBkZWxpdmVyeScsXG4gICAgICAgIGNvbnRleHQ6IGNvbnRleHRcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gQWRkIGVuZHBvaW50IHRvIGdldCBjb250ZXh0IHZpYSBSRVNUIEFQSVxuICB3c0luc3RhbmNlLmdldCgnL2FwaS9zZXNzaW9uL2NvbnRleHQvOnNlc3Npb25JZCcsIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcbiAgICBjb25zdCB7IHNlc3Npb25JZCB9ID0gcmVxLnBhcmFtcztcbiAgICBjb25zdCBjb250ZXh0ID0gc2Vzc2lvbkNvbnRleHQuZ2V0KHNlc3Npb25JZCk7XG4gICAgaWYgKGNvbnRleHQpIHtcbiAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3VjY2VzczogdHJ1ZSwgY29udGV4dCB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ0NvbnRleHQgbm90IGZvdW5kJyB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCB3c0luc3RhbmNlO1xuIl19