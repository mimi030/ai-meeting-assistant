# AI Meeting Assistant

Generate meeting agendas and summaries with AI-powered assistance. This application leverages OpenAI to create structured agendas from meeting topics and manages transcripts via AWS S3.

## 🚀 Features

- **AI-Powered Agenda Generation** - Create structured meeting agendas from topics using OpenAI
- **Transcript Management** - Upload and store meeting transcripts in AWS S3
- **Meeting History** - Track all generated meetings with timestamps
- **Responsive Design** - Built with Next.js and Tailwind CSS
- **Secure Deployment** - Support for Docker local testing and Vercel production deployment

## 📋 Prerequisites

### Required Services

#### 1. OpenAI API

- [Get API Key](https://platform.openai.com/api-keys)
- Create account and generate secret key
- Keep key secure (never commit to git)

#### 2. AWS Account

You'll need to set up the following AWS resources:

**Required:**

- S3 bucket for transcript storage
- DynamoDB table for meeting data
- IAM user with appropriate permissions
- CORS configuration on S3 bucket

**Optional:**

- CloudWatch for monitoring (recommended)
- AWS CloudTrail for audit logging

### Local Development

- **Node.js** 20+
- **npm** or **yarn**
- **Docker** (for containerized local deployment)
- **AWS CLI** (optional, for AWS setup via command line)

## 🛠️ Tech Stack

| Layer      | Technology                      |
| ---------- | ------------------------------- |
| Frontend   | Next.js 14, React, Tailwind CSS |
| Backend    | Next.js API Routes              |
| Database   | AWS DynamoDB                    |
| Storage    | AWS S3                          |
| AI         | OpenAI API                      |
| Validation | Zod                             |
| Container  | Docker                          |

---

## ⚙️ AWS Setup Prerequisites

### Overview

This section guides you through setting up all AWS resources needed for both **local Docker deployment** and **Vercel production deployment**.

**Resources to create:**

1. ✅ S3 Bucket (for transcripts)
2. ✅ DynamoDB Table (for meeting data)
3. ✅ IAM User (for credentials)
4. ✅ S3 CORS Configuration (for uploads)

---

### Step 1: Create S3 Bucket

#### Via AWS Console

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click **Create bucket**
3. **Bucket name:** `your_s3_bucket_name` (must be globally unique, can add suffix like `-yourname`)
4. **Region:** Select your region (e.g., `us-east-1`)
5. **Block Public Access:** Keep all ✅ checked (important for security)
6. Click **Create bucket**
7. **Copy the bucket name** - you'll need it later

#### Via AWS CLI

```bash
aws s3 mb s3://your_s3_bucket_name --region us-east-1
```

#### Verify Bucket Created

```bash
aws s3 ls
```

You should see your bucket in the list.

---

### Step 2: Enable S3 Encryption (Recommended)

#### Via AWS Console

1. Go to [S3 Console](https://s3.console.aws.amazon.com/) → Your bucket
2. Click **Properties** tab
3. Scroll to **Default encryption**
4. Click **Edit**
5. Select **SSE-S3**
6. Click **Save changes**

#### Via AWS CLI

```bash
aws s3api put-bucket-encryption \
  --bucket your_s3_bucket_name \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' \
  --region us-east-1
```

---

### Step 3: Enable S3 Versioning (Optional, but Recommended)

Protects against accidental deletions.

#### Via AWS Console

1. Go to your S3 bucket
2. Click **Properties** tab
3. Scroll to **Versioning**
4. Click **Edit**
5. Select **Enable versioning**
6. Click **Save changes**

#### Via AWS CLI

```bash
aws s3api put-bucket-versioning \
  --bucket your_s3_bucket_name \
  --versioning-configuration Status=Enabled \
  --region us-east-1
```

---

### Step 4: Create DynamoDB Table

#### Via AWS Console

1. Go to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
2. Click **Create table**
3. **Table name:** `your_dynamodb_table_name` (exact name required)
4. **Partition key:** `id` (String)
5. **Sort key:** None (leave empty)
6. **Billing mode:** Pay-per-request (good for variable traffic)
7. Click **Create table**
8. Wait for table status to show **Active** (usually 1-2 minutes)

#### Via AWS CLI

```bash
aws dynamodb create-table \
  --table-name your_dynamodb_table_name \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

#### Verify Table Created

```bash
aws dynamodb describe-table --table-name your_dynamodb_table_name --region us-east-1
```

Check for `"TableStatus": "ACTIVE"`

---

### Step 4b: Create Global Secondary Index (GSI)

The application uses a GSI to efficiently query meetings by status. Create this index after the table is active.

#### Via AWS Console

1. Go to [DynamoDB Console](https://console.aws.amazon.com/dynamodb/) → Your table
2. Click **Indexes** tab
3. Click **Create index**
4. **Partition key:** `status` (String)
5. **Sort key:** `createdAt` (String)
6. **Index name:** `status-createdAt-index`
7. **Projection type:** All attributes
8. Click **Create index**
9. Wait for index status to show **Active** (usually 2-5 minutes)

#### Via AWS CLI

```bash
aws dynamodb update-table \
  --table-name your_dynamodb_table_name \
  --attribute-definitions \
    AttributeName=status,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --global-secondary-index-updates \
    "[{\"Create\":{\"IndexName\":\"status-createdAt-index\",\"KeySchema\":[{\"AttributeName\":\"status\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
  --region us-east-1#### Verify GSI Created

aws dynamodb describe-table --table-name your_dynamodb_table_name --region us-east-1 | grep -A 10 "GlobalSecondaryIndexes"
# Look for `"IndexStatus": "ACTIVE"` in the output.
```

#### Table Schema

The DynamoDB table stores meetings with the following structure:

- **Primary Key:** `id` (String) - Unique meeting identifier
- **Required Fields:**
  - `id` (String)
  - `title` (String)
  - `topics` (String)
  - `status` (String) - Either `"in_progress"` or `"complete"`
  - `createdAt` (String) - ISO 8601 timestamp
  - `updatedAt` (String) - ISO 8601 timestamp
- **Optional Fields:**
  - `description` (String)
  - `agenda` (String)
  - `notes` (String)
  - `summary` (String)
  - `actionItems` (String)
  - `transcriptUrl` (String)

**Note:** The `status` field is required for the GSI to work properly. New meetings are automatically created with `status: "in_progress"`. The status automatically changes to `"complete"` when notes are added to a meeting.

---

### Step 5: Create IAM User with Permissions

#### Via AWS Console

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** (left sidebar)
3. Click **Create user**
4. **User name:** `ai-meeting-assistant`
5. Click **Next**
6. Choose **Attach policies directly**
7. Search for and select these policies:
   - ✅ `AmazonS3FullAccess`
   - ✅ `AmazonDynamoDBFullAccess`
8. Click **Next** → **Create user**

#### Via AWS CLI

```bash
# Create user
aws iam create-user --user-name ai-meeting-assistant

# Attach S3 policy
aws iam attach-user-policy \
  --user-name ai-meeting-assistant \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Attach DynamoDB policy
aws iam attach-user-policy \
  --user-name ai-meeting-assistant \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

---

### Step 6: Create Access Keys for IAM User

⚠️ **CRITICAL:** Access keys are only shown once. Save them immediately!

#### Via AWS Console

1. Go to [IAM Users](https://console.aws.amazon.com/iam/users/)
2. Click the `ai-meeting-assistant` user
3. Click **Security credentials** tab
4. Scroll to **Access keys** section
5. Click **Create access key**
6. Select **Application running outside AWS**
7. Click **Next**
8. Click **Create access key**
9. **IMPORTANT:** Copy both values immediately:
   - **Access Key ID** (starts with `AKIA`)
   - **Secret Access Key**

Store these securely:

```
Access Key ID:     AKIA...
Secret Access Key: wJa...
```

#### Via AWS CLI

```bash
aws iam create-access-key --user-name ai-meeting-assistant
```

---

### Step 7: (Recommended) Create Custom IAM Policy for Least Privilege

For tighter security, create a custom policy instead of using full S3/DynamoDB access.

#### Via AWS Console

1. Go to [IAM Policies](https://console.aws.amazon.com/iam/policies/)
2. Click **Create policy**
3. Click **JSON** tab
4. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3TranscriptAccess",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::your_s3_bucket_name/*"
    },
    {
      "Sid": "DynamoDBMeetingAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/your_dynamodb_table_name"
    }
  ]
}
```

5. Click **Next**
6. **Policy name:** `ai-meeting-assistant-policy`
7. Click **Create policy**
8. Go back to the IAM user
9. Click **Add permissions** → **Attach policies directly**
10. Search for and select `ai-meeting-assistant-policy`
11. Click **Attach policies**

---

### Step 8: Configure S3 CORS (Critical for File Uploads)

CORS (Cross-Origin Resource Sharing) allows your frontend to upload files directly to S3.

#### For Local Testing + Vercel Production

Use this configuration for both environments:

1. Go to [S3 Console](https://s3.console.aws.amazon.com/) → Your bucket
2. Click **Permissions** tab
3. Scroll to **Cross-origin resource sharing (CORS)**
4. Click **Edit**
5. Paste this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": [
      "https://your-vercel-url.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://0.0.0.0:3000"
    ],
    "ExposeHeaders": []
  }
]
```

6. Click **Save changes**

⚠️ **IMPORTANT:** Replace `your-vercel-url.vercel.app` with your actual Vercel domain after deployment!

#### For Local Testing Only

If you only want to test locally:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://0.0.0.0:3000"
    ],
    "ExposeHeaders": []
  }
]
```

#### For Production Only (After Vercel Deployment)

When ready for production, restrict to Vercel URL only:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["https://your-vercel-url.vercel.app"],
    "ExposeHeaders": []
  }
]
```

