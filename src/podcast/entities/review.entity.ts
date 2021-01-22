import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { IsNumber, IsString, Max, Min } from "class-validator";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, OneToMany, RelationId } from "typeorm";
import { CoreEntity } from "./core.entity";
import { Podcast } from "./podcast.entity";

@InputType("ReviewInputType", { isAbstract: true })
@ObjectType()
@Entity()
export class Review extends CoreEntity {
  @ManyToOne(() => Podcast, (podcast) => podcast.reviews)
  @Field((type) => Podcast)
  podcast: Podcast;

  @RelationId((review: Review) => review.podcast)
  podcastId: number;

  @ManyToOne(() => User, (user) => user.reviews)
  @Field((type) => User)
  reviewer: User;

  @RelationId((review: Review) => review.reviewer)
  reviewerId: number;

  @Column()
  @IsString()
  @Field((type) => String)
  content: string;

  @Column()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Field((type) => Int)
  rating: number;
}
