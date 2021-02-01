import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "src/podcast/dtos/output.dto";

@InputType()
export class SeedFakeUsersInput {
  @Field((type) => Int)
  numUsers: number;
}

@ObjectType()
export class SeedFakeUsersOutput extends CoreOutput {}
