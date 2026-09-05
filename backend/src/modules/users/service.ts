import { AppError } from '../../shared/errors';
import { UserRepository } from './repository';

export class UserService {
	public constructor(private readonly userRepository: UserRepository) {}

	public findAll() {
		return this.userRepository.findAll();
	}

	public async findById(id: string) {
		const user = await this.userRepository.findById(id);

		if (!user) {
			throw new AppError(404, 'User not found');
		}

		return user;
	}
}
