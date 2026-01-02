# WAHA Plus (Open Source Implementation)

<p align="center">
  <img src="./logo.png" style='border-radius: 50%' width='150'/>
</p>

**WAHA Plus** - **W**hats**A**pp **H**TTP **A**PI (REST API) with **multimedia messaging** capabilities implemented in the Core edition!

> **🎉 This is an open-source fork** that implements Plus features (multimedia messaging) in WAHA Core.
>
> **Original Project**: [devlikeapro/waha](https://github.com/devlikeapro/waha)
>
> **This Fork**: Adds multimedia messaging support (images, audio, video, files) without requiring a Plus subscription.

[![Docker Pulls](https://img.shields.io/docker/pulls/devlikeapro/waha)](https://hub.docker.com/r/devlikeapro/waha)

## ✨ Implemented Plus Features

This fork implements the following multimedia messaging capabilities in the open-source Core edition:

- ✅ **Image Messages** - Send images via URL or base64 (`/api/sendImage`)
- ✅ **Voice Messages** - Send audio/voice messages (`/api/sendVoice`)
- ✅ **Video Messages** - Send videos with captions (`/api/sendVideo`)
- ✅ **File Documents** - Send any file type (`/api/sendFile`)
- ✅ **Media Processing** - Automatic format conversion with ffmpeg and Sharp.js
- ✅ **Media Optimization** - Image resizing, compression, and quality control
- ✅ **Batch Processing** - Concurrent media processing with configurable limits
- ✅ **Retry Logic** - Exponential backoff for failed operations

### Supported Engines

- **WEBJS** - ✅ Full multimedia support
- **NOWEB (Baileys)** - ✅ Full multimedia support
- **GOWS** - ❌ Not implemented (per design decision)

## 📚 Documentation

- Original Documentation: [https://waha.devlike.pro/](https://waha.devlike.pro/)
- Implementation Details: See [TODO-messages.md](../TODO-messages.md) for full implementation roadmap
- Architecture: See [plan.md](../plan.md) for dual-service setup with nginx

# Tables of Contents

<!-- toc -->

- [Quick start](#quick-start)
  * [Requirements](#requirements)
  * [Send your first message](#send-your-first-message)
    + [1. Download image](#1-download-image)
    + [2. Run WhatsApp HTTP API](#2-run-whatsapp-http-api)
    + [3. Start a new session](#3-start-a-new-session)
    + [4. Get and scan QR](#4-get-and-scan-qr)
    + [5. Get the screenshot](#5-get-the-screenshot)
    + [6. Send a text message](#6-send-a-text-message)
  * [What is next?](#what-is-next)
- [Development](#development)
  * [Start the project](#start-the-project)

<!-- tocstop -->

# Quick start

## Requirements

Only thing that you must have - installed docker. Please follow the original
instruction <a href="https://docs.docker.com/get-docker/" target="_blank" rel="noopener">how to install docker -></a>.

When you are ready - come back and follows the below steps to send the first text message to WhatsApp via HTTP API!

## Send your first message

Let's go over steps that allow you to send your first text message via WhatsApp HTTP API!

### 1. Build or Download Image

**Option A: Build from Source (Recommended)**

```bash
# Clone this repository
git clone https://github.com/gvzq/waha-plus.git
cd waha-plus

# Build with Docker
docker build -t waha-plus .
```

**Option B: Use Original Core Image (No Multimedia)**

```bash
docker pull devlikeapro/waha
```

> **Note**: The official `devlikeapro/waha` image does NOT include multimedia features. Use Option A to get Plus features.

### 2. Run WhatsApp HTTP API

Run WhatsApp HTTP API with your built image:

```bash
docker run -it --rm -p 3000:3000/tcp --name waha waha-plus

# It prints logs and the last line must be
# WhatsApp HTTP API is running on: http://[::1]:3000
```

Open the link in your browser [http://localhost:3000/](http://localhost:3000/) and you'll see API documentation
(Swagger) with multimedia endpoints available!


### 3. Start a new session

To start a new session you should have your mobile phone with installed WhatsApp application close to you.

Please go and read how what we'll need to a bit
later:
<a href="https://faq.whatsapp.com/381777293328336/?helpref=hc_fnav" target="_blank">
How to log in - the instruction on WhatsApp site
</a>

When your ready - find `POST /api/sessions`, click on **Try it out**, then **Execute** a bit below.


The example payload:
```json
{
  "name": "default"
}
```


By using the request with `name` values you can start multiple session (WhatsApp accounts) inside the single docker container in Plus


### 4. Get and scan QR

Find `GET /api/screenshot` and execute it, it shows you QR code.


**Scan the QR with your cell phone's WhatsApp app.**


### 5. Get the screenshot

Execute `GET /api/screenshot` after a few seconds after scanning the QR - it'll show you the screenshot of you Whatsapp
instance. If you can get the actual screenshot - then you're ready to start sending messages!


### 6. Send a text message

Let's send a text message - find `POST /api/sendText`  in [swagger](http://localhost:3000/) and change `chatId` this
way: use a phone international phone number without `+` symbol and add `@c.us` at the end.

For phone number `12132132131` the `chatId` is  `12132132131@c.us`.

The example payload:
```json
{
  "chatId": "12132132130@c.us",
  "text": "Hi there!",
  "session": "default"
}
```

Also, you can use `curl` and send POST request like this:

```bash
# Phone without +
export PHONE=12132132130
curl -d "{\"chatId\": \"${PHONE}@c.us\", \"text\": \"Hello from WhatsApp HTTP API\" }" -H "Content-Type: application/json" -X POST http://localhost:3000/api/sendText
```

### 7. Send Multimedia Messages (Plus Features)

Now try the multimedia features! Here are examples:

**Send an Image:**
```bash
curl -X POST "http://localhost:3000/api/sendImage" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -d '{
    "session": "default",
    "chatId": "12132132130@c.us",
    "file": {
      "url": "https://picsum.photos/200/300"
    },
    "caption": "Test image from WAHA Plus"
  }'
```

**Send a Voice Message:**
```bash
curl -X POST "http://localhost:3000/api/sendVoice" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -d '{
    "session": "default",
    "chatId": "12132132130@c.us",
    "file": {
      "url": "https://example.com/audio.mp3"
    }
  }'
```

**Send a Video:**
```bash
curl -X POST "http://localhost:3000/api/sendVideo" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -d '{
    "session": "default",
    "chatId": "12132132130@c.us",
    "file": {
      "url": "https://example.com/video.mp4"
    },
    "caption": "Check out this video!"
  }'
```

**Send a File/Document:**
```bash
curl -X POST "http://localhost:3000/api/sendFile" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -d '{
    "session": "default",
    "chatId": "12132132130@c.us",
    "file": {
      "url": "https://example.com/document.pdf"
    },
    "caption": "Here is the document"
  }'
```

**Send with Base64 (Local Files):**
```bash
# Encode local file to base64
BASE64_IMAGE=$(base64 -i image.jpg | tr -d '\n')

# Send it
curl -X POST "http://localhost:3000/api/sendImage" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -d "{
    \"session\": \"default\",
    \"chatId\": \"12132132130@c.us\",
    \"file\": {
      \"data\": \"$BASE64_IMAGE\",
      \"mimetype\": \"image/jpeg\",
      \"filename\": \"image.jpg\"
    }
  }"
```

## What is next?
[Go and read the full documentation!](https://waha.devlike.pro/docs/overview/introduction/)

# Production Deployment with Dashboard

## Dual-Service Architecture

For production use, you can run a **dual-service setup** that combines:
- **Your fork** (waha-plus) → Handles API with multimedia features
- **Official WAHA** → Provides the polished dashboard UI
- **Nginx** → Routes requests to the appropriate service

This gives you Plus features for the API while using the official dashboard interface!

### Architecture Overview

```
                    ┌─────────────────┐
                    │ Nginx (Port 80) │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
        /api/*         /dashboard           /
            │                │                │
            ▼                ▼                ▼
    ┌─────────────┐  ┌──────────────┐   Redirect to
    │  waha-api   │  │ waha-dashboard│   /dashboard
    │ (your fork) │  │ (official)    │
    │ Port 3000   │  │ Port 3000     │
    │ Plus API    │  │ UI Only       │
    └─────┬───────┘  └───────────────┘
          │
          │ webhook calls
          ▼
    ┌─────────────┐
    │  webhook    │
    │ Port 3002   │
    └─────────────┘
```

### Setup Instructions

#### 1. Create Project Structure

```bash
mkdir waha-production
cd waha-production

# Clone your fork into the waha subdirectory
git clone https://github.com/gvzq/waha-plus.git waha

# Create required directories
mkdir nginx
```

#### 2. Create Configuration Files

**Create `nginx/nginx.conf`:**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream waha_api {
        server waha-api:3000;
    }

    upstream waha_dashboard {
        server waha-dashboard:3000;
    }

    server {
        listen 80;
        server_name localhost;

        client_max_body_size 50M;

        # API routes → Your WAHA Plus fork
        location /api/ {
            proxy_pass http://waha_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Swagger docs → Your WAHA Plus fork
        location /swagger {
            proxy_pass http://waha_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Health check → Your WAHA Plus fork
        location /health {
            proxy_pass http://waha_api;
            proxy_set_header Host $host;
        }

        # WebSocket → Your WAHA Plus fork
        location /ws {
            proxy_pass http://waha_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # Dashboard → Official WAHA
        location /dashboard {
            proxy_pass http://waha_dashboard;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Root redirect
        location = / {
            return 302 /dashboard;
        }
    }
}
```

**Create `waha/.env.docker`:**
```env
# Security
WAHA_API_KEY=your-secret-api-key-here

# Swagger credentials
WHATSAPP_SWAGGER_USERNAME=admin
WHATSAPP_SWAGGER_PASSWORD=your-swagger-password

# Disable dashboard in API service (dashboard runs separately)
WAHA_DASHBOARD_ENABLED=false
WHATSAPP_SWAGGER_ENABLED=true

# Engine (WEBJS or NOWEB both have Plus features)
WHATSAPP_DEFAULT_ENGINE=WEBJS

# URLs
WAHA_BASE_URL=http://localhost/api

# Logging
WAHA_LOG_FORMAT=JSON
WAHA_LOG_LEVEL=info

# Storage
WAHA_MEDIA_STORAGE=LOCAL
WHATSAPP_FILES_FOLDER=/app/.media

# Webhooks (optional)
# WHATSAPP_HOOK_URL=http://webhook:3002/webhook
```

**Create `dashboard.env`:**
```env
# Security - MUST match waha-api's API key
WAHA_API_KEY=your-secret-api-key-here

# Dashboard authentication
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=your-dashboard-password

# Swagger credentials (required even though disabled)
WHATSAPP_SWAGGER_USERNAME=admin
WHATSAPP_SWAGGER_PASSWORD=your-swagger-password

# Enable only dashboard
WAHA_DASHBOARD_ENABLED=true
WHATSAPP_SWAGGER_ENABLED=false

# Minimal configuration
WHATSAPP_DEFAULT_ENGINE=WEBJS
WAHA_LOG_LEVEL=warn
```

**Create `docker-compose.yaml`:**
```yaml
version: '3.8'

networks:
  waha-network:
    driver: bridge

services:
  # Your WAHA Plus Fork - API with multimedia features
  waha-api:
    container_name: waha-api
    restart: always
    build:
      context: ./waha
      dockerfile: Dockerfile
    platform: linux/amd64
    dns:
      - 1.1.1.1
      - 8.8.8.8
    logging:
      driver: 'json-file'
      options:
        max-size: '100m'
        max-file: '10'
    volumes:
      - './sessions:/app/.sessions'
      - './media:/app/.media'
    env_file:
      - ./waha/.env.docker
    depends_on:
      - postgres
    networks:
      - waha-network

  # Official WAHA - Dashboard UI only
  waha-dashboard:
    container_name: waha-dashboard
    restart: always
    image: devlikeapro/waha
    platform: linux/amd64
    env_file:
      - ./dashboard.env
    networks:
      - waha-network
    logging:
      driver: 'json-file'
      options:
        max-size: '100m'
        max-file: '10'

  # Nginx Reverse Proxy
  nginx:
    container_name: waha-nginx
    restart: always
    image: nginx:alpine
    ports:
      - '80:80/tcp'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - waha-api
      - waha-dashboard
    networks:
      - waha-network
    logging:
      driver: 'json-file'
      options:
        max-size: '100m'
        max-file: '10'

  # PostgreSQL (optional - for session/media storage)
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    command:
      - postgres
      - "-c"
      - "max_connections=3000"
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"
    networks:
      - waha-network

volumes:
  pg_data: {}
```

#### 3. Deploy

```bash
# Build your WAHA Plus fork
docker-compose build waha-api

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f waha-api
docker-compose logs -f waha-dashboard
docker-compose logs -f nginx
```

#### 4. Access Your Services

- **Dashboard**: http://localhost/dashboard
  - Username: `admin`
  - Password: (from `dashboard.env`)

- **API**: http://localhost/api/*
  - Requires `X-Api-Key` header
  - Full Plus features available!

- **Swagger**: http://localhost/swagger
  - Username: `admin`
  - Password: (from `waha/.env.docker`)

- **Health Check**: http://localhost/health

### Example API Calls (Production)

```bash
# Set your API key
export API_KEY="your-secret-api-key-here"

# Send an image
curl -X POST "http://localhost/api/sendImage" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $API_KEY" \
  -d '{
    "session": "default",
    "chatId": "1234567890@c.us",
    "file": {
      "url": "https://picsum.photos/200/300"
    },
    "caption": "Test from WAHA Plus"
  }'
```

### Managing Services

```bash
# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose build waha-api
docker-compose up -d

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart waha-api
```

### Using PostgreSQL for Storage

To use PostgreSQL for media and sessions, update `waha/.env.docker`:

```env
# Media storage
WAHA_MEDIA_STORAGE=POSTGRESQL
WAHA_MEDIA_POSTGRESQL_URL=postgres://postgres:postgres@postgres:5432/postgres?sslmode=disable

# Session storage
WHATSAPP_SESSIONS_POSTGRESQL_URL=postgres://postgres:postgres@postgres:5432/postgres?sslmode=disable
```

### Benefits of This Setup

✅ **Plus Features** - Multimedia messaging without subscription
✅ **Official Dashboard** - Polished UI from the official image
✅ **Single Entry Point** - All traffic through port 80
✅ **Scalable** - Easy to add more services or load balancing
✅ **Isolated** - API and Dashboard run independently
✅ **Production Ready** - Logging, restart policies, resource limits

## 🏗️ Implementation Details

This fork implements multimedia messaging by:

1. **Removing Exception Overrides** - Replaced `AvailableInPlusVersion` exceptions with actual implementations
2. **Media Processing** - Added ffmpeg and Sharp.js for format conversion and optimization
3. **Engine Support** - Implemented multimedia in WEBJS and NOWEB engines
4. **Batch Processing** - Added concurrent processing with configurable limits
5. **Retry Logic** - Implemented exponential backoff for failed operations

See [TODO-messages.md](../TODO-messages.md) for the complete implementation roadmap and technical details.

# Development

## Start the project
1. Clone the repository
2. Make sure you're using node>=22 (check [.nvmrc](/.nvmrc) to get the version)
3. **This project uses pnpm** (migrated from yarn)
4. Run the following commands:
```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install

# Fetch and compile proto files
pnpm gows:proto

# Build the project
pnpm build

# Run in development mode
pnpm start

# Open http://localhost:3000
```

## Build Docker Image

```bash
# Build the Docker image
docker build -t waha-plus .

# Run the container
docker run -it --rm -p 3000:3000/tcp --name waha waha-plus
```

## Key Changes from Original WAHA Core

- **Package Manager**: Migrated from yarn to pnpm 9.15.0
- **Dockerfile**: Updated to use pnpm with `--shamefully-hoist` for Docker compatibility
- **Plus Features**: All multimedia messaging methods implemented in WEBJS and NOWEB engines
- **Media Processing**: Added ffmpeg and Sharp.js dependencies for media optimization

## Testing Multimedia Features

Example files are provided in `examples/` directory:
```bash
# Send example image
BASE64_IMAGE=$(base64 -i examples/waha.jpg | tr -d '\n')
curl -X POST "http://localhost:3000/api/sendImage" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_API_KEY" \
  -d "{\"session\":\"default\",\"chatId\":\"PHONE@c.us\",\"file\":{\"data\":\"$BASE64_IMAGE\",\"mimetype\":\"image/jpeg\"}}"
```

## Contributing

This is a fork focused on implementing multimedia messaging in WAHA Core. For issues with the base WAHA functionality, please refer to the [original repository](https://github.com/devlikeapro/waha).

For multimedia feature improvements or bug fixes, feel free to open issues or pull requests on this fork.

## License

Same as the original WAHA project. See LICENSE file for details.

## Disclaimer

This implementation may violate WhatsApp's Terms of Service. Use at your own risk. This fork is for educational and research purposes.