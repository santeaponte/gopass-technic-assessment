import { app } from './app';
import { env } from './config/env';
import { prisma } from './shared/prisma';

const startServer = async (): Promise<void> => {
	await prisma.$connect();

	const server = app.listen(env.PORT, () => {
		console.log(`Backend listening on port ${env.PORT}`);
	});

	const shutdown = (): void => {
		server.close(async () => {
			await prisma.$disconnect();
		});
	};

	process.once('SIGINT', shutdown);
	process.once('SIGTERM', shutdown);
};

startServer().catch(async (error: unknown) => {
	console.error('Failed to start backend:', error);
	await prisma.$disconnect();
	process.exitCode = 1;
});
