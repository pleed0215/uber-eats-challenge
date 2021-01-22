import { ArgsType, ObjectType, Field } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { CoreOutput } from './output.dto';

@ArgsType()
export class UserProfileInput {
  @Field(type => Number)
  userId: number;
}

@ObjectType()
export class UserProfileOutput extends CoreOutput {
  @Field(type => User, { nullable: true })
  user?: User;
}
