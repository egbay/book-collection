import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let authController: AuthController;
  let authServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      register: jest.fn(),
      login: jest.fn(),
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'securepassword',
        role: Role.USER,
      };

      authServiceMock.register.mockResolvedValue({
        id: 1,
        email: registerDto.email,
        password: 'hashedpassword',
        name: 'Test User',
        role: Role.USER,
        address: '123 Test St',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authController.register(registerDto);

      expect(result).toEqual({
        user: {
          id: 1,
          email: 'test@example.com',
          role: Role.USER,
        },
      });
      expect(authServiceMock.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.role,
      );
    });

    it('should handle errors during registration', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'securepassword',
      };

      authServiceMock.register.mockRejectedValue(
        new Error('Registration failed'),
      );

      await expect(authController.register(registerDto)).rejects.toThrow(
        'Registration failed',
      );
    });
  });

  describe('login', () => {
    it('should log in a user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'securepassword',
      };

      authServiceMock.login.mockResolvedValue({
        accessToken: 'jwt-token',
      });

      const result = await authController.login(loginDto);

      expect(result).toEqual({ accessToken: 'jwt-token' });
      expect(authServiceMock.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });

    it('should handle errors during login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'securepassword',
      };

      authServiceMock.login.mockRejectedValue(new Error('Login failed'));

      await expect(authController.login(loginDto)).rejects.toThrow(
        'Login failed',
      );
    });
  });
});
