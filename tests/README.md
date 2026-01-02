# WAHA Testing Guide

## Available Tests

### 1. Unit Tests (Jest)
```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:cov

# Run in watch mode
pnpm test:watch

# Debug tests
pnpm test:debug
```

### 2. Integration Tests

#### Multimedia Features Test
Test the newly implemented multimedia messaging features that were previously only available in WAHA Plus.

```bash
# Start WAHA server first (in another terminal)
npm run start:dev

# Run multimedia integration tests
node tests/integration/multimedia.test.js
```

**What this tests:**
- ✅ `sendImage` - Send images via URL and base64
- ✅ `sendFile` - Send documents and files
- ✅ `sendVoice` - Send audio/voice messages
- ✅ `sendVideo` - Send video files
- ✅ Server health and session creation

**Test Files Required:**
- `examples/waha.jpg` - Test image
- `examples/voice.opus` - Test audio
- `examples/video.mp4` - Test video
- `examples/example.pdf` - Test document

### 3. Performance Tests

#### Session Creation Performance
```bash
# Create multiple sessions for performance testing
node tests/perf/start.js --api-key YOUR_API_KEY --sessions 10
```

#### Message Sending Performance
```bash
# Send multiple text messages for performance testing
node tests/perf/send.js --api-key YOUR_API_KEY --session default --chat-id 1234567890 --number 100
```

### 4. Smoke Tests

#### Basic Health Check
Uses [Goss](https://goss.rocks/) for infrastructure testing:

```bash
# Install goss
curl -fsSL https://goss.rocks/install | sh

# Run smoke tests
goss --gossfile tests/smoke/goss.yaml validate
```

## Environment Setup

1. **API Key**: Set `X-Api-Key: test` header for local testing
2. **Test Phone Number**: Set `TEST_PHONE_NUMBER` environment variable
3. **Test Files**: Ensure example files exist in `examples/` directory

## Test Results

After running the multimedia integration tests, you should see:
- ✅ All multimedia endpoints working (previously threw "AvailableInPlusVersion" errors)
- ✅ Images, audio, video, and files can be sent
- ✅ Server responds without Plus-only restrictions

## Troubleshooting

- **Server not running**: Start with `npm run start:dev`
- **Missing test files**: Copy example files to `examples/` directory
- **Permission errors**: Check file permissions for test media files
- **API key errors**: Use `X-Api-Key: test` for local development

## Success Criteria

✅ **Unit tests pass**: All existing functionality still works
✅ **Multimedia tests pass**: New features work correctly
✅ **No Plus restrictions**: Core version can send multimedia
✅ **Performance acceptable**: Response times within reasonable limits
