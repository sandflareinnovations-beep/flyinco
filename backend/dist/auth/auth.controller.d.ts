import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto, res: any): Promise<{
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
        };
    }>;
    login(loginDto: LoginDto, res: any): Promise<{
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
        };
    }>;
    logout(res: any): {
        message: string;
    };
    getProfile(req: any): any;
    private setCookie;
}
