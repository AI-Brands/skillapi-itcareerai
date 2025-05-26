"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_ws_1 = __importDefault(require("express-ws"));
const rest_routes_1 = __importDefault(require("./rest_routes"));
const ws_routes_1 = __importDefault(require("./ws_routes"));
const app = (0, express_1.default)();
(0, express_ws_1.default)(app);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use(rest_routes_1.default);
app.use(ws_routes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsc0RBQThCO0FBQzlCLGdEQUF3QjtBQUN4Qiw0REFBbUM7QUFDbkMsZ0VBQXVDO0FBQ3ZDLDREQUFtQztBQUVuQyxNQUFNLEdBQUcsR0FBRyxJQUFBLGlCQUFPLEdBQUUsQ0FBQztBQUN0QixJQUFBLG9CQUFTLEVBQUMsR0FBRyxDQUFDLENBQUM7QUFFZixhQUFhO0FBQ2IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGNBQUksR0FBRSxDQUFDLENBQUM7QUFDaEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFFeEIsU0FBUztBQUNULEdBQUcsQ0FBQyxHQUFHLENBQUMscUJBQVUsQ0FBQyxDQUFDO0FBQ3BCLEdBQUcsQ0FBQyxHQUFHLENBQUMsbUJBQVEsQ0FBQyxDQUFDO0FBRWxCLDRCQUE0QjtBQUM1QixHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBVSxFQUFFLEdBQW9CLEVBQUUsR0FBcUIsRUFBRSxJQUEwQixFQUFFLEVBQUU7SUFDOUYsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDN0IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDbkIsTUFBTSxFQUFFLE9BQU87UUFDZixPQUFPLEVBQUUsdUJBQXVCO0tBQ2pDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO0FBRXRDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtJQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ25ELENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgY29ycyBmcm9tICdjb3JzJztcbmltcG9ydCBleHByZXNzV3MgZnJvbSAnZXhwcmVzcy13cyc7XG5pbXBvcnQgcmVzdFJvdXRlcyBmcm9tICcuL3Jlc3Rfcm91dGVzJztcbmltcG9ydCB3c1JvdXRlcyBmcm9tICcuL3dzX3JvdXRlcyc7XG5cbmNvbnN0IGFwcCA9IGV4cHJlc3MoKTtcbmV4cHJlc3NXcyhhcHApO1xuXG4vLyBNaWRkbGV3YXJlXG5hcHAudXNlKGNvcnMoKSk7XG5hcHAudXNlKGV4cHJlc3MuanNvbigpKTtcblxuLy8gUm91dGVzXG5hcHAudXNlKHJlc3RSb3V0ZXMpO1xuYXBwLnVzZSh3c1JvdXRlcyk7XG5cbi8vIEVycm9yIGhhbmRsaW5nIG1pZGRsZXdhcmVcbmFwcC51c2UoKGVycjogRXJyb3IsIHJlcTogZXhwcmVzcy5SZXF1ZXN0LCByZXM6IGV4cHJlc3MuUmVzcG9uc2UsIG5leHQ6IGV4cHJlc3MuTmV4dEZ1bmN0aW9uKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOicsIGVycik7XG4gIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICBzdGF0dXM6ICdlcnJvcicsXG4gICAgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcidcbiAgfSk7XG59KTtcblxuY29uc3QgUE9SVCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMzAwMDtcblxuYXBwLmxpc3RlbihQT1JULCAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKGBTZXJ2ZXIgaXMgcnVubmluZyBvbiBwb3J0ICR7UE9SVH1gKTtcbn0pO1xuIl19