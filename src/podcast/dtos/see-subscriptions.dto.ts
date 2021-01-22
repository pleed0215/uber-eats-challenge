import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { Podcast } from "../entities/podcast.entity";
import { CoreOutput, CorePaginationOutput } from "./output.dto";

@InputType()
export class SeeSubscriptionInput {
  @Field((type) => Int, { defaultValue: 1 })
  page?: number = 1;

  @Field((type) => Int, { defaultValue: 10 })
  pageSize?: number = 10;
}

@ObjectType()
export class SeeSubscriptionOutput extends CorePaginationOutput {
  @Field((type) => [Podcast], { nullable: true })
  subscriptions?: Podcast[];
}
