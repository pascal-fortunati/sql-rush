import 'dotenv/config';
import { createApp } from './app.js';
const app = createApp(); const port = Number(process.env.PORT || 3000); const host = process.env.HOST || '0.0.0.0';
const server = app.listen(port, host, () => console.log(`SQL Rush DWWM → http://localhost:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { app.locals.sessionStore.close(); app.locals.db.close(); process.exit(0); }));
