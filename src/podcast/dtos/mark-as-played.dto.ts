import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { User } from "src/users/entities/user.entity";
import { CoreOutput } from "./output.dto";

@InputType()
export class MarkEpisodeAsPlayedInput {
  @Field((type) => Int)
  episodeId: number;
}

@ObjectType()
export class MarkEpisodeAsPlayedOutput extends CoreOutput {
  @Field((type) => Int, { nullable: true })
  count?: number;
}
