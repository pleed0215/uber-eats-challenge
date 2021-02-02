import { ObjectType, Field, Int, InputType } from "@nestjs/graphql";
import { IsNumber, IsString, Min } from "class-validator";
import { User } from "src/users/entities/user.entity";
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from "typeorm";
import { CoreEntity } from "./core.entity";
import { Podcast } from "./podcast.entity";

@InputType("EpisodeInputType", { isAbstract: true })
@Entity()
@ObjectType()
export class Episode extends CoreEntity {
  @Column()
  @Field((type) => String)
  @IsString()
  title: string;

  @Column({ nullable: true })
  @Field((type) => String, { nullable: true })
  @IsString()
  description?: string;

  @Column()
  @Field((type) => String)
  @IsString()
  category: string;

  @Column({ nullable: true })
  @Field((type) => Int, { nullable: true })
  @IsNumber()
  @Min(1)
  playLength?: number;

  @ManyToOne(() => Podcast, (podcast) => podcast.episodes, {
    onDelete: "CASCADE",
    eager: true,
  })
  @Field((type) => Podcast)
  podcast: Podcast;

  @RelationId((episode: Episode) => episode.podcast)
  podcastId: number;

  @ManyToMany(() => User, (user) => user.sawEpisode)
  @JoinTable()
  @Field((type) => [User], { nullable: true })
  seenUser: User[];
}