---

## ✅ AWS Setup Verification Checklist

Before proceeding, verify everything is set up:

- [ ] S3 bucket created: `your_s3_bucket_name`
- [ ] S3 bucket encryption enabled
- [ ] S3 bucket versioning enabled (optional, but recommended)
- [ ] DynamoDB table created: `your_dynamodb_table_name`
- [ ] DynamoDB table is "Active"
- [ ] IAM user created: `ai-meeting-assistant`
- [ ] Access keys generated and saved securely
- [ ] S3 CORS configured with localhost origins
- [ ] All credentials copied to safe location

**Status:** AWS prerequisites complete ✅

---

## 📦 Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/100DaysOpenSource.git
cd 100DaysOpenSource/AIMeetingAgenda/ai-meeting-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env.local` file for **local development**:

```bash
# OpenAI - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-actual-api-key-here

# AWS Credentials - From IAM user creation
AWS_ACCESS_KEY_ID=AKIA-your-actual-access-key
AWS_SECRET_ACCESS_KEY=your-actual-secret-key

# AWS Configuration
AWS_REGION=us-east-1

# AWS Resources - From setup above
S3_BUCKET_NAME=your_s3_bucket_name
DYNAMODB_TABLE_NAME=your_dynamodb_table_name
```

**Example `.env.local`:**

```bash
OPENAI_API_KEY=sk-proj-abc123...
AWS_ACCESS_KEY_ID=your_actual_access_key_id
AWS_SECRET_ACCESS_KEY=your_actual_secret_access_key
AWS_SESSION_TOKEN=your_actual_session_token
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_s3_bucket_name
DYNAMODB_TABLE_NAME=your_dynamodb_table_name
```

⚠️ **IMPORTANT:** Never commit `.env.local` to git. It's already in `.gitignore`.

---

## 🚀 Local Development

### Run Development Server

```bash
npm run dev
```

Opens at `http://localhost:3000`

