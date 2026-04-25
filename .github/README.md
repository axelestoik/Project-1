# CI/CD Configuration

This directory contains the GitHub Actions workflows for the Lot 202 application.

## Setting Up Environments

For the deployment pipelines (`deploy-staging.yml` and `deploy-production.yml`) to function correctly, you need to configure environments in your repository settings.

### 1. Staging Environment (GitHub Pages)

The staging deployment uses GitHub Pages.

1.  Go to your repository's **Settings**.
2.  Navigate to the **Pages** section in the sidebar.
3.  Under "Build and deployment", select **GitHub Actions** as the source.
4.  The `deploy-staging.yml` workflow will automatically handle the rest. After the first successful run on the `main` branch, your staging URL will be available here.

### 2. Production Environment (with Manual Approval)

The production deployment is triggered manually and requires approval.

1.  Go to your repository's **Settings**.
2.  Navigate to the **Environments** section in the sidebar.
3.  Click **New environment**.
4.  Name the environment `production`.
5.  Under **Deployment protection rules**, check **Required reviewers**.
6.  Add the GitHub users or teams who are authorized to approve production deployments.
7.  Click **Save protection rules**.

Now, when the "Deploy to Production" workflow is run, it will pause and wait for an approval from one of the designated reviewers before proceeding.
