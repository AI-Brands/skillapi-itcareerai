"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const session_store_1 = require("./session_store");
const uuid_1 = require("uuid");
const router = express_1.default.Router();
// Add CORS middleware to allow requests from localhost:5173
router.use((0, cors_1.default)({ origin: 'http://localhost:5173', credentials: true }));
// Add type for global.activeWsConnections
if (!global.activeWsConnections) {
    global.activeWsConnections = new Map();
}
const activeWsConnections = global.activeWsConnections;
const pendingContext = new Map();
// Initialize the skill
router.post('/api/init', async (req, res) => {
    try {
        res.json({
            status: 'success',
            message: 'Skill initialized successfully'
        });
    }
    catch (error) {
        console.error('Error initializing skill:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to initialize skill'
        });
    }
});
// End the project
router.post('/api/end_project', async (req, res) => {
    try {
        res.json({
            status: 'success',
            message: 'Project ended successfully'
        });
    }
    catch (error) {
        console.error('Error ending project:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to end project'
        });
    }
});
// Set session context
router.post('/api/session/context', async (req, res) => {
    try {
        const sessionId = req.body.sessionId || (0, uuid_1.v4)();
        const context = req.body.context;
        if (!context) {
            return res.status(400).json({
                status: 'error',
                message: 'Context is required'
            });
        }
        // Store context for the session
        pendingContext.set(sessionId, context);
        res.json({
            status: 'success',
            sessionId,
            message: 'Context stored successfully'
        });
    }
    catch (error) {
        console.error('Error setting session context:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to set session context'
        });
    }
});
// Get session context
router.get('/api/session/context/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const context = (0, session_store_1.getContext)(sessionId);
    res.json({ context });
});
// Clear session context
router.delete('/api/session/context/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    (0, session_store_1.clearContext)(sessionId);
    res.json({ success: true });
});
// Execute skill
router.post('/api/execute', async (req, res) => {
    try {
        const { sessionId, action, data } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                status: 'error',
                message: 'Session ID is required'
            });
        }
        // Handle different actions
        switch (action) {
            case 'start_interview':
                // Start interview logic
                res.json({
                    status: 'success',
                    message: 'Interview started successfully'
                });
                break;
            case 'end_interview':
                // End interview logic
                res.json({
                    status: 'success',
                    message: 'Interview ended successfully'
                });
                break;
            default:
                res.status(400).json({
                    status: 'error',
                    message: 'Invalid action'
                });
        }
    }
    catch (error) {
        console.error('Error executing skill:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to execute skill'
        });
    }
});
exports.default = router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdF9yb3V0ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXN0X3JvdXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHNEQUFtRTtBQUNuRSxnREFBd0I7QUFNeEIsbURBQXlFO0FBQ3pFLCtCQUFvQztBQUVwQyxNQUFNLE1BQU0sR0FBRyxpQkFBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRWhDLDREQUE0RDtBQUM1RCxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUEsY0FBSSxFQUFDLEVBQUUsTUFBTSxFQUFFLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFekUsMENBQTBDO0FBQzFDLElBQUksQ0FBRSxNQUFjLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztJQUN4QyxNQUFjLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQztBQUMvRCxDQUFDO0FBQ0QsTUFBTSxtQkFBbUIsR0FBc0IsTUFBYyxDQUFDLG1CQUFtQixDQUFDO0FBRWxGLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7QUFFOUMsdUJBQXVCO0FBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7SUFDMUMsSUFBSSxDQUFDO1FBQ0gsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNQLE1BQU0sRUFBRSxTQUFTO1lBQ2pCLE9BQU8sRUFBRSxnQ0FBZ0M7U0FDMUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLE1BQU0sRUFBRSxPQUFPO1lBQ2YsT0FBTyxFQUFFLDRCQUE0QjtTQUN0QyxDQUFD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LGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBleHByZXNzLCB7IFJlcXVlc3QsIFJlc3BvbnNlLCBOZXh0RnVuY3Rpb24gfSBmcm9tICdleHByZXNzJztcbmltcG9ydCBjb3JzIGZyb20gJ2NvcnMnO1xuaW1wb3J0IHsgSW5pdFJlcXVlc3QsIFVzZXJDb252ZXJzYXRpb25NZXNzYWdlIH0gZnJvbSAnQHNvdWxtYWNoaW5lcy9zbXNraWxsc2RrJztcbmltcG9ydCB7IGluaXRIYW5kbGVyIH0gZnJvbSAnYXBpL2hhbmRsZXJzL2luaXQnO1xuaW1wb3J0IHsgZW5kUHJvamVjdEhhbmRsZXIgfSBmcm9tICdhcGkvaGFuZGxlcnMvZW5kX3Byb2plY3QnO1xuaW1wb3J0IHsgY29udmVyc2F0aW9uSGFuZGxlciB9IGZyb20gJ2FwaS9oYW5kbGVycy9jb252ZXJzYXRpb24nO1xuaW1wb3J0IHsgc2Vzc2lvbkNvbnRleHRzLCBJbnRlcnZpZXdDb250ZXh0IH0gZnJvbSAnLi9zZXNzaW9uX3N0b3JlJztcbmltcG9ydCB7IHN0b3JlQ29udGV4dCwgZ2V0Q29udGV4dCwgY2xlYXJDb250ZXh0IH0gZnJvbSAnLi9zZXNzaW9uX3N0b3JlJztcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuXG5jb25zdCByb3V0ZXIgPSBleHByZXNzLlJvdXRlcigpO1xuXG4vLyBBZGQgQ09SUyBtaWRkbGV3YXJlIHRvIGFsbG93IHJlcXVlc3RzIGZyb20gbG9jYWxob3N0OjUxNzNcbnJvdXRlci51c2UoY29ycyh7IG9yaWdpbjogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTE3MycsIGNyZWRlbnRpYWxzOiB0cnVlIH0pKTtcblxuLy8gQWRkIHR5cGUgZm9yIGdsb2JhbC5hY3RpdmVXc0Nvbm5lY3Rpb25zXG5pZiAoIShnbG9iYWwgYXMgYW55KS5hY3RpdmVXc0Nvbm5lY3Rpb25zKSB7XG4gIChnbG9iYWwgYXMgYW55KS5hY3RpdmVXc0Nvbm5lY3Rpb25zID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcbn1cbmNvbnN0IGFjdGl2ZVdzQ29ubmVjdGlvbnM6IE1hcDxzdHJpbmcsIGFueT4gPSAoZ2xvYmFsIGFzIGFueSkuYWN0aXZlV3NDb25uZWN0aW9ucztcblxuY29uc3QgcGVuZGluZ0NvbnRleHQgPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xuXG4vLyBJbml0aWFsaXplIHRoZSBza2lsbFxucm91dGVyLnBvc3QoJy9hcGkvaW5pdCcsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIHJlcy5qc29uKHtcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxuICAgICAgbWVzc2FnZTogJ1NraWxsIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseSdcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbml0aWFsaXppbmcgc2tpbGw6JywgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gaW5pdGlhbGl6ZSBza2lsbCdcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8vIEVuZCB0aGUgcHJvamVjdFxucm91dGVyLnBvc3QoJy9hcGkvZW5kX3Byb2plY3QnLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgdHJ5IHtcbiAgICByZXMuanNvbih7XG4gICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgIG1lc3NhZ2U6ICdQcm9qZWN0IGVuZGVkIHN1Y2Nlc3NmdWxseSdcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBlbmRpbmcgcHJvamVjdDonLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBlbmQgcHJvamVjdCdcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8vIFNldCBzZXNzaW9uIGNvbnRleHRcbnJvdXRlci5wb3N0KCcvYXBpL3Nlc3Npb24vY29udGV4dCcsIGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHNlc3Npb25JZCA9IHJlcS5ib2R5LnNlc3Npb25JZCB8fCB1dWlkdjQoKTtcbiAgICBjb25zdCBjb250ZXh0ID0gcmVxLmJvZHkuY29udGV4dDtcblxuICAgIGlmICghY29udGV4dCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgICBtZXNzYWdlOiAnQ29udGV4dCBpcyByZXF1aXJlZCdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFN0b3JlIGNvbnRleHQgZm9yIHRoZSBzZXNzaW9uXG4gICAgcGVuZGluZ0NvbnRleHQuc2V0KHNlc3Npb25JZCwgY29udGV4dCk7XG5cbiAgICByZXMuanNvbih7XG4gICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgIHNlc3Npb25JZCxcbiAgICAgIG1lc3NhZ2U6ICdDb250ZXh0IHN0b3JlZCBzdWNjZXNzZnVsbHknXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3Igc2V0dGluZyBzZXNzaW9uIGNvbnRleHQ6JywgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gc2V0IHNlc3Npb24gY29udGV4dCdcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8vIEdldCBzZXNzaW9uIGNvbnRleHRcbnJvdXRlci5nZXQoJy9hcGkvc2Vzc2lvbi9jb250ZXh0LzpzZXNzaW9uSWQnLCAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIGNvbnN0IHsgc2Vzc2lvbklkIH0gPSByZXEucGFyYW1zO1xuICBjb25zdCBjb250ZXh0ID0gZ2V0Q29udGV4dChzZXNzaW9uSWQpO1xuICByZXMuanNvbih7IGNvbnRleHQgfSk7XG59KTtcblxuLy8gQ2xlYXIgc2Vzc2lvbiBjb250ZXh0XG5yb3V0ZXIuZGVsZXRlKCcvYXBpL3Nlc3Npb24vY29udGV4dC86c2Vzc2lvbklkJywgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICBjb25zdCB7IHNlc3Npb25JZCB9ID0gcmVxLnBhcmFtcztcbiAgY2xlYXJDb250ZXh0KHNlc3Npb25JZCk7XG4gIHJlcy5qc29uKHsgc3VjY2VzczogdHJ1ZSB9KTtcbn0pO1xuXG4vLyBFeGVjdXRlIHNraWxsXG5yb3V0ZXIucG9zdCgnL2FwaS9leGVjdXRlJywgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBzZXNzaW9uSWQsIGFjdGlvbiwgZGF0YSB9ID0gcmVxLmJvZHk7XG5cbiAgICBpZiAoIXNlc3Npb25JZCkge1xuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcbiAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxuICAgICAgICBtZXNzYWdlOiAnU2Vzc2lvbiBJRCBpcyByZXF1aXJlZCdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBkaWZmZXJlbnQgYWN0aW9uc1xuICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICBjYXNlICdzdGFydF9pbnRlcnZpZXcnOlxuICAgICAgICAvLyBTdGFydCBpbnRlcnZpZXcgbG9naWNcbiAgICAgICAgcmVzLmpzb24oe1xuICAgICAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxuICAgICAgICAgIG1lc3NhZ2U6ICdJbnRlcnZpZXcgc3RhcnRlZCBzdWNjZXNzZnVsbHknXG4gICAgICAgIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2VuZF9pbnRlcnZpZXcnOlxuICAgICAgICAvLyBFbmQgaW50ZXJ2aWV3IGxvZ2ljXG4gICAgICAgIHJlcy5qc29uKHtcbiAgICAgICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcbiAgICAgICAgICBtZXNzYWdlOiAnSW50ZXJ2aWV3IGVuZGVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgfSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgICAgICBtZXNzYWdlOiAnSW52YWxpZCBhY3Rpb24nXG4gICAgICAgIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBleGVjdXRpbmcgc2tpbGw6JywgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcbiAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gZXhlY3V0ZSBza2lsbCdcbiAgICB9KTtcbiAgfVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjtcbiJdfQ==