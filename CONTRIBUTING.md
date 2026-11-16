# Contributing to RURAL-SEP

Thanks for contributing! This document describes how work flows from an idea to
`main`. The process is loosely modelled on the
[Kubernetes contributor guide](https://www.kubernetes.dev/docs/guide/): every change
is tracked by an issue, lives on its own branch, passes CI, and is reviewed by the
people who own the code it touches.

> **TL;DR**
>
> 1. Open (or pick) an **issue** and label it `frontend`, `backend` and/or `shared`.
> 2. Create a **branch** `<type>/<short-description>` from `main`.
> 3. Make **commits** named `<type>(<scope>): <description>`.
> 4. Open a **pull request** with the same title format and `Closes #<issue>` in the body.
> 5. Wait for **CI** (lint + tests) to pass and for the required **reviews**.
> 6. **Squash and merge.** Nobody pushes to `main` directly.

---

## Table of contents

- [Workflow overview](#workflow-overview)
- [Types](#types)
- [Scopes](#scopes)
- [Issues](#issues)
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

## Issues

Every piece of work starts with an issue so it can be tracked and discussed
before code is written.

**Title** follows the same format as commits:

```
<type>(<scope>): <short description>
```

e.g. `feat(client): participant table with pagination`.

**Labels:** tag each issue with the part(s) of the codebase it affects. Add as
many as apply, e.g. a new endpoint that the UI consumes is `backend` + `frontend`.

| Label      | Covers                                  |
| ---------- | --------------------------------------- |
| `frontend` | `client/`                               |
| `backend`  | `server/`, `api/`, `db/`                |
| `shared`   | `shared/`                               |

**Body** should explain *what* and *why*, and list acceptance criteria where
possible. Assign yourself when you start working on it so work isn't duplicated.

---

## Branches

Create branches from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c <type>/<short-description>
```

**Format:** `<type>/<short-description>`

- `<type>` is one of the [types](#types) above.
- `<short-description>` is lowercase, words separated by hyphens, 2–5 words.
- Every branch must have an associated issue. Link it from the PR.

Keep branches short-lived. Rebase or merge `main` into your branch regularly to
avoid painful conflicts. Branches are deleted automatically after merge.

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
- One logical change per commit. "WIP" commits are fine on your branch since
  we squash on merge, but the **PR title** must follow the format.

Examples:

```
feat(client): add dashboard layout with sidebar and topbar
fix(server): handle empty csv rows when loading participants
docs(api): add /participants endpoints
refactor(shared): move api types into shared/api
chore(root): add eslint to all workspaces
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
- How you tested it (and screenshots for UI changes).

**Guidelines:**

- **Keep PRs small and focused.** One issue per PR. Small PRs get reviewed faster
  and more thoroughly.
- Open a **draft PR** early if you want feedback before it's finished.
- Run lint and tests locally before requesting review.
- Don't mix unrelated refactors or formatting into a feature PR. Open a separate
  one.
- If you change the OpenAPI contract, commit the regenerated types in the same PR
  (see [`api/DOCS_GUIDE.md`](api/DOCS_GUIDE.md)).

---

## Linting, formatting and tests

> TODO: ESLint, formatting and test setup will be documented here.

---

## Merging

- We use **squash and merge** only. The PR title becomes the commit on `main`.
- The **author** merges once CI is green and reviews are approved (unless they
  ask a reviewer to do it).
- The branch is deleted automatically after merge.
- If `main` moved on and GitHub reports the branch is out of date, update it
  (rebase or merge `main`) and let CI re-run.
