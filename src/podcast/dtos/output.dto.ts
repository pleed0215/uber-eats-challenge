import { ObjectType, Field, Int, InputType } from "@nestjs/graphql";
import { IsString, IsBoolean, IsOptional } from "class-validator";

@ObjectType()
export class CoreOutput {
  @Field((type) => String, { nullable: true })
  @IsString()
  @IsOptional()
  error?: string;

  @Field((type) => Boolean)
  @IsBoolean()
  ok: boolean;
}

@ObjectType()
export class CorePaginationOutput extends CoreOutput {
  @Field((type) => Int, { nullable: true })
  currentCount?: number;

  @Field((type) => Int, { nullable: true })
  totalPage?: number;

  @Field((type) => Int, { nullable: true })
  currentPage?: number;

  @Field((type) => Int, { nullable: true })
  totalCount?: number;

  @Field((type) => Int, { nullable: true })
  pageSize?: number;
}

@InputType()
export class CorePaginationInput {
  @Field((type) => Int)
  page: number = 1;

  @Field((type) => Int)
  pageSize: number = 10;
}
