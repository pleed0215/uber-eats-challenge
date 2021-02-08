import { Episode } from "./episode.entity";
import { ObjectType, Field, InputType } from "@nestjs/graphql";
import { IsString, Min, Max, IsNumber } from "class-validator";
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  RelationId,
} from "typeorm";
import { CoreEntity } from "./core.entity";
import { User } from "src/users/entities/user.entity";
import { Review } from "./review.entity";

@Entity()
@ObjectType()
@InputType("PodcastInputType", { isAbstract: true })
export class Podcast extends CoreEntity {
  @Column()
  @Field((type) => String)
  @IsString()
  title: string;

  @Column()
  @Field((type) => String)
  @IsString()
  category: string;

  @Column({ nullable: true })
  @Field((type) => String, { nullable: true })
  @IsString()
  description: string;

  @Column({ default: 0 })
  @Field((type) => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @Column({ nullable: true })
  @Field((type) => String, { nullable: true })
  @IsString()
  thumbnail?: string;

  @OneToMany(() => Episode, (episode) => episode.podcast)
  @Field((type) => [Episode])
  episodes: Episode[];

  @ManyToOne(() => User, (user) => user.podcasts, { eager: true })
  @Field((type) => User)
  host: User;
  @RelationId((podcast: Podcast) => podcast.host)
  hostId: number;

  @ManyToMany(() => User, (user) => user.subscriptions)
  @JoinTable()
  @Field((type) => [User], { nullable: true })
  listeners: User[];

  @OneToMany(() => Review, (review) => review.podcast)
  @Field((type) => [Review], { nullable: true })
  reviews: Review[];
}
