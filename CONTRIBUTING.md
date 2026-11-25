# Contributing to RURAL-SEP

This document describes how work flows from an idea to
`main`. The process is loosely modelled on the
[Kubernetes contributor guide](https://www.kubernetes.dev/docs/guide/): every change
is tracked by an issue, lives on its own branch, passes CI, and is reviewed by the
people who own the code it touches.

> **TL;DR**
>
> 1. Pick an **issue** from your subteam's backlog and assign yourself.
> 2. Create a **branch** `<type>/<short-description>` from `main` for that issue.
> 3. Make **commits** named `<type>(<scope>): <description>`.
> 4. Open a **pull request** with the same title format and `Closes #<issue>` in the body.
> 5. Wait for **CI** (lint + tests) to pass and for the required **reviews**.
> 6. **Squash and merge.** Nobody pushes to `main` directly.

---

## Table of contents

- [Workflow overview](#workflow-overview)
- [Types](#types)
- [Scopes](#scopes)
- [Branches](#branches)
- [Commits](#commits)
- [Pull requests](#pull-requests)
- [Linting, formatting and tests](#linting-formatting-and-tests)
- [Merging](#merging)

---

## Workflow overview

```
issue #42 ──► branch feat/participant-table ──► commits ──► PR "feat(client): ..." ──► CI ✓ ──► review ✓ ──► squash merge into main
```

`main` is protected:

- No direct pushes, not even for maintainers.
- Every change lands through a pull request.
- A pull request can only be merged when CI is green, it has the required
  approvals, and all review conversations are resolved.

---

## Types

The **type** says what kind of change something is. The same list is used for
branch prefixes, commit messages, PR titles and issue titles, so you only need to
learn it once.

| Type       | Use it for                                                                     | Example                                               |
| ---------- | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `feat`     | A new feature or user-visible behaviour                                        | `feat(client): add participant filter sidebar`        |
| `fix`      | A bug fix                                                                      | `fix(server): return 404 for unknown participant id`  |
| `docs`     | Documentation only: README, guides, OpenAPI descriptions, comments              | `docs(api): describe /charts query parameters`        |
| `refactor` | Code change that neither fixes a bug nor adds a feature                        | `refactor(shared): extract date helpers into utils`   |
| `test`     | Adding or fixing tests only                                                    | `test(server): cover burden calculation edge cases`   |
| `style`    | Formatting, whitespace, lint fixes with no behaviour change                    | `style(client): apply prettier to dashboard layout`   |
| `chore`    | Maintenance: dependencies, configs, tooling, scripts                           | `chore(root): bump typescript to 5.9`                 |
| `ci`       | CI workflows and GitHub configuration                                          | `ci(root): run eslint on pull requests`               |

Need a new type? Propose it in a PR that updates this table.

> We use `fix`, not `bug`, to stay compatible with
> [Conventional Commits](https://www.conventionalcommits.org/), which lets us
> generate changelogs later.

---

## Scopes

The **scope** is the part of the repository the change touches. It matches the
top-level folders:

| Scope    | Folder     | Contains                                           |
| -------- | ---------- | -------------------------------------------------- |
| `client` | `client/`  | React frontend (React Router, Vite)                |
| `server` | `server/`  | Node backend / data service                        |
| `shared` | `shared/`  | Code and types shared by client and server         |
| `api`    | `api/`     | OpenAPI contract and generated types               |
| `db`     | `db/`      | Database schema and load scripts                   |
| `root`   | repo root  | Root configs, Docker/Compose, workspace setup, CI  |

If a change truly spans several scopes, list them separated by commas, e.g.
`feat(api,server): add /charts endpoint`. If you find yourself listing three or
more, consider splitting the work into smaller PRs.

---

## Branches

Issues are created as a backlog by each subteam. To start work, pick an issue,
assign yourself, and create a branch for it from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c <type>/<short-description>
```

**Format:** `<type>/<short-description>`

- `<type>` is one of the [types](#types) above.
- `<short-description>` is lowercase, words separated by hyphens, 2–5 words.
- Every branch belongs to exactly one issue. Link it from the PR with `Closes #<issue>`.

---

## Commits

**Format:**

```
<type>(<scope>): <description>

[optional body: what changed and why]

[optional footer: Refs #42, BREAKING CHANGE: ...]

```
Rules:

- `<description>` is in the **imperative mood**, lowercase, no trailing period:
  "add", "fix", "remove", not "added" / "fixes".
- Keep the subject line under ~72 characters.
- Use the body to explain *why* when it isn't obvious from the diff.
- One logical change per commit. Keep commit messages as close to the format as
  possible; the **PR title** must follow it exactly, since it becomes the commit
  on `main` when we squash-merge.
- Mark **breaking changes** with `!` after the scope, and explain them in a
  `BREAKING CHANGE:` footer.

**Breaking changes** are changes that force other code or other people to update
too, for example:

- renaming, removing or changing the parameters or response shape of an API
  endpoint that the client relies on
- changing a type in `shared/` that client or server code depends on
- changing the database schema in a way that requires recreating or migrating
  the database

Examples:

```
feat(client): add dashboard layout with sidebar and topbar
fix(server): handle empty csv rows when loading participants
docs(api): add /participants endpoints
refactor(shared): move api types into shared/api
chore(root): add eslint to all workspaces
feat(api)!: rename /participants/{id}/burden to /participants/{id}/load
BREAKING CHANGE: the client must call /participants/{id}/load instead.
```

---

## Pull requests

**Title:** the same format as commits. Because we squash-merge, the PR title
becomes the commit message on `main`, so it matters.

```
feat(client): add participant table with pagination
```

**Body:** fill in the [PR template](.github/pull_request_template.md). At minimum:

- `Closes #<issue>`, so the issue closes automatically on merge.
- A short summary of what changed and why.

**Guidelines:**

- **Keep PRs small and focused.** One issue per PR. Small PRs get reviewed faster
  and more thoroughly.
- Open a **draft PR** early if you want feedback before it's finished.
- Run lint and tests locally before requesting review.

---

## Linting, formatting and tests

Code quality is graded by the SEP Code Quality Assessment (SciTools Understand + Simian).
These commands check part of it locally; run them from the repo root.

| Command | What it checks |
| --- | --- |
| `npm run lint` | ESLint, including module size (SLOC <= 400) and max complexity (<= 20) |
| `npm run simian` | Internal/external code duplication with the assessment's Simian settings |
| `npm run quality` | Both of the above |

CI runs `lint` and `simian` on every PR. The files left out of the analysis are listed in the
[README](README.md#excluded-from-code-quality-analysis). The pass given by the CI is not equivalent to passing all quality metrics imposed by the course!
Some metrics in ESlint serve as rough approximations while others are just conventions to keep the code clean.

> TODO: formatting and test setup will be documented here.

---

## Merging

- We use **squash and merge** only. The PR title becomes the commit on `main`.
- The **author** merges once CI is green and reviews are approved (unless they
  ask a reviewer to do it).
- The branch is deleted automatically after merge.
- If `main` moved on and GitHub reports the branch is out of date, update it
  (rebase or merge `main`) and let CI re-run.
- Although each PR lands on `main` as a single squashed commit, the individual
  commits are not lost: open the PR (linked by the `(#<number>)` at the end of
  the commit message) and check its **Commits** tab.