### Available Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## 🐳 Docker Deployment (Local Testing)

### Prerequisites

- Docker installed on your machine
- AWS resources created and configured (S3, DynamoDB, IAM)
- S3 CORS configured with `http://localhost:3000`
- Access keys and API key ready

### Step 1: Build Docker Image

```bash
docker build -t ai-meeting-assistant .
```

### Step 2: Create `.env.production` File

Create `.env.production` in the project root:

```bash
# OpenAI
OPENAI_API_KEY=sk-your-actual-api-key-here

# AWS Credentials
AWS_ACCESS_KEY_ID=AKIA-your-actual-access-key
AWS_SECRET_ACCESS_KEY=your-actual-secret-key
AWS_REGION=us-east-1

# AWS Resources
S3_BUCKET_NAME=your_s3_bucket_name
DYNAMODB_TABLE_NAME=your_dynamodb_table_name
```

⚠️ **CRITICAL SECURITY:**

- Never commit `.env.production` to git
- Never push Docker image with secrets
- Use environment variables at runtime only

### Step 3: Run Docker Container

#### Option A: Using environment file (Recommended)

```bash
docker run --env-file .env.production -p 3000:3000 ai-meeting-assistant
```

#### Option B: Using individual environment variables

```bash
docker run -e OPENAI_API_KEY="sk-your-key" \
           -e AWS_ACCESS_KEY_ID="AKIA..." \
           -e AWS_SECRET_ACCESS_KEY="wJa..." \
           -e AWS_REGION="us-east-1" \
           -e S3_BUCKET_NAME="your_s3_bucket_name" \
           -e DYNAMODB_TABLE_NAME="your_dynamodb_table_name" \
           -p 3000:3000 ai-meeting-assistant
```

