import { InputType, ObjectType, PickType, Field } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { CoreOutput } from './output.dto';

@InputType()
export class LoginInput extends PickType(User, ['email', 'password']) {}

@ObjectType()
export class LoginOutput extends CoreOutput {
  @Field(type => String, { nullable: true })
  token?: string;
}
