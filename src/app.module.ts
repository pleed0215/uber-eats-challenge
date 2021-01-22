import { Module, RequestMethod, MiddlewareConsumer } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { PodcastsModule } from "./podcast/podcasts.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Podcast } from "./podcast/entities/podcast.entity";
import { Episode } from "./podcast/entities/episode.entity";
import { User } from "./users/entities/user.entity";
import { UsersModule } from "./users/users.module";
import { JwtModule } from "./jwt/jwt.module";
import { JwtMiddleware } from "./jwt/jwt.middleware";
import { AuthModule } from "./auth/auth.module";
import { Review } from "./podcast/entities/review.entity";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: process.env.NODE_ENV === "production" ? "postgres" : "sqlite",
      ...(process.env.NODE_ENV !== "production"
        ? { database: "db.sqlite3" }
        : {
            url: process.env.DATABASE_URL,
          }),
      synchronize: true,
      logging: process.env.NODE_ENV !== "test",
      entities: [Podcast, Episode, User, Review],
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      context: ({ req }) => {
        return { user: req["user"] };
      },
    }),
    JwtModule.forRoot({
      privateKey: "8mMJe5dMGORyoRPLvngA8U4aLTF3WasX",
    }),
    PodcastsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes({
      path: "/graphql",
      method: RequestMethod.POST,
    });
  }
}
