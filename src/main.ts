import { inspect } from 'node:util';

import * as core from '@actions/core';
import { getOctokit } from '@actions/github';
import { requestLog } from '@octokit/plugin-request-log';

class Repository {
    private readonly octokit: ReturnType<typeof getOctokit>;
    private readonly owner: string;
    private readonly repo: string;

    constructor(octokit: ReturnType<typeof getOctokit>, repository: string) {
        const [owner, repo, ...extra] = repository.split('/');

        if (!owner || !repo || extra.length) {
            throw new Error(
                `Invalid repository '${repository}'. Expected format {owner}/{repo}.`
            );
        }

        this.octokit = octokit;
        this.owner = owner;
        this.repo = repo;
    }

    async listMatchingRefs(ref: string) {
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

    async getRef(ref: string) {
        const matching = await this.listMatchingRefs(ref);

        return matching.filter(result => result.ref === `refs/${ref}`)[0];
    }

    async createRef(ref: string, sha: string) {
        const { octokit, owner, repo } = this;

        await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/${ref}`,
            sha,
        });
    }

    async updateRef(ref: string, sha: string, force: boolean) {
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
        debug: core.isDebug()
            ? console.debug.bind(console)
            : (..._args: unknown[]) => {},
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
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
        if (existing.object.sha !== sha) {
            await repo.updateRef(ref, sha, force);
        }
    } else {
        await repo.createRef(ref, sha);
    }
}

run().catch((error: unknown) => {
    core.setFailed(String(error));
    core.debug(inspect(error));
});
