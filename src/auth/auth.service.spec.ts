import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';

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
        update: jest.fn(),
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
      const role = Role.USER;

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        email,
        password: hashedPassword,
        role,
      });

      const result = await authService.register(email, password, role);

      expect(result).toEqual({
        id: 1,
        email,
        role,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email,
          password: hashedPassword,
          role,
        },
      });
    });

    it('should handle errors during registration', async () => {
      const email = 'test@example.com';
      const password = 'securepassword';
      const role = 'USER';

      prismaMock.user.create.mockRejectedValue(new Error('Database error'));

      await expect(authService.register(email, password, role)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('login', () => {
    it('should return an access token and refresh token for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'securepassword';
      const hashedPassword = 'hashedpassword';

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        email,
        password: hashedPassword,
        role: 'user',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      jwtServiceMock.sign
        .mockImplementationOnce((payload, options) => {
          expect(payload).toEqual({ sub: 1, email, role: 'user' });
          expect(options).toEqual({
            secret: process.env.ACCESS_SECRET,
            expiresIn: '15m',
          });
          return 'access-token';
        })
        .mockImplementationOnce((payload, options) => {
          expect(payload).toEqual({ sub: 1, email });
          expect(options).toEqual({
            secret: process.env.REFRESH_SECRET,
            expiresIn: '7d',
          });
          return 'refresh-token';
        });

      prismaMock.user.update.mockResolvedValue(undefined);

      const result = await authService.login(email, password);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { refreshToken: expect.any(String) },
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
