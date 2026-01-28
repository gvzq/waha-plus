#!/bin/bash

# Script to sync with upstream while preserving local commits
# Usage: ./scripts/sync-upstream.sh [upstream-branch] [local-branch]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
UPSTREAM_REMOTE="${UPSTREAM_REMOTE:-upstream}"
UPSTREAM_BRANCH="${1:-core}"
LOCAL_BRANCH="${2:-$(git branch --show-current)}"

echo -e "${GREEN}🔄 Syncing ${LOCAL_BRANCH} with ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}${NC}"

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$LOCAL_BRANCH" ]; then
    echo -e "${YELLOW}⚠️  Currently on ${CURRENT_BRANCH}, switching to ${LOCAL_BRANCH}${NC}"
    git checkout "$LOCAL_BRANCH"
fi

# Check if working tree is clean
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Working tree is not clean. Please commit or stash your changes first.${NC}"
    exit 1
fi

# Check if upstream remote exists
if ! git remote get-url "$UPSTREAM_REMOTE" &>/dev/null; then
    echo -e "${RED}❌ Upstream remote '${UPSTREAM_REMOTE}' not found.${NC}"
    echo "   Add it with: git remote add upstream <url>"
    exit 1
fi

# Fetch latest from upstream
echo -e "${GREEN}📥 Fetching from ${UPSTREAM_REMOTE}...${NC}"
git fetch "$UPSTREAM_REMOTE"

# Check if upstream branch exists
if ! git rev-parse --verify "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH" &>/dev/null; then
    echo -e "${RED}❌ Upstream branch '${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}' not found.${NC}"
    exit 1
fi

# Check if there are local commits to preserve
LOCAL_COMMITS=$(git log --oneline "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH"..HEAD 2>/dev/null | wc -l | tr -d ' ')
if [ "$LOCAL_COMMITS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No local commits found. Fast-forwarding instead...${NC}"
    git merge --ff-only "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH"
    echo -e "${GREEN}✅ Sync complete!${NC}"
    exit 0
fi

echo -e "${GREEN}📝 Found ${LOCAL_COMMITS} local commit(s) to preserve${NC}"

# Show what will be rebased
echo -e "${YELLOW}Local commits to be rebased:${NC}"
git log --oneline "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH"..HEAD

# Start rebase
echo -e "${GREEN}🔄 Starting rebase...${NC}"
git rebase "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH" || {
    REBASE_STATUS=$?
    
    # Check if we're in a rebase state
    if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
        echo -e "${YELLOW}⚠️  Conflicts detected. Attempting automatic resolution...${NC}"
        
        # Function to resolve common conflicts
        resolve_conflicts() {
            local resolved=false
            
            # Resolve Makefile conflicts (prefer upstream's yarn commands)
            if git diff --name-only --diff-filter=U | grep -q "^Makefile$"; then
                echo -e "${GREEN}  Resolving Makefile conflicts (keeping upstream yarn commands)...${NC}"
                # Use upstream version for Makefile
                git checkout --theirs Makefile 2>/dev/null || true
                git add Makefile
                resolved=true
            fi
            
            # Resolve package.json conflicts (prefer upstream's dependencies)
            if git diff --name-only --diff-filter=U | grep -q "^package.json$"; then
                echo -e "${GREEN}  Resolving package.json conflicts (keeping upstream dependencies)...${NC}"
                # Use upstream version (theirs) for package.json
                git checkout --theirs package.json 2>/dev/null || true
                git add package.json
                resolved=true
            fi
            
            # Resolve yarn.lock conflicts (always use upstream's)
            if git ls-files -u | grep -q "yarn.lock"; then
                echo -e "${GREEN}  Resolving yarn.lock conflict (using upstream version)...${NC}"
                # For modify/delete conflicts, restore from upstream
                if git status --porcelain | grep -q "^DU.*yarn.lock"; then
                    git checkout "$UPSTREAM_REMOTE/$UPSTREAM_BRANCH" -- yarn.lock 2>/dev/null || true
                else
                    git checkout --theirs yarn.lock 2>/dev/null || true
                fi
                git add yarn.lock
                resolved=true
            fi
            
            # Remove pnpm-lock.yaml if it exists (upstream uses yarn)
            if [ -f "pnpm-lock.yaml" ] && git status --porcelain | grep -q "pnpm-lock.yaml"; then
                echo -e "${YELLOW}  Removing pnpm-lock.yaml (upstream uses yarn)...${NC}"
                git rm -f pnpm-lock.yaml 2>/dev/null || rm -f pnpm-lock.yaml
            fi
            
            echo "$resolved"
        }
        
        # Try to resolve conflicts automatically
        if resolve_conflicts | grep -q "true"; then
            echo -e "${GREEN}✅ Automatically resolved some conflicts${NC}"
            
            # Continue rebase
            echo -e "${GREEN}🔄 Continuing rebase...${NC}"
            git -c core.editor=true rebase --continue || {
                # If there are still conflicts, show them
                echo -e "${RED}❌ Still have unresolved conflicts:${NC}"
                git diff --name-only --diff-filter=U
                echo ""
                echo -e "${YELLOW}Please resolve the remaining conflicts manually and run:${NC}"
                echo "  git rebase --continue"
                echo ""
                echo -e "${YELLOW}Or abort the rebase with:${NC}"
                echo "  git rebase --abort"
                exit 1
            }
        else
            # No automatic resolutions, show conflicts
            echo -e "${RED}❌ Could not automatically resolve conflicts:${NC}"
            git diff --name-only --diff-filter=U
            echo ""
            echo -e "${YELLOW}Please resolve conflicts manually and run:${NC}"
            echo "  git rebase --continue"
            echo ""
            echo -e "${YELLOW}Or abort the rebase with:${NC}"
            echo "  git rebase --abort"
            exit 1
        fi
    else
        echo -e "${RED}❌ Rebase failed. Please resolve manually.${NC}"
        exit $REBASE_STATUS
    fi
}

# Check if rebase completed successfully
if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
    echo -e "${YELLOW}⚠️  Rebase still in progress. Please complete manually.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Sync complete!${NC}"
echo ""
echo -e "${GREEN}Your commits are now on top of ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}${NC}"
echo ""
echo -e "${YELLOW}To update your remote branch (if needed):${NC}"
echo "  git push --force-with-lease origin $LOCAL_BRANCH"
