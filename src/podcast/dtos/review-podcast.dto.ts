import { Field, InputType, Int, ObjectType, PickType } from "@nestjs/graphql";
import { Review } from "../entities/review.entity";
import { CoreOutput, CorePaginationOutput } from "./output.dto";

@InputType()
export class ReviewPodcastInput extends PickType(Review, [
  "content",
  "rating"
]) {
  @Field((type) => Int)
  podcastId: number;
}

@InputType()
export class SeePodcastReviewsInput {
  @Field((type) => Int, { defaultValue: 1 })
  page?: number = 1;
  @Field((type) => Int, { defaultValue: 10 })
  pageSize?: number = 10;
  @Field((type) => Int)
  podcastId: number;
}

@ObjectType()
export class ReviewPodcastOutput extends CoreOutput {}

@ObjectType()
export class SeePodcastReviewsOutput extends CorePaginationOutput {
  @Field((type) => [Review], { nullable: true })
  reviews?: Review[];
}
