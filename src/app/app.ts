import yargs from 'yargs';
import express from 'express';
import expressWs from 'express-ws';
import bodyParser from 'body-parser';
import cors from 'cors';
import restRoutes from 'app/rest_routes';
import wsRoutes from 'app/ws_routes';

const app = express();
expressWs(app);

// Enable CORS for all routes
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow all origins in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(restRoutes);
app.use(wsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const args = yargs(process.argv.slice(2))
  .option({
    port: { type: 'number', default: process.env.PORT ? parseInt(process.env.PORT) : 5001, describe: 'Port to serve on' },
  })
  .help()
  .parseSync();

const port = args.port;

app.listen(port, '0.0.0.0', () => {
  console.log(`Soul Machines Async Skill started on port ${port}.`);
});
