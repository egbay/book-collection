import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let prismaMock: any;
  let jwtServiceMock: jest.Mocked<JwtService>;

  beforeEach(async () => {
    prismaMock = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    jwtServiceMock = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const email = 'test@example.com';
      const password = 'securepassword';
      const hashedPassword = 'hashedpassword';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        email,
        password: hashedPassword,
      });

      const result = await authService.register(email, password);

      expect(result).toEqual({
        id: 1,
        email,
        password: hashedPassword,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email,
          password: hashedPassword,
        },
      });
    });

    it('should handle errors during registration', async () => {
      const email = 'test@example.com';
      const password = 'securepassword';

      prismaMock.user.create.mockRejectedValue(new Error('Database error'));

      await expect(authService.register(email, password)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('login', () => {
    it('should return an access token for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'securepassword';
      const hashedPassword = 'hashedpassword';

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        email,
        password: hashedPassword,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtServiceMock.sign.mockReturnValue('jwt-token');

      const result = await authService.login(email, password);

      expect(result).toEqual({ accessToken: 'jwt-token' });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        sub: 1,
        email,
      });
    });

    it('should throw an error for invalid email', async () => {
      const email = 'test@example.com';
      const password = 'securepassword';

      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an error for invalid password', async () => {
      const email = 'test@example.com';
      const password = 'securepassword';
      const hashedPassword = 'hashedpassword';

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        email,
        password: hashedPassword,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return a user for a valid ID', async () => {
      const userId = 1;

      prismaMock.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      const result = await authService.validateUser(userId);

      expect(result).toEqual({
        id: userId,
        email: 'test@example.com',
        password: 'hashedpassword',
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should return null if user is not found', async () => {
      const userId = 1;

      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await authService.validateUser(userId);

      expect(result).toBeNull();
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
