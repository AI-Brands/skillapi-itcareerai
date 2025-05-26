"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsConnection = exports.Connection = void 0;
const ws_1 = __importDefault(require("ws"));
class Connection {
    constructor(ws, context = {}) {
        this.ws = ws;
        this.context = context;
    }
    async send(type, data) {
        if (this.ws.readyState === ws_1.default.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        }
        else {
            throw new Error('WebSocket is not connected');
        }
    }
}
exports.Connection = Connection;
exports.wsConnection = new Connection(new ws_1.default('ws://localhost:3000'));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3NfY29ubmVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndzX2Nvbm5lY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNENBQTJCO0FBYTNCLE1BQWEsVUFBVTtJQUNyQixZQUFtQixFQUFhLEVBQVMsVUFBNkIsRUFBRTtRQUFyRCxPQUFFLEdBQUYsRUFBRSxDQUFXO1FBQVMsWUFBTyxHQUFQLE9BQU8sQ0FBd0I7SUFBRyxDQUFDO0lBRTVFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWSxFQUFFLElBQVM7UUFDaEMsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsS0FBSyxZQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDL0MsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDaEQsQ0FBQztJQUNILENBQUM7Q0FDRjtBQVZELGdDQVVDO0FBRVksUUFBQSxZQUFZLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxZQUFTLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFdlYlNvY2tldCBmcm9tICd3cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29ubmVjdGlvbkNvbnRleHQge1xuICBpbml0aWFsUXVlc3Rpb24/OiBzdHJpbmc7XG4gIGNvbnRleHQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29ubmVjdGlvbldpdGhDb250ZXh0IHtcbiAgd3M6IFdlYlNvY2tldDtcbiAgY29udGV4dDogQ29ubmVjdGlvbkNvbnRleHQ7XG4gIHNlbmQ6ICh0eXBlOiBzdHJpbmcsIGRhdGE6IGFueSkgPT4gUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGNsYXNzIENvbm5lY3Rpb24gaW1wbGVtZW50cyBDb25uZWN0aW9uV2l0aENvbnRleHQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgd3M6IFdlYlNvY2tldCwgcHVibGljIGNvbnRleHQ6IENvbm5lY3Rpb25Db250ZXh0ID0ge30pIHt9XG5cbiAgYXN5bmMgc2VuZCh0eXBlOiBzdHJpbmcsIGRhdGE6IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLndzLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5PUEVOKSB7XG4gICAgICB0aGlzLndzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlLCBkYXRhIH0pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdXZWJTb2NrZXQgaXMgbm90IGNvbm5lY3RlZCcpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3Qgd3NDb25uZWN0aW9uID0gbmV3IENvbm5lY3Rpb24obmV3IFdlYlNvY2tldCgnd3M6Ly9sb2NhbGhvc3Q6MzAwMCcpKTtcbiJdfQ==