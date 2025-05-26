import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { InitRequest, UserConversationMessage } from '@soulmachines/smskillsdk';
import { initHandler } from 'api/handlers/init';
import { endProjectHandler } from 'api/handlers/end_project';
import { conversationHandler } from 'api/handlers/conversation';
import { sessionContexts, InterviewContext } from './session_store';
import { storeContext, getContext, clearContext } from './session_store';

const router = express.Router();

// Add CORS middleware to allow requests from any origin in production
router.use(cors({ 
  origin: '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

// Initialize the skill
router.post(
  '/api/init',
  (request: Request, response: Response, next: NextFunction) => {
    console.log('Init Request:', JSON.stringify(request.body));
    const initRequest: InitRequest = request.body;
    initHandler(initRequest);
    response.setHeader('Content-Type', 'application/json');
    response.status(202).send({});
  },
);

// End project
router.delete(
  '/api/end-project/:id',
  (request: Request, response: Response, next: NextFunction) => {
    console.log('End Project Request:', JSON.stringify(request.params));
    const projectId = request.params.id;
    endProjectHandler(projectId);
    response.setHeader('Content-Type', 'application/json');
    response.status(202).send({});
  },
);

// Set session context
router.post('/api/session/context', async (req: Request, res: Response) => {
  const { sessionId, context } = req.body;
  
  if (!sessionId || !context) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log('Setting context for session:', sessionId, context);
  
  // Store the context
  storeContext(sessionId, context);

  // Send welcome message
  const welcomeResponse = {
    text: "Welcome to your mock interview session! When you're ready, please say 'start interview' to begin.",
  };
  console.log('Sending welcome message:', welcomeResponse);
  res.json(welcomeResponse);
});

// Get session context
router.get('/api/session/context/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const context = getContext(sessionId);
  res.json({ context });
});

// Clear session context
router.delete('/api/session/context/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  clearContext(sessionId);
  res.json({ success: true });
});

// Handle conversation
router.post('/api/execute', async (req: Request, res: Response) => {
  try {
    const { text, variables } = req.body;
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session ID' });
    }

    console.log('Conversation Request:', {
      sessionId,
      text,
      variables,
      context: sessionContexts.get(sessionId)
    });

    // Create a connection object with context
    const connection = {
      context: sessionContexts.get(sessionId),
      interviewStage: 'greeting',
      sessionId,
      send: async (type: string, data: any) => {
        console.log('Sending response:', { type, data });
        res.json(data);
      }
    };

    // Handle the conversation
    await conversationHandler(connection as any, {
      text,
      variables,
      sessionId
    } as UserConversationMessage);
  } catch (error) {
    console.error('Error handling conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
