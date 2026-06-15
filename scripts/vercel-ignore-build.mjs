const SKIP_BUILD = 0;
const CONTINUE_BUILD = 1;

const vercelEnv = process.env.VERCEL_ENV ?? "";
const pullRequestId = process.env.VERCEL_GIT_PULL_REQUEST_ID ?? "";
const repoOwner = process.env.VERCEL_GIT_REPO_OWNER ?? "";
const repoSlug = process.env.VERCEL_GIT_REPO_SLUG ?? "";
const githubToken = process.env.GITHUB_TOKEN ?? "";

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

if (!pullRequestId) {
  skip("preview deployment without pull request");
}

if (!repoOwner || !repoSlug) {
  continueBuild("repository metadata is unavailable");
}

const url = `https://api.github.com/repos/${repoOwner}/${repoSlug}/pulls/${pullRequestId}`;

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "uchilog-vercel-ignore-build",
  "X-GitHub-Api-Version": "2022-11-28",
};

if (githubToken) {
  headers.Authorization = `Bearer ${githubToken}`;
}

try {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    continueBuild(`GitHub API returned ${response.status}`);
  }

  const pullRequest = await response.json();

  if (pullRequest.draft) {
    skip(`pull request #${pullRequestId} is draft`);
  }

  continueBuild(`pull request #${pullRequestId} is ready for review`);
} catch (error) {
  continueBuild(
    `failed to check pull request state: ${error instanceof Error ? error.message : String(error)}`,
  );
}
