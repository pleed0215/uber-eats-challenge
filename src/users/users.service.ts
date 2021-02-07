import { Injectable } from "@nestjs/common";
import { User, UserRole } from "./entities/user.entity";
import {
  CreateAccountInput,
  CreateAccountOutput,
} from "./dtos/create-account.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "../jwt/jwt.service";
import { UserProfileOutput } from "./dtos/user-profile.dto";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { SeedFakeUsersInput, SeedFakeUsersOutput } from "./dtos/fake.dto";

import * as faker from "faker";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return { ok: false, error: `There is a user with that email already` };
      }
      const user = this.users.create({
        email,
        password,
        role,
      });
      await this.users.save(user);

      return {
        ok: true,
        error: null,
      };
    } catch {
      return {
        ok: false,
        error: "Could not create account",
      };
    }
  }
  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne(
        { email },
        { select: ["id", "password"] }
      );
      if (!user) {
        return { ok: false, error: "User not found" };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: "Wrong password",
        };
      }

      const token = this.jwtService.sign(user.id);

      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail(id, {
        relations: ["podcasts", "subscriptions", "sawEpisode", "reviews"],
      });
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return {
        ok: false,
        error: "User Not Found",
      };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOneOrFail(userId);

      if (email) user.email = email;
      if (password) user.password = password;

      await this.users.save(user);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: "Could not update profile",
      };
    }
  }

  async seedFakeUsers({
    numUsers,
  }: SeedFakeUsersInput): Promise<SeedFakeUsersOutput> {
    try {
      const willBeCreated: Array<User> = [];
      const basePortraitUrl =
        "https://ubereats-challenge.s3.ap-northeast-2.amazonaws.com/";
      for (let i = 0; i < numUsers; i++) {
        willBeCreated.push(
          this.users.create({
            email: faker.internet.email(),
            name: faker.name.findName(),
            password: "testpassword",
            role: faker.random.arrayElement([UserRole.Host, UserRole.Listener]),
            portrait: `${basePortraitUrl}portrait${faker.random.number({
              min: 1,
              max: 20,
            })}.jpg`,
          })
        );
      }
      await this.users.save(willBeCreated);
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e.message,
      };
    }
  }
}
