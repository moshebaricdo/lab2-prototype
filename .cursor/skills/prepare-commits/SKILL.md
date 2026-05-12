---
name: prepare-commits
description: Analyzes unstaged git changes, groups them into logical local commits, creates those commits safely, and leaves the branch ready for the user to push. Use when the user invokes /prepare-commits or asks to organize current changes into reviewable commits before pushing.
disable-model-invocation: true
---

# Prepare Commits

## Goal

Turn the current unstaged working-tree changes into clear, logical local commits that are ready for the user to push. Do not push.

## Workflow

1. Inspect the repository state:
   - `git status --short`
   - `git diff --stat`
   - `git diff`
   - `git diff --staged --stat`
   - `git diff --staged`
   - `git log --oneline -n 10`

2. If anything is already staged at the start, pause and ask how to handle it unless the user explicitly included staged changes in the request. Do not unstage user-staged work without permission.

3. Review untracked files before staging them. Do not commit secrets, credentials, `.env` files, private keys, generated artifacts, or dependency/build output unless the user explicitly confirms.

4. Group changes by intent, not by file count. Prefer separate commits for:
   - unrelated features
   - bug fixes
   - refactors
   - tests
   - documentation
   - generated or mechanical follow-up changes

5. Before committing, present the commit plan briefly:
   - commit title
   - files included
   - why those files belong together
   - any files intentionally left uncommitted

6. Stage and commit one group at a time using explicit pathspecs. Avoid interactive git commands such as `git add -i` or `git add -p`.

7. Use concise commit messages that match the repository's recent style. Prefer the imperative mood and focus on why the grouped change exists.

8. Always pass commit messages with a heredoc:

   ```bash
   git commit -m "$(cat <<'EOF'
   Commit message here.

   EOF
   )"
   ```

9. Never bypass hooks with `--no-verify`, `--no-gpg-sign`, or similar flags. If a hook fails, inspect the failure, fix what is clearly related, and create a normal new commit attempt.

10. After each commit, run `git status --short` and confirm the next planned group still matches the remaining changes.

11. After all planned commits are created, run:
    - `git status --short`
    - `git log --oneline -n 5`

12. Final response:
    - list the commits created
    - note any files left uncommitted and why
    - state whether the branch is ready for the user to push
    - provide the push command if useful, but do not run it

## Safety Rules

- Never run destructive commands such as `git reset --hard`, `git checkout --`, or force-push commands.
- Never update git config.
- Never amend an existing user commit unless the user explicitly asks and the normal git safety checks pass.
- If grouping is ambiguous, ask before committing.
- If verification is expensive or unavailable, state what was not run.
