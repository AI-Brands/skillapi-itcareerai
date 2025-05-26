"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationHandler = void 0;
const sessionMemory = {};
/**
 * Conversation handler
 *
 * This is the main handler for processing user messages. It receives
 * the user's message and should return a response.
 */
const conversationHandler = async (connection, message) => {
    const sessionId = message.sessionId;
    const userMessage = message.text;
    if (!sessionId) {
        throw new Error('Session ID is required');
    }
    // Initialize session memory if it doesn't exist
    if (!sessionMemory[sessionId]) {
        sessionMemory[sessionId] = {};
    }
    // Handle the conversation based on the message type
    if (message.type === 'start_interview') {
        const { context, initialQuestion } = message.data;
        connection.context.context = context;
        connection.context.initialQuestion = initialQuestion;
        const fullGreeting = `Hello! I'm your interview assistant. ${context}`;
        await connection.send('conversation', {
            text: fullGreeting,
            meta: { endConversation: false },
            memory: sessionMemory[sessionId]
        });
        // Send the initial question after a short delay
        setTimeout(async () => {
            if (initialQuestion) {
                await connection.send('conversation', {
                    text: initialQuestion,
                    meta: { endConversation: false },
                    memory: sessionMemory[sessionId]
                });
            }
            else {
                await connection.send('conversation', {
                    text: "Let's begin! Please introduce yourself.",
                    meta: { endConversation: false },
                    memory: sessionMemory[sessionId]
                });
            }
        }, 1000);
    }
    else if (message.type === 'user_message') {
        // Process user's message and generate a response
        const response = await processUserMessage(userMessage, sessionMemory[sessionId]);
        await connection.send('conversation', {
            text: response,
            meta: { endConversation: false },
            memory: sessionMemory[sessionId]
        });
    }
    else if (message.type === 'end_interview') {
        // Clean up session memory
        delete sessionMemory[sessionId];
        await connection.send('conversation', {
            text: 'Thank you for the interview! Have a great day!',
            meta: { endConversation: true },
            memory: {}
        });
    }
};
exports.conversationHandler = conversationHandler;
async function processUserMessage(message, memory) {
    // Here you would typically integrate with your AI/LLM service
    // For now, we'll return a simple response
    return `I understand you said: "${message}". Could you elaborate more on that?`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVyc2F0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29udmVyc2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQTBCQSxNQUFNLGFBQWEsR0FBa0IsRUFBRSxDQUFDO0FBRXhDOzs7OztHQUtHO0FBQ0ksTUFBTSxtQkFBbUIsR0FBRyxLQUFLLEVBQUUsVUFBc0IsRUFBRSxPQUFZLEVBQUUsRUFBRTtJQUNoRixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO0lBQ3BDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFFakMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxnREFBZ0Q7SUFDaEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1FBQzlCLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELG9EQUFvRDtJQUNwRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssaUJBQWlCLEVBQUUsQ0FBQztRQUN2QyxNQUFNLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDbEQsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3JDLFVBQVUsQ0FBQyxPQUFPLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUVyRCxNQUFNLFlBQVksR0FBRyx3Q0FBd0MsT0FBTyxFQUFFLENBQUM7UUFDdkUsTUFBTSxVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUNwQyxJQUFJLEVBQUUsWUFBWTtZQUNsQixJQUFJLEVBQUUsRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFO1lBQ2hDLE1BQU0sRUFBRSxhQUFhLENBQUMsU0FBUyxDQUFDO1NBQ2pDLENBQUMsQ0FBQztRQUVILGdEQUFnRDtRQUNoRCxVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDcEIsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtvQkFDcEMsSUFBSSxFQUFFLGVBQWU7b0JBQ3JCLElBQUksRUFBRSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUU7b0JBQ2hDLE1BQU0sRUFBRSxhQUFhLENBQUMsU0FBUyxDQUFDO2lCQUNqQyxDQUFDLENBQUM7WUFDTCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sTUFBTSxVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtvQkFDcEMsSUFBSSxFQUFFLHlDQUF5QztvQkFDL0MsSUFBSSxFQUFFLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRTtvQkFDaEMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxTQUFTLENBQUM7aUJBQ2pDLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDSCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDWCxDQUFDO1NBQU0sSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLGNBQWMsRUFBRSxDQUFDO1FBQzNDLGlEQUFpRDtRQUNqRCxNQUFNLFFBQVEsR0FBRyxNQUFNLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNqRixNQUFNLFVBQVUsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ3BDLElBQUksRUFBRSxRQUFRO1lBQ2QsSUFBSSxFQUFFLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRTtZQUNoQyxNQUFNLEVBQUUsYUFBYSxDQUFDLFNBQVMsQ0FBQztTQUNqQyxDQUFDLENBQUM7SUFDTCxDQUFDO1NBQU0sSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLGVBQWUsRUFBRSxDQUFDO1FBQzVDLDBCQUEwQjtRQUMxQixPQUFPLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNoQyxNQUFNLFVBQVUsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ3BDLElBQUksRUFBRSxnREFBZ0Q7WUFDdEQsSUFBSSxFQUFFLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRTtZQUMvQixNQUFNLEVBQUUsRUFBRTtTQUNYLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDLENBQUM7QUEzRFcsUUFBQSxtQkFBbUIsdUJBMkQ5QjtBQUVGLEtBQUssVUFBVSxrQkFBa0IsQ0FBQyxPQUFlLEVBQUUsTUFBVztJQUM1RCw4REFBOEQ7SUFDOUQsMENBQTBDO0lBQzFDLE9BQU8sMkJBQTJCLE9BQU8sc0NBQXNDLENBQUM7QUFDbEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFVzZXJDb252ZXJzYXRpb25NZXNzYWdlLFxuICBTa2lsbENvbnZlcnNhdGlvbk1lc3NhZ2UsXG59IGZyb20gJ0Bzb3VsbWFjaGluZXMvc21za2lsbHNkayc7XG5pbXBvcnQgeyBDb25uZWN0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbHMvd3NfY29ubmVjdGlvbic7XG5pbXBvcnQgeyBJbnRlcnZpZXdDb250ZXh0IH0gZnJvbSAnLi4vLi4vYXBwL3Nlc3Npb25fc3RvcmUnO1xuaW1wb3J0IHsgYWN0aXZlV3NDb25uZWN0aW9ucyB9IGZyb20gJy4vc2Vzc2lvbic7XG5cbnR5cGUgSW50ZXJ2aWV3U3RhZ2UgPSAnZ3JlZXRpbmcnIHwgJ2ludGVydmlldycgfCAnY2xvc2luZyc7XG5cbmludGVyZmFjZSBDb25uZWN0aW9uV2l0aENvbnRleHQgZXh0ZW5kcyBDb25uZWN0aW9uIHtcbiAgY29udGV4dD86IGFueTtcbiAgaW50ZXJ2aWV3U3RhZ2U/OiBzdHJpbmc7XG4gIHNlc3Npb25JZD86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIE1lc3NhZ2VWYXJpYWJsZXMge1xuICBraW5kPzogc3RyaW5nO1xuICBzZXNzaW9uSWQ/OiBzdHJpbmc7XG4gIFtrZXk6IHN0cmluZ106IGFueTtcbn1cblxuaW50ZXJmYWNlIFNlc3Npb25NZW1vcnkge1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG59XG5cbmNvbnN0IHNlc3Npb25NZW1vcnk6IFNlc3Npb25NZW1vcnkgPSB7fTtcblxuLyoqXG4gKiBDb252ZXJzYXRpb24gaGFuZGxlclxuICpcbiAqIFRoaXMgaXMgdGhlIG1haW4gaGFuZGxlciBmb3IgcHJvY2Vzc2luZyB1c2VyIG1lc3NhZ2VzLiBJdCByZWNlaXZlc1xuICogdGhlIHVzZXIncyBtZXNzYWdlIGFuZCBzaG91bGQgcmV0dXJuIGEgcmVzcG9uc2UuXG4gKi9cbmV4cG9ydCBjb25zdCBjb252ZXJzYXRpb25IYW5kbGVyID0gYXN5bmMgKGNvbm5lY3Rpb246IENvbm5lY3Rpb24sIG1lc3NhZ2U6IGFueSkgPT4ge1xuICBjb25zdCBzZXNzaW9uSWQgPSBtZXNzYWdlLnNlc3Npb25JZDtcbiAgY29uc3QgdXNlck1lc3NhZ2UgPSBtZXNzYWdlLnRleHQ7XG5cbiAgaWYgKCFzZXNzaW9uSWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Nlc3Npb24gSUQgaXMgcmVxdWlyZWQnKTtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgc2Vzc2lvbiBtZW1vcnkgaWYgaXQgZG9lc24ndCBleGlzdFxuICBpZiAoIXNlc3Npb25NZW1vcnlbc2Vzc2lvbklkXSkge1xuICAgIHNlc3Npb25NZW1vcnlbc2Vzc2lvbklkXSA9IHt9O1xuICB9XG5cbiAgLy8gSGFuZGxlIHRoZSBjb252ZXJzYXRpb24gYmFzZWQgb24gdGhlIG1lc3NhZ2UgdHlwZVxuICBpZiAobWVzc2FnZS50eXBlID09PSAnc3RhcnRfaW50ZXJ2aWV3Jykge1xuICAgIGNvbnN0IHsgY29udGV4dCwgaW5pdGlhbFF1ZXN0aW9uIH0gPSBtZXNzYWdlLmRhdGE7XG4gICAgY29ubmVjdGlvbi5jb250ZXh0LmNvbnRleHQgPSBjb250ZXh0O1xuICAgIGNvbm5lY3Rpb24uY29udGV4dC5pbml0aWFsUXVlc3Rpb24gPSBpbml0aWFsUXVlc3Rpb247XG5cbiAgICBjb25zdCBmdWxsR3JlZXRpbmcgPSBgSGVsbG8hIEknbSB5b3VyIGludGVydmlldyBhc3Npc3RhbnQuICR7Y29udGV4dH1gO1xuICAgIGF3YWl0IGNvbm5lY3Rpb24uc2VuZCgnY29udmVyc2F0aW9uJywge1xuICAgICAgdGV4dDogZnVsbEdyZWV0aW5nLFxuICAgICAgbWV0YTogeyBlbmRDb252ZXJzYXRpb246IGZhbHNlIH0sXG4gICAgICBtZW1vcnk6IHNlc3Npb25NZW1vcnlbc2Vzc2lvbklkXVxuICAgIH0pO1xuXG4gICAgLy8gU2VuZCB0aGUgaW5pdGlhbCBxdWVzdGlvbiBhZnRlciBhIHNob3J0IGRlbGF5XG4gICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICBpZiAoaW5pdGlhbFF1ZXN0aW9uKSB7XG4gICAgICAgIGF3YWl0IGNvbm5lY3Rpb24uc2VuZCgnY29udmVyc2F0aW9uJywge1xuICAgICAgICAgIHRleHQ6IGluaXRpYWxRdWVzdGlvbixcbiAgICAgICAgICBtZXRhOiB7IGVuZENvbnZlcnNhdGlvbjogZmFsc2UgfSxcbiAgICAgICAgICBtZW1vcnk6IHNlc3Npb25NZW1vcnlbc2Vzc2lvbklkXVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IGNvbm5lY3Rpb24uc2VuZCgnY29udmVyc2F0aW9uJywge1xuICAgICAgICAgIHRleHQ6IFwiTGV0J3MgYmVnaW4hIFBsZWFzZSBpbnRyb2R1Y2UgeW91cnNlbGYuXCIsXG4gICAgICAgICAgbWV0YTogeyBlbmRDb252ZXJzYXRpb246IGZhbHNlIH0sXG4gICAgICAgICAgbWVtb3J5OiBzZXNzaW9uTWVtb3J5W3Nlc3Npb25JZF1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSwgMTAwMCk7XG4gIH0gZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSAndXNlcl9tZXNzYWdlJykge1xuICAgIC8vIFByb2Nlc3MgdXNlcidzIG1lc3NhZ2UgYW5kIGdlbmVyYXRlIGEgcmVzcG9uc2VcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHByb2Nlc3NVc2VyTWVzc2FnZSh1c2VyTWVzc2FnZSwgc2Vzc2lvbk1lbW9yeVtzZXNzaW9uSWRdKTtcbiAgICBhd2FpdCBjb25uZWN0aW9uLnNlbmQoJ2NvbnZlcnNhdGlvbicsIHtcbiAgICAgIHRleHQ6IHJlc3BvbnNlLFxuICAgICAgbWV0YTogeyBlbmRDb252ZXJzYXRpb246IGZhbHNlIH0sXG4gICAgICBtZW1vcnk6IHNlc3Npb25NZW1vcnlbc2Vzc2lvbklkXVxuICAgIH0pO1xuICB9IGVsc2UgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ2VuZF9pbnRlcnZpZXcnKSB7XG4gICAgLy8gQ2xlYW4gdXAgc2Vzc2lvbiBtZW1vcnlcbiAgICBkZWxldGUgc2Vzc2lvbk1lbW9yeVtzZXNzaW9uSWRdO1xuICAgIGF3YWl0IGNvbm5lY3Rpb24uc2VuZCgnY29udmVyc2F0aW9uJywge1xuICAgICAgdGV4dDogJ1RoYW5rIHlvdSBmb3IgdGhlIGludGVydmlldyEgSGF2ZSBhIGdyZWF0IGRheSEnLFxuICAgICAgbWV0YTogeyBlbmRDb252ZXJzYXRpb246IHRydWUgfSxcbiAgICAgIG1lbW9yeToge31cbiAgICB9KTtcbiAgfVxufTtcblxuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc1VzZXJNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgbWVtb3J5OiBhbnkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAvLyBIZXJlIHlvdSB3b3VsZCB0eXBpY2FsbHkgaW50ZWdyYXRlIHdpdGggeW91ciBBSS9MTE0gc2VydmljZVxuICAvLyBGb3Igbm93LCB3ZSdsbCByZXR1cm4gYSBzaW1wbGUgcmVzcG9uc2VcbiAgcmV0dXJuIGBJIHVuZGVyc3RhbmQgeW91IHNhaWQ6IFwiJHttZXNzYWdlfVwiLiBDb3VsZCB5b3UgZWxhYm9yYXRlIG1vcmUgb24gdGhhdD9gO1xufVxuIl19