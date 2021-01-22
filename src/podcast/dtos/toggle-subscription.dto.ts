import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "./output.dto";

@InputType()
export class ToggleSubscriptionInput {
  @Field((type) => Int)
  podcastId: number;
}

@ObjectType()
export class ToggleSubscriptionOutput extends CoreOutput {
  @Field((type) => String, { nullable: true })
  result?: string;
}
