#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Exported App with Local Packages ===${NC}"
echo ""

# Check if exported app path is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Please provide the exported app directory${NC}"
  echo "Usage: ./scripts/test-exported-app-local.sh <exported-app-path>"
  echo "Example: ./scripts/test-exported-app-local.sh exports/increment-form"
  exit 1
fi

EXPORTED_APP="$1"
TEMP_TEST_DIR="/tmp/ui-builder-test-$(date +%s)"

# Resolve absolute path to exported app
if [[ "$EXPORTED_APP" = /* ]]; then
  EXPORTED_APP_ABS="$EXPORTED_APP"
else
  EXPORTED_APP_ABS="$(pwd)/$EXPORTED_APP"
fi

if [ ! -d "$EXPORTED_APP_ABS" ]; then
  echo -e "${RED}Error: Exported app directory not found: $EXPORTED_APP_ABS${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 1: Building packages...${NC}"
echo -e "  ${BLUE}Running 'pnpm build' (this may take a minute)...${NC}"
pnpm build 2>&1 | tee /tmp/build-output.log | grep -E "(built|Building|✓|error|Error)" || true
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo -e "${RED}Build failed! Check /tmp/build-output.log for details${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Build complete"

echo ""
echo -e "${YELLOW}Step 2: Packing packages locally...${NC}"

# Create a temporary directory for packed packages
PACK_DIR="$(pwd)/.packed-packages"
SCRIPT_DIR="$(pwd)" # Save for later when we're in TEMP_TEST_DIR
rm -rf "$PACK_DIR"
mkdir -p "$PACK_DIR"

# Pack all internal packages that the exported app depends on
PACKAGES=(
  "packages/types"
  "packages/utils"
  "packages/ui"
  "packages/renderer"
  "packages/react-core"
  "packages/adapter-midnight"
  "packages/adapter-stellar"
  "packages/adapter-evm"
  "packages/adapter-solana"
)

for pkg in "${PACKAGES[@]}"; do
  if [ -d "$pkg" ]; then
    echo -e "  📦 Packing $pkg..."
    cd "$pkg"
    PACK_FILE=$(pnpm pack --pack-destination "$PACK_DIR" 2>&1 | grep -o '[^ ]*\.tgz' | tail -1)
    cd - > /dev/null
    echo -e "     ${GREEN}✓${NC} Created $(basename "$PACK_FILE")"
  fi
done

echo ""
echo -e "${YELLOW}Step 3: Creating test environment...${NC}"

# Copy exported app to temp directory
mkdir -p "$TEMP_TEST_DIR"
cp -r "$EXPORTED_APP_ABS"/* "$TEMP_TEST_DIR/"
echo -e "  ${GREEN}✓${NC} Copied app to $TEMP_TEST_DIR"

# Update package.json to use local packed versions
cd "$TEMP_TEST_DIR"

echo -e "\n${YELLOW}Step 4: Installing dependencies with local packages...${NC}"

# Replace workspace:* and published versions with file: paths to packed tarballs
node -e "
const fs = require('fs');
const path = require('path');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const packDir = '$PACK_DIR';

// Map of package names to their packed tarball files
const packedFiles = fs.readdirSync(packDir)
  .filter(f => f.endsWith('.tgz'))
  .reduce((acc, file) => {
    // Extract package name from tarball name
    // Format: openzeppelin-ui-builder-<package>-<version>.tgz
    const match = file.match(/openzeppelin-ui-builder-(.*?)-\\d+/);
    if (match) {
      const pkgName = '@openzeppelin/ui-builder-' + match[1].replace(/-/g, '-');
      acc[pkgName] = path.join(packDir, file);
      console.log('  Mapped:', pkgName, '->', file);
    }
    return acc;
  }, {});

console.log('\\nAvailable packed files:', Object.keys(packedFiles).join(', '));

// Update dependencies - replace ALL @openzeppelin/ui-builder packages
['dependencies', 'devDependencies'].forEach(depType => {
  if (pkg[depType]) {
    Object.keys(pkg[depType]).forEach(dep => {
      if (dep.startsWith('@openzeppelin/ui-builder-')) {
        if (packedFiles[dep]) {
          console.log('  ✓ Replacing', dep, ':', pkg[depType][dep], '->', 'file:' + packedFiles[dep]);
          pkg[depType][dep] = 'file:' + packedFiles[dep];
        } else {
          console.log('  ⚠ Warning: No packed file found for', dep);
        }
      }
    });
  }
});

// Add pnpm overrides to force local packages for ALL resolutions (including peer deps)
if (!pkg.pnpm) {
  pkg.pnpm = {};
}
if (!pkg.pnpm.overrides) {
  pkg.pnpm.overrides = {};
}

Object.keys(packedFiles).forEach(pkgName => {
  pkg.pnpm.overrides[pkgName] = 'file:' + packedFiles[pkgName];
  console.log('  ✓ Added pnpm override:', pkgName, '->', 'file:' + packedFiles[pkgName]);
});

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('\\n✓ Updated package.json with overrides');
"

echo -e "\n  ${GREEN}✓${NC} Updated package.json with local package paths"

echo -e "\n${YELLOW}Step 5: Copying Midnight SDK patches...${NC}"

# Check if the exported app uses any Midnight packages
if node -e "const pkg = require('./package.json'); const deps = {...(pkg.dependencies || {}), ...(pkg.devDependencies || {})}; const hasMidnight = Object.keys(deps).some(k => k.startsWith('@midnight-ntwrk/')); process.exit(hasMidnight ? 0 : 1);" 2>/dev/null; then
  # Copy patches from the adapter to the test directory
  ADAPTER_DIR="$SCRIPT_DIR/packages/adapter-midnight"
  if [ -d "$ADAPTER_DIR/patches" ]; then
    mkdir -p patches
    cp -r "$ADAPTER_DIR/patches"/* patches/ 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Copied $(ls -1 patches/ | wc -l | tr -d ' ') patch files"
    
    # Add patchedDependencies to package.json (only for packages that exist in dependencies)
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Get all dependencies
    const allDeps = {...(pkg.dependencies || {}), ...(pkg.devDependencies || {})};
    
    // All available patches from the adapter
    const availablePatches = {
      '@midnight-ntwrk/compact-runtime@0.9.0': 'patches/@midnight-ntwrk__compact-runtime@0.9.0.patch',
      '@midnight-ntwrk/midnight-js-indexer-public-data-provider@2.0.2': 'patches/@midnight-ntwrk__midnight-js-indexer-public-data-provider@2.0.2.patch',
      '@midnight-ntwrk/midnight-js-network-id@2.0.2': 'patches/@midnight-ntwrk__midnight-js-network-id@2.0.2.patch',
      '@midnight-ntwrk/midnight-js-types@2.0.2': 'patches/@midnight-ntwrk__midnight-js-types@2.0.2.patch',
      '@midnight-ntwrk/midnight-js-utils@2.0.2': 'patches/@midnight-ntwrk__midnight-js-utils@2.0.2.patch',
      '@midnight-ntwrk/midnight-js-contracts@2.0.2': 'patches/@midnight-ntwrk__midnight-js-contracts@2.0.2.patch',
      '@midnight-ntwrk/midnight-js-http-client-proof-provider@2.0.2': 'patches/@midnight-ntwrk__midnight-js-http-client-proof-provider@2.0.2.patch'
    };
    
    // Add pnpm.patchedDependencies and pnpm.overrides only for packages that are actually in dependencies
    if (!pkg.pnpm) {
      pkg.pnpm = {};
    }
    if (!pkg.pnpm.overrides) {
      pkg.pnpm.overrides = {};
    }
    
    pkg.pnpm.patchedDependencies = {};
    
    for (const [pkgWithVersion, patchPath] of Object.entries(availablePatches)) {
      // Extract package name without version (e.g., '@midnight-ntwrk/compact-runtime')
      const pkgName = pkgWithVersion.split('@').slice(0, -1).join('@');
      const version = pkgWithVersion.split('@').pop();
      
      // Check if this package is in dependencies
      if (allDeps[pkgName]) {
        pkg.pnpm.patchedDependencies[pkgWithVersion] = patchPath;
        // Force the exact version that has a patch
        pkg.pnpm.overrides[pkgName] = version;
      }
    }
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    const patchCount = Object.keys(pkg.pnpm.patchedDependencies).length;
    console.log('  ✓ Added ' + patchCount + ' patchedDependencies to package.json');
    console.log('  ✓ Added ' + patchCount + ' version overrides to ensure patches match');
    "
  else
    echo -e "  ${YELLOW}⚠${NC}  No patches directory found in adapter"
  fi
else
  echo -e "  ${BLUE}ℹ${NC}  Exported app does not use Midnight adapter, skipping patches"
fi

# Remove lock file to ensure fresh install
rm -f pnpm-lock.yaml
echo -e "  ${GREEN}✓${NC} Removed pnpm-lock.yaml for fresh install"

echo -e "\n${YELLOW}Step 6: Configuring Tailwind for local testing...${NC}"

# Update Tailwind import to use source() directive pointing to monorepo root
# This is needed because Tailwind needs to scan source files from unpublished packages
# We use an absolute path to the monorepo root (SCRIPT_DIR) since we're in /tmp/
if [ -f "src/styles.css" ]; then
  # Escape the path for use in sed (replace / with \/)
  MONOREPO_ROOT_ESCAPED=$(echo "$SCRIPT_DIR" | sed 's/\//\\\//g')
  
  # Remove any existing source() directive first
  sed -i.bak "s/@import 'tailwindcss' source('[^']*');/@import 'tailwindcss';/g" src/styles.css
  sed -i.bak "s/@import \"tailwindcss\" source(\"[^\"]*\");/@import \"tailwindcss\";/g" src/styles.css
  
  # Add source() directive with absolute path to monorepo root
  # Replace @import 'tailwindcss'; with @import 'tailwindcss' source('/path/to/monorepo');
  sed -i.bak "s/@import 'tailwindcss';/@import 'tailwindcss' source('${MONOREPO_ROOT_ESCAPED}');/g" src/styles.css
  sed -i.bak "s/@import \"tailwindcss\";/@import \"tailwindcss\" source(\"${MONOREPO_ROOT_ESCAPED}\");/g" src/styles.css
  
  rm -f src/styles.css.bak
  echo -e "  ${GREEN}✓${NC} Updated Tailwind import to use source() pointing to monorepo root"
  echo -e "  ${BLUE}ℹ${NC}  Tailwind will scan source files from local packages"
else
  echo -e "  ${YELLOW}⚠${NC}  src/styles.css not found"
fi

# Install dependencies
echo -e "\n  Installing dependencies..."
if pnpm install; then
  echo -e "  ${GREEN}✓${NC} Dependencies installed successfully"
else
  echo -e "  ${RED}✗${NC} Failed to install dependencies"
  echo -e "${RED}Error: pnpm install failed. Check the output above for details.${NC}"
  exit 1
fi

# Verify node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${RED}Error: node_modules directory not found after installation${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}=== Setup Complete! ===${NC}"
echo ""
echo -e "${BLUE}Test directory:${NC} $TEMP_TEST_DIR"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. cd $TEMP_TEST_DIR"
echo -e "  2. pnpm dev"
echo ""
echo -e "${YELLOW}Or run development server automatically:${NC}"
echo -e "  cd $TEMP_TEST_DIR && pnpm dev"
echo ""
echo -e "${YELLOW}To clean up after testing:${NC}"
echo -e "  rm -rf $TEMP_TEST_DIR"
echo -e "  rm -rf $PACK_DIR"
echo ""

# Ask if user wants to start dev server
read -p "$(echo -e ${YELLOW}Start development server now? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd "$TEMP_TEST_DIR"
  pnpm dev
fi