### Step 4: Test the App

1. Open browser: `http://localhost:3000`
2. Test agenda generation
3. Test transcript upload
4. Verify data in AWS:

```bash
# Check S3 uploads
aws s3 ls s3://your_s3_bucket_name/

# Check DynamoDB items
aws dynamodb scan --table-name your_dynamodb_table_name
```

### Docker Commands Reference

```bash
# Build image
docker build -t ai-meeting-assistant .

# Run container
docker run --env-file .env.production -p 3000:3000 ai-meeting-assistant

# List running containers
docker ps

# View container logs
docker logs <container-id>

# Stop container
docker stop <container-id>

# Remove container
docker rm <container-id>

# Remove image
docker rmi ai-meeting-assistant

# Run in detached mode (background)
docker run -d --env-file .env.production -p 3000:3000 ai-meeting-assistant

# View logs with follow
docker logs -f <container-id>
```

---

## 🚀 Vercel Deployment (Production)

### Prerequisites

- GitHub account with repository pushed
- AWS resources fully configured (S3, DynamoDB, IAM)
- OpenAI API key ready
- Access keys from IAM user
- Vercel account (free tier available)

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your repositories

### Step 2: Import Repository

1. Click **Add New** → **Project**
2. Click **Import Git Repository**
3. Paste your repository URL
4. Click **Import**

### Step 3: Configure Environment Variables

**CRITICAL:** Never commit secrets to git. Add them in Vercel dashboard only.

1. Vercel dashboard → **Settings** → **Environment Variables**
2. Add each variable individually:

| Variable                | Value                      | Type   |
| ----------------------- | -------------------------- | ------ |
| `OPENAI_API_KEY`        | `sk-...`                   | Secret |
| `AWS_ACCESS_KEY_ID`     | `AKIA...`                  | Secret |
| `AWS_SECRET_ACCESS_KEY` | Your secret key            | Secret |
| `AWS_REGION`            | `us-east-1`                | Plain  |
| `S3_BUCKET_NAME`        | `your_s3_bucket_name`      | Plain  |
| `DYNAMODB_TABLE_NAME`   | `your_dynamodb_table_name` | Plain  |

**For each variable:**

- Select **Environment:** Production
- Click **Add**

### Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (usually 2-3 minutes)
3. When complete, you'll see your Vercel URL: `https://ai-meeting-assistant-xxx.vercel.app`
4. **SAVE THIS URL** - you need it for CORS setup

### Step 5: Update S3 CORS for Vercel

