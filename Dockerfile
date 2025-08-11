# Build stage
FROM node:22-slim AS builder

WORKDIR /builder

# Set NODE_ENV to development to ensure devDependencies are installed for the build
ENV NODE_ENV=development

# Accept build argument for export environment
# - 'local': workspace:* dependencies for CLI/development
# - 'staging': RC versions for QA testing  
# - 'production': stable published versions for users
ARG VITE_EXPORT_ENV=production
ENV VITE_EXPORT_ENV=$VITE_EXPORT_ENV

# Accept build argument for analytics feature flag
# - 'true': Enable Google Analytics tracking
# - 'false' or unset: Disable analytics (default for security/privacy)
ARG VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED=false
ENV VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED=$VITE_APP_CFG_FEATURE_FLAG_ANALYTICS_ENABLED

# Accept build argument for Google Analytics tag ID
ARG VITE_GA_TAG_ID
ENV VITE_GA_TAG_ID=$VITE_GA_TAG_ID



# Install build dependencies required for native Node.js modules
# node-gyp (used by some dependencies) requires python and build-essential
# 'python-is-python3' is used in newer Debian-based images instead of 'python'
RUN apt-get update && apt-get install -y python-is-python3 build-essential && rm -rf /var/lib/apt/lists/*

# Clear any potential corrupted Node.js cache that might cause gyp issues
RUN rm -rf /root/.cache/node-gyp /root/.npm /root/.node-gyp || true

# Install pnpm
RUN npm install -g pnpm

# Copy all source code first, which is necessary for pnpm workspaces
COPY . .

# Install dependencies directly from the public npm registry
# Retry once on failure after clearing possible corrupted caches to avoid node-gyp issues
RUN pnpm install --frozen-lockfile || (echo "Install failed, clearing caches and retrying..." && rm -rf /root/.cache/node-gyp /root/.npm /root/.node-gyp && pnpm install --frozen-lockfile)

# Build all packages in the correct order
# This step now uses Docker BuildKit secrets to securely pass the Etherscan API key
# The secret is only available during this RUN command and won't be stored in the image
RUN --mount=type=secret,id=etherscan_api_key \
    sh -c 'if [ -f /run/secrets/etherscan_api_key ]; then \
        export VITE_APP_CFG_SERVICE_ETHERSCANV2_API_KEY=$(cat /run/secrets/etherscan_api_key) && \
        NODE_OPTIONS="--max-old-space-size=8192" pnpm -r build; \
    else \
        echo "Warning: Building without Etherscan API key" && \
        NODE_OPTIONS="--max-old-space-size=8192" pnpm -r build; \
    fi'

# Runtime stage - using a slim image for a smaller footprint
FROM node:22-slim AS runner

# Set NODE_ENV to production for the final runtime image
ENV NODE_ENV=production

WORKDIR /builder

# Install 'serve' to run the static application
RUN npm install -g serve

# Copy the built application from the builder stage
COPY --from=builder /builder/packages/builder/dist ./dist

# Expose the port the app will run on
EXPOSE 3000

# Start the server to serve the static files from the 'dist' folder
CMD ["serve", "-s", "dist", "-l", "3000"] 
