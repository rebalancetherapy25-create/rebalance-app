import { app } from './app';
import { connectDB } from './config/db';
import config from './config/env';

const startServer = async () => {
    try {
        await connectDB();
        app.listen(config.port, () => {
            console.log(`[api:start] listening on port ${config.port}`);
        });
    } catch (error) {
        console.error('[api:start] failed to start server', error);
        process.exit(1);
    }
};

startServer();
