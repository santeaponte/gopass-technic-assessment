import { hashPassword } from '../src/shared/password';
import { prisma } from '../src/shared/prisma';
import { env } from '../src/config/env';

async function main() {
	if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
		console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed.');
		return;
	}

	const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

	const admin = await prisma.user.upsert({
		where: { email: env.ADMIN_EMAIL },
		update: {},
		create: {
			name: env.ADMIN_NAME,
			email: env.ADMIN_EMAIL,
			passwordHash,
			role: 'ADMIN',
		},
	});

	console.log(`Admin user ready: ${admin.email}`);
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
