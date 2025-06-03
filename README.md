# Create or Update Git Reference

Create or update a Git reference (branch or tag) through GitHub API.
Or, in other words, set a branch head or a tag to a specific commit.

If the reference (branch or tag) does not exist, it will be created.

If it already exists, it will be updated to point to the specified commit.

This action is intended to be used together with
https://github.com/amezin/create-commit-action to update the branch head after
commit, but can also be used standalone for other purposes.

## Usage examples

- Part of a workflow that creates/updates pull requests:
  https://github.com/amezin/pull-request-generator/blob/main/.github/workflows/make-pull-request.yml

- [Update major version tags of GitHub actions](./.github/workflows/update-major-tag.yml)

## Inputs

### `repository`

The owner and repository name, in `owner/name` format.

_Default_: `${{ github.repository }}` - the repository where the workflow was
triggered.

### `ref`

Git reference name to update or create, with `refs/heads/` or `refs/tags/`
prefix.

_Default_: `${{ github.ref }}` - the branch that triggered the workflow run.

> [!NOTE]
> The default value for `pull_request` event is `refs/pull/PULL_REQUEST_NUMBER/merge`.
> If you want to update pull request's source branch, use `refs/heads/${{ github.head_ref }}`.

### `sha`

Target commit SHA that the branch or tag should point to.

_Default_: `${{ github.sha }}` - the commit that triggered the workflow.

> [!NOTE]
> At least one of `ref` and `sha` should be set to a non-default value.
> Otherwise, you're just updating the "current" branch head to the same commit
> it already points to.

### `force`

Whether to allow non-fast-forward updates.

When set to `true`, the behavior is similar to `git push --force`.

When set to `false` (default), the behavior is similar to `git push` without `--force`.

_Default_: `false`

### `github-token`

GitHub API token to use.

Must have `contents: write` permission.

_Default_: `${{ github.token }}`

> [!NOTE]
> If you want GitHub Actions workflows to be triggered from `push` event, you
> should use a custom token (app installation or personal access token):
> https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow#triggering-a-workflow-from-a-workflow

## Outputs

Currently, none.
