#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Resetting database...${NC}"

# Kill any running dev server
pkill -f "next dev" 2>/dev/null || true
echo -e "${GREEN}✓ Stopped dev server${NC}"

# Remove old database
rm -f prisma/dev.db
echo -e "${GREEN}✓ Deleted old database${NC}"

# Reinitialize database
sleep 1
npx prisma db push --skip-generate
echo -e "${GREEN}✓ Created fresh database${NC}"

# Start dev server
echo -e "${YELLOW}🚀 Starting dev server...${NC}"
npm run dev
