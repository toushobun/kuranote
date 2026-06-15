const SKIP_BUILD = 0;
const CONTINUE_BUILD = 1;

const vercelEnv = process.env.VERCEL_ENV ?? "";
const pullRequestId = process.env.VERCEL_GIT_PULL_REQUEST_ID ?? "";

function skip(reason) {
  console.log(`[vercel-ignore-build] skip: ${reason}`);
  process.exit(SKIP_BUILD);
}

function continueBuild(reason) {
  console.log(`[vercel-ignore-build] continue: ${reason}`);
  process.exit(CONTINUE_BUILD);
}

if (vercelEnv === "production") {
  continueBuild("production deployment");
}

// PR Preview のデプロイは GitHub Actions が一元管理するため、Vercel 側では常にスキップ
if (pullRequestId) {
  skip("PR preview deployments are handled by GitHub Actions");
}

continueBuild("non-PR preview deployment");
