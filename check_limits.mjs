import { Octokit } from "@octokit/rest";
import { config } from "dotenv";
config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const checkRateLimit = async () => {
  const { data } = await octokit.rateLimit.get();
  const { remaining, limit, reset } = data.rate;

  console.log(`✅ GitHub API Rate Limit:`);
  console.log(`→ Remaining: ${remaining} / ${limit}`);
  console.log(`→ Resets at: ${new Date(reset * 1000).toLocaleTimeString()}`);
};

checkRateLimit();
