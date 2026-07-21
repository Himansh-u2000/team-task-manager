# Deploying Team Task Manager to AWS (Serverless) — Beginner's Guide

This guide walks you, command by command, through deploying:

```
React (Vite) ──> Amazon S3 ──┐
                              ├──> CloudFront (one public domain)
Express (Lambda) ──> API GW ─┘         │
        │                              │
        └──────────> MongoDB Atlas     └──> your browser
```

CloudFront sits in front of **both** origins under a single domain:
`/api/*` requests are forwarded to API Gateway → Lambda → MongoDB Atlas;
everything else is served from your S3 bucket (the built React app). This
keeps frontend and backend on the same origin in production, so there's no
CORS preflight and cookies stay first-party — exactly like your local dev
setup where Vite proxies `/api` to `localhost:5000`.

**Read this before you start:** because CloudFront needs the API Gateway
URL as an origin, and the Lambda function needs the CloudFront URL for its
CORS allow-list, you will touch the backend deploy **twice** — once to get
its URL, once at the end to feed it CloudFront's URL. That's expected, not
a mistake. The order below handles it.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Create an AWS account](#2-create-an-aws-account)
3. [Install Node.js](#3-install-nodejs)
4. [Install Git](#4-install-git)
5. [Install the AWS CLI](#5-install-the-aws-cli)
6. [Install the AWS SAM CLI](#6-install-the-aws-sam-cli)
7. [Create an IAM user](#7-create-an-iam-user)
8. [Configure AWS credentials](#8-configure-aws-credentials)
9. [Prepare MongoDB Atlas for Lambda](#9-prepare-mongodb-atlas-for-lambda)
10. [Store secrets in SSM Parameter Store](#10-store-secrets-in-ssm-parameter-store)
11. [Build the backend](#11-build-the-backend)
12. [Deploy Lambda + API Gateway](#12-deploy-lambda--api-gateway)
13. [Test the API directly](#13-test-the-api-directly)
14. [Deploy the React app to S3](#14-deploy-the-react-app-to-s3)
15. [Create the CloudFront distribution](#15-create-the-cloudfront-distribution)
16. [Reconnect CloudFront ↔ Lambda (final backend deploy)](#16-reconnect-cloudfront--lambda-final-backend-deploy)
17. [Test the full deployment](#17-test-the-full-deployment)
18. [Common deployment errors](#18-common-deployment-errors)
19. [Troubleshooting checklist](#19-troubleshooting-checklist)
20. [AWS Free Tier limits](#20-aws-free-tier-limits)
21. [Security best practices](#21-security-best-practices)
22. [Updating the app / redeploying after code changes](#22-updating-the-app--redeploying-after-code-changes)

---

## 1. Prerequisites

- A computer running macOS, Windows, or Linux, with a terminal.
- An email address for your AWS account.
- A credit/debit card (AWS requires one to create an account, even for
  Free Tier usage — you will not be charged if you stay within the limits
  described in [section 20](#20-aws-free-tier-limits)).
- A MongoDB Atlas cluster and connection string (you already use this
  locally via `MONGODB_URI` in `.env` — you'll reuse it, see
  [section 9](#9-prepare-mongodb-atlas-for-lambda)).

---

## 2. Create an AWS account

1. Go to the AWS sign-up page and click **Create an AWS Account**.
2. Enter your email, choose a password, and pick an AWS account name.
3. Enter billing/contact information and a payment method.
4. Choose the **Basic support plan (Free)**.
5. Verify your identity (AWS will call or text you a code).

![Screenshot: AWS account creation form](screenshots/01-aws-signup.png)

Once created, sign in to the **AWS Management Console** as the **root
user** — but you won't use the root user again after the next section.
Root credentials should be used only for account setup; day-to-day work
happens through the IAM user you create in [section 7](#7-create-an-iam-user).

---

## 3. Install Node.js

The Lambda function runs `nodejs20.x`, so install a matching major
version locally to avoid subtle behavior differences.

**macOS (Homebrew):**
```bash
brew install node@20
```

**Windows:** download the Node 20 LTS installer from nodejs.org and run it.

**Linux (nvm — recommended on any OS):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

**Verify:**
```bash
node -v
# Expected output: v20.x.x
npm -v
# Expected output: 10.x.x
```

---

## 4. Install Git

**macOS:** `brew install git` (or install Xcode Command Line Tools).
**Windows:** download and run the installer from git-scm.com.
**Linux:** `sudo apt-get install git` (Debian/Ubuntu) or your distro's package manager.

**Verify:**
```bash
git --version
# Expected output: git version 2.x.x
```

---

## 5. Install the AWS CLI

**macOS:**
```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

**Windows:** download and run the [64-bit AWS CLI MSI installer](https://awscli.amazonaws.com/AWSCLIV2.msi).

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Verify:**
```bash
aws --version
# Expected output: aws-cli/2.x.x Python/3.x.x ...
```

---

## 6. Install the AWS SAM CLI

**macOS:**
```bash
brew tap aws/tap
brew install aws-sam-cli
```

**Windows:** download and run the [AWS SAM CLI MSI installer](https://github.com/aws/aws-sam-cli/releases/latest).

**Linux:**
```bash
curl -L "https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip" -o "sam-installation.zip"
unzip sam-installation.zip -d sam-installation
sudo ./sam-installation/install
```

**Verify:**
```bash
sam --version
# Expected output: SAM CLI, version 1.1xx.x
```

---

## 7. Create an IAM user

Never use root credentials day-to-day. Create a dedicated IAM user for
deployments.

1. In the AWS Console, search for **IAM** and open it.
2. Go to **Users → Create user**.
3. Name it e.g. `team-task-manager-deployer`.
4. Skip "Provide user access to the AWS Management Console" (this user
   only needs programmatic/CLI access).
5. On the permissions step, choose **Attach policies directly**.
6. For a learning project, attaching **AdministratorAccess** is the
   simplest path (SAM deploys create IAM roles, Lambda functions, API
   Gateway APIs, S3 buckets, and CloudFront distributions — all in one
   command — which needs broad permissions). See
   [section 21](#21-security-best-practices) for a tighter, least-privilege
   policy list you can switch to once things are working.
7. Click **Create user**.

![Screenshot: IAM create user permissions step](screenshots/02-iam-create-user.png)

8. Open the new user → **Security credentials** tab → **Create access key**.
9. Choose **Command Line Interface (CLI)** as the use case, acknowledge
   the warning, and click through to **Create access key**.
10. **Copy the Access Key ID and Secret Access Key now** — the secret is
    shown only once.

![Screenshot: IAM access key created, showing the download-.csv option](screenshots/03-iam-access-key.png)

---

## 8. Configure AWS credentials

```bash
aws configure
```

You'll be prompted for four values:
```
AWS Access Key ID [None]: AKIA...............
AWS Secret Access Key [None]: ................................
Default region name [None]: us-east-1
Default output format [None]: json
```

Use any region close to you — this guide uses `us-east-1` throughout;
substitute your own consistently if you pick a different one.

**Verify:**
```bash
aws sts get-caller-identity
```
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/team-task-manager-deployer"
}
```
If you see your account ID and the IAM user's ARN, credentials are working.

---

## 9. Prepare MongoDB Atlas for Lambda

Lambda functions don't have a fixed, predictable IP address (unless you
put them in a VPC with a NAT Gateway, which costs money and isn't
Free-Tier friendly) — so Atlas's IP Access List needs to allow traffic
from anywhere:

1. In MongoDB Atlas, go to **Network Access**.
2. Click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`).
3. Confirm.

![Screenshot: Atlas Network Access, 0.0.0.0/0 entry](screenshots/04-atlas-network-access.png)

> This is safe *because* your database still requires username/password
> authentication (`MONGODB_URI` already contains credentials) — the IP
> allow-list is a secondary layer, not your only one. Atlas M0 (free)
> clusters don't support IP-list-free "AWS PrivateLink" style access, so
> this is the standard approach for serverless.

Grab your connection string from **Database → Connect → Drivers** — it
looks like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/team-task-manager?retryWrites=true&w=majority
```
You'll paste this into SSM Parameter Store in the next section (not into
any file).

---

## 10. Store secrets in SSM Parameter Store

`template.yaml` reads `MONGODB_URI` and `JWT_SECRET` from AWS Systems
Manager Parameter Store as **SecureString** parameters — never from a
committed file. Create them now:

```bash
aws ssm put-parameter \
  --name "/team-task-manager/mongodb-uri" \
  --type "SecureString" \
  --value "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/team-task-manager?retryWrites=true&w=majority"

aws ssm put-parameter \
  --name "/team-task-manager/jwt-secret" \
  --type "SecureString" \
  --value "$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
```

The second command generates a strong random 96-character JWT secret for
you — do not reuse a weak/guessable value.

**Verify (value stays masked):**
```bash
aws ssm get-parameter --name "/team-task-manager/jwt-secret" --with-decryption --query "Parameter.Version"
```
```
1
```
That `1` must match the `:1` version suffix already in `template.yaml`'s
`{{resolve:ssm-secure:...:1}}` references. If you ever rotate a secret
with another `put-parameter` call, the version increments — update
`template.yaml` to match, or CloudFormation will keep resolving the old
version.

---

## 11. Build the backend

From the repo root (where `template.yaml` lives):

```bash
sam build
```

**Expected output (abridged):**
```
Building codeuri: .../server/ runtime: nodejs20.x metadata: {} architecture: arm64 functions: TaskManagerFunction
Running NodejsNpmBuilder:NpmPack
Running NodejsNpmBuilder:NpmInstall
Running NodejsNpmBuilder:CopyNpmrc
Running NodejsNpmBuilder:CleanUpNpmrc
...
Build Succeeded

Built Artifacts  : .aws-sam/build
Built Template   : .aws-sam/build/template.yaml
```

This runs `npm install` for `server/` and stages the deployable package
under `.aws-sam/build/` (gitignored — regenerated every time).

---

## 12. Deploy Lambda + API Gateway

First deploy — use guided mode so SAM asks you for the parameters and
saves them into `samconfig.toml`:

```bash
sam deploy --guided
```

You'll be prompted:
```
Stack Name [team-task-manager]:
AWS Region [us-east-1]:
Parameter ClientUrl []: http://localhost:5173
Confirm changes before deploy [Y/n]: Y
Allow SAM CLI IAM role creation [Y/n]: Y
Disable rollback [y/N]: N
Save arguments to configuration file [Y/n]: Y
SAM configuration file [samconfig.toml]:
SAM configuration environment [default]:
```

For `ClientUrl`, use a placeholder like `http://localhost:5173` for now
— you don't have a CloudFront domain yet. You'll redeploy with the real
value in [section 16](#16-reconnect-cloudfront--lambda-final-backend-deploy).

SAM will show a changeset summary and ask **Deploy this changeset? [y/N]**
— type `y`.

**Expected output (abridged):**
```
CloudFormation stack changeset
-------------------------------------------------------------------
Operation   LogicalResourceId          ResourceType
-------------------------------------------------------------------
+ Add       TaskManagerFunction        AWS::Lambda::Function
+ Add       TaskManagerFunctionRole    AWS::IAM::Role
+ Add       ServerlessHttpApi          AWS::ApiGatewayV2::Api
+ Add       ServerlessHttpApiApiGatewayDefaultStage  AWS::ApiGatewayV2::Stage
...
-------------------------------------------------------------------

Successfully created/updated stack - team-task-manager in us-east-1

Outputs
-------------------------------------------------------------------
Key                 ApiUrl
Description         Invoke URL for the deployed API...
Value               https://abc123xyz.execute-api.us-east-1.amazonaws.com/

Key                 FunctionName
Value               team-task-manager-TaskManagerFunction-AbCdEfGh
-------------------------------------------------------------------
```

**Copy the `ApiUrl` value** — you'll need it for CloudFront in
[section 15](#15-create-the-cloudfront-distribution).

For every deploy *after* this first one, you can just run `sam deploy`
(no `--guided`) — it reuses `samconfig.toml`.

---

## 13. Test the API directly

```bash
curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/api/health
```
```json
{"status":"ok","timestamp":"2026-07-20T12:00:00.000Z"}
```

If that works, Lambda, API Gateway, and the `serverless-http` wiring are
all correct. If it fails, jump to [section 18](#18-common-deployment-errors)
before continuing.

**Tip — tail logs while testing:**
```bash
sam logs -n TaskManagerFunction --stack-name team-task-manager --tail
```

---

## 14. Deploy the React app to S3

**Create the bucket** (name must be globally unique — e.g. suffix with
your account ID):

```bash
aws s3 mb s3://team-task-manager-frontend-123456789012 --region us-east-1
```

Keep it **private** — CloudFront will access it via Origin Access
Control (OAC), configured in the next section, so public bucket access
is never needed:

```bash
aws s3api put-public-access-block \
  --bucket team-task-manager-frontend-123456789012 \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

**Build the React app:**
```bash
cd client
npm install
npm run build
```
```
vite v6.x.x building for production...
✓ 1234 modules transformed.
dist/index.html                   0.46 kB
dist/assets/index-xxxxxxxx.css   XX.XX kB
dist/assets/index-xxxxxxxx.js   XXX.XX kB
✓ built in X.XXs
```

**Upload to S3:**
```bash
aws s3 sync dist/ s3://team-task-manager-frontend-123456789012 --delete
cd ..
```

`--delete` removes files in the bucket that no longer exist locally —
important on every redeploy so old, renamed hashed assets don't linger.

---

## 15. Create the CloudFront distribution

This is easiest done in the console the first time (multi-origin +
cache-behavior setup is fiddly as raw CLI JSON).

### 15a. Create the distribution with the S3 origin

1. Console → **CloudFront → Distributions → Create distribution**.
2. **Origin domain:** select your `team-task-manager-frontend-...` S3 bucket.
3. **Origin access:** choose **Origin access control settings (recommended)**
   → **Create new OAC** → keep defaults → **Create**.
4. **Viewer protocol policy:** Redirect HTTP to HTTPS.
5. **Web Application Firewall (WAF):** "Do not enable" is fine for a
   Free-Tier personal project.
6. **Default root object:** `index.html`.
7. Click **Create distribution**.

![Screenshot: CloudFront create distribution, S3 origin + OAC](screenshots/05-cloudfront-create.png)

8. CloudFront will show a banner: **"The S3 bucket policy needs to be
   updated"** with a **Copy policy** button. Click it, then go to your S3
   bucket → **Permissions → Bucket policy → Edit**, paste it in, and save.
   This grants CloudFront (and only CloudFront) read access — the bucket
   itself stays fully private.

![Screenshot: S3 bucket policy editor with CloudFront OAC policy pasted in](screenshots/06-s3-bucket-policy.png)

### 15b. Add the SPA routing error page

React Router needs unknown paths (e.g. `/dashboard` on a hard refresh) to
still serve `index.html`:

1. In the distribution → **Error pages** tab → **Create custom error response**.
2. HTTP error code: **403**. Customize error response: **Yes**. Response
   page path: `/index.html`. HTTP Response code: **200**.
3. Repeat for **404**.

### 15c. Add the API Gateway origin

1. Distribution → **Origins** tab → **Create origin**.
2. **Origin domain:** paste your API Gateway host only — e.g.
   `abc123xyz.execute-api.us-east-1.amazonaws.com` (no `https://`, no
   trailing path).
3. **Protocol:** HTTPS only.
4. Leave the rest default → **Create origin**.

![Screenshot: CloudFront add origin, API Gateway domain](screenshots/07-cloudfront-api-origin.png)

### 15d. Add the `/api/*` cache behavior

1. **Behaviors** tab → **Create behavior**.
2. **Path pattern:** `/api/*`
3. **Origin:** the API Gateway origin you just created.
4. **Viewer protocol policy:** HTTPS only.
5. **Allowed HTTP methods:** GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE.
6. **Cache policy:** **CachingDisabled** (API responses must not be cached).
7. **Origin request policy:** **AllCookies** — no wait, use
   **AllViewerExceptHostHeader** (forwards cookies, the `Authorization`
   header, and query strings to your API, which it needs for JWT auth,
   while letting CloudFront/API Gateway manage the `Host` header
   correctly).
8. Click **Create behavior**.

![Screenshot: CloudFront /api/* behavior configuration](screenshots/08-cloudfront-api-behavior.png)

Wait for the distribution's status to flip from **Deploying** to
**Enabled** (5–15 minutes) — grab a coffee.

**Copy your CloudFront domain** (e.g. `d123456abcdef.cloudfront.net`)
from the distribution's overview page.

---

## 16. Reconnect CloudFront ↔ Lambda (final backend deploy)

Now that you have the real CloudFront domain, update the backend's CORS
allow-list to trust it, and point the frontend build's config note at it.

**Update `samconfig.toml`** (or just answer the prompt again with
`sam deploy --guided`) — replace the placeholder:
```toml
parameter_overrides = "ClientUrl=\"https://d123456abcdef.cloudfront.net\""
```

**Redeploy the backend:**
```bash
sam build
sam deploy
```

This updates the Lambda's `CLIENT_URL` environment variable, which
`app.js`'s `cors()` middleware uses as its allow-list origin, and which
`authController.js` cookies rely on being correctly same-site.

Since the recommended setup keeps the frontend on relative `/api` calls
(see `client/src/services/api.js`), **no frontend rebuild is required**
for this step — only re-run it if you deliberately set `VITE_API_URL`.

---

## 17. Test the full deployment

1. Open `https://<your-distribution>.cloudfront.net` in a browser.
2. Sign up for a new account, then log in.
3. Open DevTools → **Network** tab → confirm requests go to
   `/api/auth/login` etc. (relative, same origin as the page — no CORS
   errors in the console) and that a `Set-Cookie: token=...` header comes
   back on login.
4. Create a project, add a task, drag it across the kanban board —
   confirm it persists after a page refresh.
5. Open DevTools → **Application** tab → **Cookies** → confirm the
   `token` cookie has `Secure` and `SameSite=None` (both required since
   requests genuinely cross from browser → CloudFront → API Gateway →
   Lambda, even though the *domain* looks the same to the browser).

![Screenshot: deployed app running at the CloudFront URL, DevTools network tab showing /api calls](screenshots/09-full-deployment-test.png)

---

## 18. Common deployment errors

| Symptom | Cause | Fix |
|---|---|---|
| `sam build` fails with `npm ERR!` | `server/package-lock.json` out of sync with `package.json` | Run `npm install` inside `server/` locally first, commit the updated lockfile, then `sam build` again |
| `curl .../api/health` returns `{"message":"Internal Server Error"}` or times out | Lambda can't reach MongoDB Atlas | Confirm Atlas Network Access allows `0.0.0.0/0` ([section 9](#9-prepare-mongodb-atlas-for-lambda)); check `sam logs -n TaskManagerFunction --tail` for the real Mongoose error |
| `502 Bad Gateway` from API Gateway | Lambda threw an unhandled error or timed out | `sam logs -n TaskManagerFunction --tail` and look for a stack trace; check `MemorySize`/`Timeout` in `template.yaml` if it's a cold-start timeout |
| `Unable to import module 'lambda': Cannot find module 'serverless-http'` | `npm install` wasn't run before `sam build`, or ran in the wrong directory | Ensure `serverless-http` is in `server/package.json` dependencies (already added), then `sam build` again — SAM installs `server/`'s deps automatically |
| Browser console: `blocked by CORS policy` | `ClientUrl` parameter doesn't match the exact origin making the request | Confirm `ClientUrl` (in `samconfig.toml`) is `https://<distribution>.cloudfront.net` with no trailing slash, matching the browser's address bar exactly, then `sam deploy` again |
| Login succeeds but you're immediately logged out / cookie never sticks | Cookie `SameSite=None; Secure` requires HTTPS everywhere and third-party-cookie support | Confirm you're testing over `https://`, not `http://`; some browsers/extensions block third-party cookies even with `SameSite=None` — this is why routing `/api/*` through CloudFront (same-site) instead of hitting API Gateway directly matters |
| React app loads but refreshing `/dashboard` gives an S3 `NoSuchKey`/403 XML page | CloudFront isn't rewriting SPA routes to `index.html` | Redo [15b](#15b-add-the-spa-routing-error-page) — custom error responses for 403 and 404 |
| Old JS/CSS still served after a redeploy | CloudFront cached the old files | Run `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"` |
| `AccessDenied` calling `aws ssm put-parameter` or `sam deploy` | IAM user lacks permissions | Recheck the policy attached in [section 7](#7-create-an-iam-user); for a fast unblock, temporarily use `AdministratorAccess`, then scope down per [section 21](#21-security-best-practices) |
| `An error occurred (ValidationError)... {{resolve:ssm-secure:...}}` during deploy | The SSM parameter doesn't exist yet, or the `:1` version doesn't match | Re-run the `aws ssm put-parameter` commands in [section 10](#10-store-secrets-in-ssm-parameter-store); check the real version with `aws ssm get-parameter ... --query "Parameter.Version"` and update `template.yaml` if it's not `1` |

---

## 19. Troubleshooting checklist

Work through these top-to-bottom whenever something's broken and you're
not sure why:

1. `curl https://<api-url>/api/health` — does the Lambda respond at all?
2. `sam logs -n TaskManagerFunction --stack-name team-task-manager --tail` — any stack trace?
3. `aws ssm get-parameters --names "/team-task-manager/mongodb-uri" "/team-task-manager/jwt-secret" --with-decryption --query "Parameters[].Version"` — do both parameters exist, and does the version match `template.yaml`'s `:1`?
4. MongoDB Atlas → **Network Access** — is `0.0.0.0/0` present and active?
5. Browser DevTools → **Network** tab on the failing request — what's the actual response status/body, and which origin was it sent to?
6. CloudFront distribution status — **Enabled**, not still **Deploying**?
7. `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"` — rule out stale cache as the cause.
8. `aws cloudformation describe-stack-events --stack-name team-task-manager --max-items 20` — for deploy-time failures, this shows exactly which resource failed and why.

---

## 20. AWS Free Tier limits

| Service | Free Tier allowance (typical, always-free or 12-month) | Notes for this project |
|---|---|---|
| Lambda | 1M requests/month + 400,000 GB-seconds compute, **always free** | 256 MB × arm64 for a low-traffic personal project stays well inside this |
| API Gateway (HTTP API) | 1M requests/month free for 12 months | HTTP APIs are already ~70% cheaper than REST APIs post-Free-Tier |
| S3 | 5 GB storage, 20,000 GET / 2,000 PUT requests/month, 12 months | A Vite build is a few MB — negligible |
| CloudFront | 1 TB data transfer out + 10M requests/month, **always free** | Very unlikely to exceed this for a small app |
| SSM Parameter Store | Standard parameters (what this project uses) are **always free** | No advanced/high-throughput tier needed here |
| CloudWatch Logs | 5 GB ingestion + 5 GB storage/month, always free | Lambda logs count against this; low volume for a small app |
| MongoDB Atlas M0 | 512 MB storage, shared RAM/vCPU, **always free** (not AWS, separate account) | Fine for development and small production workloads |

Set a **Billing budget alert** as a safety net regardless:
Console → **Billing → Budgets → Create budget** → Zero spend budget →
enter your email for alerts.

![Screenshot: AWS Budgets, zero-spend budget alert setup](screenshots/10-billing-budget.png)

---

## 21. Security best practices

- **Least-privilege IAM (post-setup):** once your stack deploys cleanly,
  swap the deployer user's `AdministratorAccess` for a scoped policy
  covering only: `AWSCloudFormationFullAccess`, `AWSLambda_FullAccess`,
  `AmazonAPIGatewayAdministrator`, `AmazonS3FullAccess`,
  `CloudFrontFullAccess`, `AmazonSSMFullAccess`, and `IAMFullAccess`
  scoped down to `iam:PassRole`/`iam:CreateRole` on
  `arn:aws:iam::*:role/team-task-manager-*` only (SAM needs to create the
  Lambda's execution role).
- **Secrets never touch git.** `MONGODB_URI` and `JWT_SECRET` live only
  in SSM Parameter Store (SecureString, KMS-encrypted at rest) and are
  resolved at deploy time — they're not in `template.yaml`,
  `samconfig.toml`, or the Lambda console's "reveal" view the way plain
  environment variables would be.
- **`.env` stays local-only.** It's already gitignored; never commit it,
  and never paste real secrets into `template.yaml` "just to test."
- **Rotate the JWT secret if it's ever exposed** — every existing session
  cookie becomes invalid immediately (users need to log in again), which
  is the correct trade-off after a leak.
- **S3 bucket stays private**, accessed only via CloudFront's Origin
  Access Control — never enable "S3 static website hosting" public mode
  for this setup, it would let people bypass CloudFront entirely.
- **`helmet` and the `cors` allow-list are already wired up** in `app.js`
  — don't loosen `CLIENT_URL`/CORS to `*` "to make an error go away";
  fix the actual origin mismatch instead ([section 18](#18-common-deployment-errors)).
- **Rate limiting caveat:** `express-rate-limit` (used on `/api/auth/*`)
  stores counters in-memory per Lambda execution environment. Under real
  concurrent traffic across multiple warm Lambda containers, this is
  *best-effort*, not a hard global limit — acceptable for a small/personal
  deployment, but if you need a strict global limit later, back it with
  DynamoDB or API Gateway's own throttling instead of rewriting the
  Express middleware.
- **Keep dependencies patched:** run `npm audit` in both `client/` and
  `server/` periodically, especially before each deploy.
- **CloudWatch Logs retention:** by default Lambda log groups never
  expire. Set a retention period (e.g. 30 days) to control cost/exposure:
  ```bash
  aws logs put-retention-policy --log-group-name /aws/lambda/<FunctionName> --retention-in-days 30
  ```

---

## 22. Updating the app / redeploying after code changes

### Backend changes (routes, controllers, models, middleware, `app.js`, `lambda.js`)

```bash
sam build
sam deploy
```
`sam deploy` (without `--guided`) reuses everything saved in
`samconfig.toml`. SAM only updates what changed via a CloudFormation
changeset — typically a 30–60 second deploy.

### Frontend changes (anything in `client/src`)

```bash
cd client
npm run build
aws s3 sync dist/ s3://team-task-manager-frontend-123456789012 --delete
aws cloudfront create-invalidation --distribution-id <YOUR_DISTRIBUTION_ID> --paths "/*"
cd ..
```

Find `<YOUR_DISTRIBUTION_ID>` with:
```bash
aws cloudfront list-distributions --query "DistributionList.Items[].{Id:Id,Domain:DomainName}"
```

The invalidation step matters — without it, CloudFront keeps serving the
previous build's cached `index.html`/JS/CSS to visitors for up to 24
hours.

### Rotating a secret later

```bash
aws ssm put-parameter --name "/team-task-manager/jwt-secret" --type "SecureString" --value "<new-value>" --overwrite
aws ssm get-parameter --name "/team-task-manager/jwt-secret" --query "Parameter.Version"
```
Update the `:N` version suffix in `template.yaml`'s
`{{resolve:ssm-secure:/team-task-manager/jwt-secret:N}}` to match the
number returned, then `sam build && sam deploy`.

### Rolling back a bad backend deploy

```bash
aws cloudformation rollback-stack --stack-name team-task-manager
```
Or simply fix-forward: revert the code change locally, `sam build && sam deploy` again — CloudFormation changesets make this safe and fast.
