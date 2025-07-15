# Build stage
FROM node:20-slim AS builder

WORKDIR /builder

# Set NODE_ENV to development to ensure devDependencies are installed for the build
ENV NODE_ENV=development

# Install build dependencies required for native Node.js modules
# node-gyp (used by some dependencies) requires python and build-essential
# 'python-is-python3' is used in newer Debian-based images instead of 'python'
RUN apt-get update && apt-get install -y python-is-python3 build-essential && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Copy all source code first, which is necessary for pnpm workspaces
COPY . .

# AUTHENTICATION FOR PRIVATE REGISTRY
# ===================================
# This step creates a temporary .npmrc file to authenticate with the GitHub private registry
# using a build secret. This ensures that the NPM_TOKEN is not leaked into any image layers.
#
# TRANSITION TO PUBLIC RELEASE:
# If packages are moved to the public npm registry, this authentication
# step may no longer be necessary and can be removed.
RUN --mount=type=secret,id=npm_token,env=NPM_TOKEN \
    sh -c 'echo "@openzeppelin:registry=https://npm.pkg.github.com" > .npmrc && \
           echo "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" >> .npmrc && \
           pnpm install --frozen-lockfile && \
           rm .npmrc'

# Build all packages in the correct order
# This ensures workspace dependencies are built before the main application
RUN NODE_OPTIONS='--max-old-space-size=8192' pnpm -r build

# Runtime stage - using a slim image for a smaller footprint
FROM node:20-slim AS runner

# Set NODE_ENV to production for the final runtime image
ENV NODE_ENV=production

WORKDIR /builder

# Install 'serve' to run the static application
RUN npm install -g serve

# Copy the built application from the builder stage
# This corresponds to the 'publish' directory in your previous netlify.toml
COPY --from=builder /builder/packages/builder/dist ./dist

# Expose the port the app will run on
EXPOSE 3000

# Start the server to serve the static files from the 'dist' folder
CMD ["serve", "-s", "dist", "-l", "3000"] 
