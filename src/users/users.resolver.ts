import { Resolver, Mutation, Args, Query } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";
import {
  CreateAccountInput,
  CreateAccountOutput
} from "./dtos/create-account.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dto";
import { AuthUser } from "../auth/auth-user.decorator";
import { AuthGuard } from "../auth/auth.guard";
import { UserProfileInput, UserProfileOutput } from "./dtos/user-profile.dto";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { Role } from "src/auth/role.decorator";

@Resolver((of) => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation((returns) => CreateAccountOutput)
  createAccount(
    @Args("input") createAccountInput: CreateAccountInput
  ): Promise<CreateAccountOutput> {
    return this.usersService.createAccount(createAccountInput);
  }

  @Mutation((returns) => LoginOutput)
  login(@Args("input") loginInpt: LoginInput): Promise<LoginOutput> {
    return this.usersService.login(loginInpt);
  }

  @Role(["Any"])
  @Query((returns) => User)
  me(@AuthUser() authUser: User): User {
    return authUser;
  }

  @Role(["Any"])
  @Query((returns) => UserProfileOutput)
  seeProfile(
    @Args() userProfileInput: UserProfileInput
  ): Promise<UserProfileOutput> {
    return this.usersService.findById(userProfileInput.userId);
  }

  @Role(["Any"])
  @Mutation((returns) => EditProfileOutput)
  editProfile(
    @AuthUser() authUser: User,
    @Args("input") editProfileInput: EditProfileInput
  ): Promise<EditProfileOutput> {
    return this.usersService.editProfile(authUser.id, editProfileInput);
  }
}
