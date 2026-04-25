# Lot 202 - Property Management Platform

An integrated platform for property management including advanced accounting, service billing, and intelligent maintenance management powered by the Gemini API.

## Architecture Overview

This project follows a modular, scalable architecture to promote separation of concerns and maintainability.

-   **`/core`**: Contains foundational, application-wide logic. This includes core services (`geminiService.ts`), database seeding (`db/`), authentication hooks, and configuration management. This code is central to the application's operation.

-   **`/modules`**: This directory holds all feature-specific code. Each feature (e.g., Dashboard, Accounting, Properties) resides in its own sub-directory. This encapsulation ensures that features are self-contained and easy to reason about.

-   **`/shared`**: Home to reusable code that is not specific to any single feature module. This includes shared UI components (`Logo`, `Icons`), TypeScript types (`types/`), utility functions, and custom hooks.

-   **`/` (root)**: The application entry points (`index.html`, `index.tsx`, `App.tsx`) live here, orchestrating the overall layout and module loading.

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [npm](https://www.npmjs.com/) (v9 or later)
-   [VS Code](https://code.visualstudio.com/) with the [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extensions installed.

### Local Environment Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Run the setup script:**
    This script will install developer dependencies and create your local environment file.
    ```bash
    bash setup.sh
    ```

3.  **Configure API Key:**
    Open the newly created `.env` file and add your Google Gemini API key.
    ```
    API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```

4.  **Launch the Application:**
    Open the `index.html` file in your browser, preferably using a live server extension in VS Code to enable hot-reloading.

## CI/CD Pipeline

This project is configured with a continuous integration and deployment pipeline using GitHub Actions.

-   **Continuous Integration (CI):** On every pull request to `main`, the pipeline automatically runs linting, type-checking, and a security vulnerability scan to ensure code quality and security.
-   **Staging Deployment (CD):** Merges to the `main` branch are automatically deployed to a staging environment on GitHub Pages.
-   **Production Deployment (CD):** Deployments to production are triggered manually and are protected by a manual approval gate, ensuring that only authorized and verified releases are deployed.

For detailed configuration and setup instructions, please see the [CI/CD README](./.github/README.md).

## Environment Configuration

-   **Local:** Managed by the `.env` file, which is created by the `setup.sh` script. This file is ignored by Git and should never be committed.
-   **Staging & Production:** API keys and other environment variables should be configured directly in your deployment platform's settings (e.g., Vercel, Netlify, AWS Amplify). **Do not** commit environment files for these stages. The application will automatically use the `process.env.API_KEY` provided by the hosting platform during the build process.

## Development Conventions

For details on our branching strategy, commit messages, and pull request process, please see [CONTRIBUTING.md](./CONTRIBUTING.md).