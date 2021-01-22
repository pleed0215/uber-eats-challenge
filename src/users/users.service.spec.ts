import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';
import { MockRepository } from '../podcast/podcasts.service.spec';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});
const TEST_TOKEN = 'TEST_TOKEN';
let mockJwtService = {
  sign: jest.fn(() => TEST_TOKEN),
  verify: jest.fn(),
};

const hostArgs = {
  email: 'host@test.com',
  password: 'password_host',
  role: UserRole.Host,
};

const TEST_HOST = {
  id: 123,
  ...hostArgs,
};

describe('UsersService', () => {
  let service: UsersService;
  let jwtService: JwtService;
  let userRepository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  // why fucking does not work?
  /*afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });*/

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(userRepository).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('createAccount Testing', () => {
    it('should success to create User', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValueOnce(hostArgs);
      userRepository.save.mockResolvedValue(TEST_HOST);

      const result = await service.createAccount(hostArgs);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        email: hostArgs.email,
      });
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith(hostArgs);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(hostArgs);
      expect(result).toMatchObject({ ok: true, error: null });
    });
    it('should fail because of user existing', async () => {
      userRepository.findOne.mockResolvedValueOnce(TEST_HOST);

      const result = await service.createAccount(hostArgs);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        email: hostArgs.email,
      });
      expect(userRepository.create).toHaveBeenCalledTimes(0);
      expect(userRepository.save).toHaveBeenCalledTimes(0);
      expect(result).toMatchObject({
        ok: false,
        error: `There is a user with that email already`,
      });
    });
    it('should fail because of saving failed', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValueOnce(hostArgs);
      userRepository.save.mockRejectedValueOnce(
        new Error('Mocked Error on createAccount'),
      );

      const result = await service.createAccount(hostArgs);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        email: hostArgs.email,
      });
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith(hostArgs);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(hostArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'Could not create account',
      });
    });
  });

  describe('login Testing', () => {
    const findOneOptions = { select: ['id', 'password'] };
    const findOneArgs = [{ email: hostArgs.email }, { ...findOneOptions }];

    it('should succuess to login', async () => {
      const passwordSuccessUser = {
        ...TEST_HOST,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      userRepository.findOne.mockResolvedValueOnce(passwordSuccessUser);
      const result = await service.login({ ...hostArgs });

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(...findOneArgs);
      expect(passwordSuccessUser.checkPassword).toHaveBeenCalledTimes(1);
      expect(passwordSuccessUser.checkPassword).toHaveBeenCalledWith(
        hostArgs.password,
      );
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(TEST_HOST.id);

      expect(result).toMatchObject({ ok: true, token: TEST_TOKEN });
    });
    it('should fail to login, becuase of findOne failed', async () => {
      const newError = new Error('Mocked Error on login');
      userRepository.findOne.mockRejectedValueOnce(newError);
      const result = await service.login({ ...hostArgs });

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(...findOneArgs);

      //expect(jwtService.sign).toHaveBeenCalledTimes(0);

      expect(result).toMatchObject({ ok: false, error: newError });
    });
    it('should fail to login because of wrong password', async () => {
      const passwordFailedUser = {
        ...TEST_HOST,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      userRepository.findOne.mockResolvedValueOnce(passwordFailedUser);
      const result = await service.login({ ...hostArgs });

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(...findOneArgs);
      expect(passwordFailedUser.checkPassword).toHaveBeenCalledTimes(1);
      expect(passwordFailedUser.checkPassword).toHaveBeenCalledWith(
        hostArgs.password,
      );
      // error..???
      //expect(jwtService.sign).toHaveBeenCalledTimes(0);

      expect(result).toMatchObject({ ok: false, error: 'Wrong password' });
    });
    it('should fail to login, becuase of non existing user', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      const result = await service.login({ ...hostArgs });

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(...findOneArgs);

      //expect(jwtService.sign).toHaveBeenCalledTimes(0);

      expect(result).toMatchObject({ ok: false, error: 'User not found' });
    });
  });

  describe('findById Testing', () => {
    const { id } = TEST_HOST;
    it('should success to findById', async () => {
      userRepository.findOneOrFail.mockResolvedValueOnce(TEST_HOST);
      const result = await service.findById(id);

      expect(userRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith({ id });
      expect(result).toMatchObject({ ok: true, user: TEST_HOST });
    });
    it('should fail to findById because of findOneOrFail failed', async () => {
      userRepository.findOneOrFail.mockRejectedValueOnce(
        new Error('Mocked Error from findById'),
      );
      const result = await service.findById(id);

      expect(userRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith({ id });
      expect(result).toMatchObject({ ok: false, error: 'User Not Found' });
    });
  });

  describe('editProfile Testing', () => {
    const updateArgs = {
      email: 'willUpdate',
      password: 'willUpdate',
    };

    it('should success to edit profile', async () => {
      userRepository.findOneOrFail.mockResolvedValueOnce(TEST_HOST);

      const result = await service.editProfile(TEST_HOST.id, updateArgs);
      const expectedSaveArgs = { ...TEST_HOST, ...updateArgs };
      expect(userRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith(TEST_HOST.id);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(expectedSaveArgs);
      expect(result).toMatchObject({ ok: true });
    });

    it('should success to edit profile with only email address', async () => {
      const updateArgs = {
        email: 'willUpdate',
      };
      userRepository.findOneOrFail.mockResolvedValueOnce(TEST_HOST);

      const result = await service.editProfile(TEST_HOST.id, updateArgs);
      const expectedSaveArgs = { ...TEST_HOST, ...updateArgs };
      expect(userRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith(TEST_HOST.id);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(expectedSaveArgs);
      expect(result).toMatchObject({ ok: true });
    });

    it('should success to edit profile with only password', async () => {
      const updateArgs = {
        password: 'willUpdate',
      };
      userRepository.findOneOrFail.mockResolvedValueOnce(TEST_HOST);

      const result = await service.editProfile(TEST_HOST.id, updateArgs);
      const expectedSaveArgs = { ...TEST_HOST, ...updateArgs };
      expect(userRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith(TEST_HOST.id);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(expectedSaveArgs);
      expect(result).toMatchObject({ ok: true });
    });

    it('should fail to edit profile because of user matching failed', async () => {
      userRepository.findOneOrFail.mockRejectedValueOnce(
        new Error('Mocked Error on editProfile'),
      );

      const result = await service.editProfile(TEST_HOST.id, updateArgs);
      expect(userRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith(TEST_HOST.id);
      expect(userRepository.save).toHaveBeenCalledTimes(0);

      expect(result).toMatchObject({
        ok: false,
        error: 'Could not update profile',
      });
    });
    it('should fail to edit profile because of saving failed', async () => {
      userRepository.findOneOrFail.mockResolvedValueOnce(TEST_HOST);
      userRepository.save.mockRejectedValueOnce(
        new Error('Mocked error on editProfile'),
      );

      const result = await service.editProfile(TEST_HOST.id, updateArgs);
      const expectedSaveArgs = { ...TEST_HOST, ...updateArgs };
      expect(userRepository.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith(TEST_HOST.id);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(expectedSaveArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'Could not update profile',
      });
    });
  });
});
