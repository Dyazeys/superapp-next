CREATE TABLE "auth"."user_profiles" (
  "user_id" UUID NOT NULL,
  "display_name" VARCHAR(150),
  "phone" VARCHAR(50),
  "avatar_url" VARCHAR(500),
  "job_title" VARCHAR(100),
  "department" VARCHAR(100),
  "timezone" VARCHAR(100),
  "locale" VARCHAR(20),
  "bio" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6),

  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "fk_auth_user_profiles_user_id"
    FOREIGN KEY ("user_id")
    REFERENCES "auth"."users" ("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
