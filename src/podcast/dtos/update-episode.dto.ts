import { InputType, Field, PartialType, PickType, Int } from "@nestjs/graphql";
import { IsString, IsOptional } from "class-validator";
import { Episode } from "../entities/episode.entity";
import { EpisodesSearchInput } from "./podcast.dto";

@InputType()
export class UpdateEpisodeInput extends PartialType(
  PickType(Episode, ["title", "description", "url"])
) {
  @Field((type) => Int)
  episodeId: number;

  @Field((type) => Int)
  podcastId: number;
}
