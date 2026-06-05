-- CreateTable
CREATE TABLE "trail_enrollments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trail_id" UUID NOT NULL,
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trail_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trail_certificates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trail_id" UUID NOT NULL,
    "verification_code" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trail_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trail_quiz_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trail_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trail_quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trail_quiz_attempt_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "trail_quiz_attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trail_enrollments_user_id_idx" ON "trail_enrollments"("user_id");

-- CreateIndex
CREATE INDEX "trail_enrollments_trail_id_idx" ON "trail_enrollments"("trail_id");

-- CreateIndex
CREATE UNIQUE INDEX "trail_enrollments_user_id_trail_id_key" ON "trail_enrollments"("user_id", "trail_id");

-- CreateIndex
CREATE UNIQUE INDEX "trail_certificates_verification_code_key" ON "trail_certificates"("verification_code");

-- CreateIndex
CREATE INDEX "trail_certificates_user_id_idx" ON "trail_certificates"("user_id");

-- CreateIndex
CREATE INDEX "trail_certificates_trail_id_idx" ON "trail_certificates"("trail_id");

-- CreateIndex
CREATE INDEX "trail_quiz_attempts_user_id_idx" ON "trail_quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "trail_quiz_attempts_trail_id_idx" ON "trail_quiz_attempts"("trail_id");

-- CreateIndex
CREATE INDEX "trail_quiz_attempt_answers_attempt_id_idx" ON "trail_quiz_attempt_answers"("attempt_id");

-- CreateIndex
CREATE INDEX "trail_quiz_attempt_answers_question_id_idx" ON "trail_quiz_attempt_answers"("question_id");

-- AddForeignKey
ALTER TABLE "trail_enrollments" ADD CONSTRAINT "trail_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trail_enrollments" ADD CONSTRAINT "trail_enrollments_trail_id_fkey" FOREIGN KEY ("trail_id") REFERENCES "trails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trail_certificates" ADD CONSTRAINT "trail_certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trail_certificates" ADD CONSTRAINT "trail_certificates_trail_id_fkey" FOREIGN KEY ("trail_id") REFERENCES "trails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trail_quiz_attempts" ADD CONSTRAINT "trail_quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trail_quiz_attempts" ADD CONSTRAINT "trail_quiz_attempts_trail_id_fkey" FOREIGN KEY ("trail_id") REFERENCES "trails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trail_quiz_attempt_answers" ADD CONSTRAINT "trail_quiz_attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "trail_quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trail_quiz_attempt_answers" ADD CONSTRAINT "trail_quiz_attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
