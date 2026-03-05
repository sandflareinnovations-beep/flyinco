import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string;
        phone: string | null;
        role: string;
    }[]>;
}
