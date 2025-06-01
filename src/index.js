const { inspect } = require('node:util');

const core = require('@actions/core');
const { getOctokit } = require('@actions/github');
const { requestLog } = require('@octokit/plugin-request-log');

class Repository {
    constructor(octokit, repository) {
        const [owner, repo, ...extra] = repository.split('/');

        if (!owner || !repo || extra.length) {
            throw new Error(
              `Invalid repository '${repository}'. Expected format {owner}/{repo}.`
            );
        }

        Object.assign(this, {
            octokit,
            owner,
            repo,
        });
    }

    async listMatchingRefs(ref) {
        const { octokit, owner, repo } = this;

        // Note: there is no need for pagination.
        // If there is an exact match - it will be the only returned result.
        const { data } = await octokit.rest.git.listMatchingRefs({
            owner,
            repo,
            ref,
        });

        return data;
    }

    async getRef(ref) {
        const matching = await this.listMatchingRefs(ref);

        return matching.filter(result => result.ref === `refs/${ref}`)[0];
    }

    async createRef(ref, sha) {
        const { octokit, owner, repo } = this;

        await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/${ref}`,
            sha,
        });
    }

    async updateRef(ref, sha, force) {
        const { octokit, owner, repo } = this;

        await octokit.rest.git.updateRef({
            owner,
            repo,
            ref,
            sha,
            force,
        });
    }
}

async function run() {
    const log = {
        debug: core.isDebug() ? console.debug.bind(console) : new Function(),
        info: console.info.bind(console),
    };

    const token = core.getInput('github-token', { required: true });
    const repository = core.getInput('repository', { required: true });
    const ref = core.getInput('ref', { required: true }).replace(/^refs\//, '');
    const sha = core.getInput('sha', { required: true });
    const force = core.getBooleanInput('force', { required: true });

    const github = getOctokit(token, { log }, requestLog);
    const repo = new Repository(github, repository);

    const existing = await repo.getRef(ref);

    if (existing) {
        repo.updateRef(ref, sha, force);
    } else {
        repo.createRef(ref, sha);
    }
}

async function runWithErrorHandling() {
    try {
        await run();
    } catch (error) {
        core.setFailed(`${error?.message ?? error}`);
        core.debug(inspect(error));
    }
}

runWithErrorHandling()
