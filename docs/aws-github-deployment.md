# AWS deployment from GitHub

This repository is designed to keep the source code in GitHub while AWS hosts
the built application. Do not commit AWS credentials, database passwords, JWT
secrets, or Google API keys.

## Hosting model

- **Frontend:** AWS Amplify Hosting connected to this GitHub repository.
- **Backend:** GitHub Actions builds `backend/Dockerfile`, pushes the image to
  Amazon ECR, and deploys it through AWS Systems Manager (SSM) to every healthy
  instance in the backend Auto Scaling Group.
- **Database:** Amazon RDS for PostgreSQL. The database is not stored in GitHub.
- **Traffic:** An Application Load Balancer forwards requests to port `5001` on
  the backend instance. The target-group health check is `/api/health`.

The AWS deployment is configured as an EC2 Auto Scaling deployment:

- Auto Scaling Group: `insane-stays-backend-asg`
- Launch Template: `insane-stays-backend-lt`
- Capacity: minimum `1`, desired `1`, maximum `2`
- Scaling policy: target average CPU utilization of `50%`
- Target group health check: `GET /api/health` on port `5001`

## Amplify setup

In AWS Amplify Hosting, choose **New app → Host web app → GitHub**, authorize the
Amplify GitHub App, and select this repository and the `main` branch. Amplify
will use the root `amplify.yml` file and deploy `frontend/dist`.

Add these Amplify environment variables:

```text
VITE_API_URL=https://api.example.com
VITE_GOOGLE_MAPS_BROWSER_KEY=<browser-key>
VITE_GOOGLE_MAPS_MAP_ID=<optional-map-id>
```

The frontend is built on Amplify, so `VITE_API_URL` must be set before each
production build. It is not read from the backend environment.

## GitHub Actions setup

The backend deployment workflow uses GitHub OIDC rather than a long-lived AWS
access key. Create an AWS IAM OIDC provider for `token.actions.githubusercontent.com`
and an IAM role trusted only by this repository and the `main` branch.

The role needs permission to:

- push images to the selected ECR repository;
- send commands with SSM to the backend instance; and
- read the command result.

The EC2 instance role needs permission to pull from ECR and be managed by SSM.
Install the SSM Agent, Docker, and AWS CLI on the instance. The instance must
also be in a security group that permits port `5001` from the load balancer's
security group.

Configure these GitHub repository variables:

```text
AWS_REGION=us-west-2
ECR_REPOSITORY=insane-stays-backend
BACKEND_ASG_NAME=insane-stays-backend-asg
BACKEND_HEALTHCHECK_URL=https://api.example.com
```

Configure this GitHub repository secret:

```text
AWS_DEPLOY_ROLE_ARN=arn:aws:iam::<account-id>:role/<github-deploy-role>
```

For the current AWS account, the deployment role ARN is:

```text
arn:aws:iam::812299241699:role/insane-stays-github-deploy-role
```

Every push to `main` that changes `backend/**` will build and push a commit-tagged
image, deploy it through SSM to all `InService` Auto Scaling instances, and call
`/api/health` after deployment.

The GitHub role is trusted only by the `main` branch of the team repository and
does not use a long-lived AWS access key.

## Runtime configuration

Application configuration belongs on the EC2 host or in AWS Secrets Manager /
Systems Manager Parameter Store, not in GitHub. The backend requires:

```text
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://<amplify-domain>
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=insane_stays
DB_USER=<database-user>
DB_PASSWORD=<database-password>
JWT_SECRET=<long-random-secret>
GOOGLE_MAPS_SERVER_KEY=<server-key>
```

For the current workflow, place those values in the root-owned file
`/etc/insane-stays/backend.env` on the EC2 instance and restrict it to the
Docker/administrator users. The deployment starts the new container with that
file as its `--env-file`.

For a stronger production setup, replace the host file with a startup/deploy
script that reads the values from Secrets Manager or Parameter Store.

## Database migrations

Run the SQL migrations against RDS once, in this order:

1. `backend/database/schema.sql`
2. `backend/database/add_property_location.sql`
3. `backend/database/add_property_schedule.sql`
4. `backend/database/create_reviews.sql`
5. `backend/database/create_messaging.sql`

Do not put the RDS endpoint, database password, or migration dump in the GitHub
repository.
