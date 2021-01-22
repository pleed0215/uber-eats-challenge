import { Field, InputType, Int, ObjectType, PickType } from "@nestjs/graphql";
import { Podcast } from "../entities/podcast.entity";
import { CorePaginationOutput } from "./output.dto";

@InputType()
export class SearchPodcastInput extends PickType(
  Podcast,
  ["title"] as const,
  InputType
) {
  @Field((type) => Int, { defaultValue: 1 })
  page?: number = 1;

  @Field((type) => Int, { defaultValue: 10 })
  pageSize?: number = 10;
}

@ObjectType()
export class SearchPodcastOutput extends CorePaginationOutput {
  @Field((type) => [Podcast], { nullable: true })
  results?: Podcast[];
}
