# Production deployment

## Release sequence

1. Make and review the code change; deploys start when a commit reaches `master`.
2. GitHub Actions packages that commit and uploads it to the server. There is no separate GitHub build: the server performs the single production install, Prisma client generation, and Next.js build before switching releases.
3. If installation or build fails, the active service configuration is untouched. Do not rerun the same failed deployment blindly; inspect its log, fix the reported cause, and make a new commit.
4. After a successful build, the workflow switches the systemd working directory and checks `/` and `/deck`. If either check fails, it restores the previous working directory and restarts the previous release.
5. The database is not migrated as part of this workflow. Additive database changes require a separately reviewed migration plan.

The workflow is `.github/workflows/deploy-production.yml`. It uses the GitHub Actions secret `YASEN_DEPLOY_KEY`. Do not create temporary deployment workflows, upload keys or archives into the repository, or repeat a failing run without changing its cause.