Now update S3 CORS to include your Vercel URL:

1. Go to [S3 Console](https://s3.console.aws.amazon.com/) → Your bucket
2. Click **Permissions** → **CORS**
3. Update configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["PUT", "POST", "GET"],
        "AllowedOrigins": [
            "https://ai-meeting-assistant-xxx.vercel.app" # or your website
        ],
        "ExposeHeaders": []
    }
]
```

4. Click **Save changes**

### Step 6: Verify Deployment

Test your live app:

```bash
# Visit in browser
https://your-vercel-url.vercel.app
```

### Step 7: Set Up Production Monitoring (Optional)

1. Vercel dashboard → **Monitoring**
2. Enable **Error Tracking**
3. Enable **Analytics**

---

## 🧪 Testing

### Production Testing (Vercel)

```bash
# Visit your Vercel URL
https://your-vercel-url.vercel.app

# Test API
curl -X POST https://your-vercel-url.vercel.app/api/agenda \
  -H "Content-Type: application/json" \
  -d '{"topics":"Production test"}'
```

---

## 📝 Environment Variables Reference

| Variable                | Required | Description        | Example                    | Where to Get                                             |
| ----------------------- | -------- | ------------------ | -------------------------- | -------------------------------------------------------- |
| `OPENAI_API_KEY`        | Yes      | OpenAI API key     | `sk-proj-...`              | [OpenAI Dashboard](https://platform.openai.com/api-keys) |
| `AWS_ACCESS_KEY_ID`     | Yes      | AWS IAM access key | `AKIA...`                  | IAM User Access Keys                                     |
| `AWS_SECRET_ACCESS_KEY` | Yes      | AWS IAM secret key | `wJa...`                   | IAM User Access Keys                                     |
| `AWS_REGION`            | Yes      | AWS region         | `us-east-1`                | Your AWS region                                          |
| `S3_BUCKET_NAME`        | Yes      | S3 bucket name     | `your_s3_bucket_name`      | S3 Console                                               |
| `DYNAMODB_TABLE_NAME`   | Yes      | DynamoDB table     | `your_dynamodb_table_name` | DynamoDB Console                                         |

---

## 🔒 Security Best Practices

### ✅ Do's

- ✅ Store secrets in environment variables only
- ✅ Use `.env.production` locally (never commit)
- ✅ Use Vercel's secure environment variable manager
- ✅ Rotate API keys every 90 days
- ✅ Use IAM roles with minimal permissions
- ✅ Enable S3 encryption (AES-256)
- ✅ Enable DynamoDB point-in-time recovery
- ✅ Use HTTPS only in CORS origins
- ✅ Monitor AWS costs with billing alerts
- ✅ Enable CloudTrail for audit logs

### ❌ Don'ts

- ❌ Commit `.env.production` to git
- ❌ Hardcode secrets in code
- ❌ Share API keys in messages
- ❌ Use root AWS account credentials
- ❌ Make S3 bucket publicly accessible
- ❌ Push Docker images with embedded secrets
- ❌ Use same credentials for dev and production
- ❌ Allow `*` in CORS origins (except for development)
- ❌ Store secrets in Docker image layers

### 🛡️ Rotating Credentials

```bash
# Create new access key
aws iam create-access-key --user-name ai-meeting-assistant

# List all access keys
aws iam list-access-keys --user-name ai-meeting-assistant

# Delete old access key
aws iam delete-access-key \
  --user-name ai-meeting-assistant \
  --access-key-id AKIAIOSFODNN7EXAMPLE
```

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
npm run format   # Run Prettier
```

## 📚 Resources

### Official Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)

### Deployment

- [Docker Documentation](https://docs.docker.com/)
- [Vercel Documentation](https://vercel.com/docs)

### Security

- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## 🙏 Acknowledgments

If you find this project helpful or use this work directly, please give proper credit and show your support by starring this repository. Your recognition helps motivate continued development and improvement of this project.

---

## 📄 License

This project is under **[MIT License](LICENSE)**.
