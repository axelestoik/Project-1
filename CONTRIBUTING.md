# Contributing to Lot 202

We welcome contributions! To ensure a smooth and collaborative process, please adhere to the following guidelines.

## Branching Strategy

We use a simple and effective branching model. All branches should be created from the `main` branch.

-   **`feature/<feature-name>`**: For new features (e.g., `feature/tenant-portal`).
-   **`fix/<issue-description>`**: For bug fixes (e.g., `fix/invoice-calculation-error`).
-   **`chore/<task-description>`**: For maintenance tasks, refactoring, or dependency updates (e.g., `chore/update-eslint-rules`).

**Do not commit directly to `main`.**

## Pull Request (PR) Process

1.  **Create a PR:** Once your feature or fix is complete, create a Pull Request to merge your branch into `main`.

2.  **Write a Clear Title & Description:**
    -   The title should be concise and follow a conventional commit format (e.g., `feat: Add tenant payment portal`).
    -   The description should clearly explain the "what" and "why" of the changes. If it resolves an issue, link to it (e.g., `Closes #42`).

3.  **Ensure Code Quality:**
    -   Run the linter and formatter before pushing: `npm run lint:fix` and `npm run format`.
    -   Ensure your code follows the established patterns in the repository.

4.  **Request a Review:**
    -   Assign at least one team member to review your PR.
    -   Address any feedback or requested changes promptly.

5.  **Merging:**
    -   Once the PR is approved and all checks pass, it can be squashed and merged into `main`.
