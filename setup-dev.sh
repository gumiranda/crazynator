#!/bin/bash

# Development Setup Script for Crazy Code Project

echo "🚀 Setting up Crazy Code Development Environment"
echo "=============================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp env-example.txt .env
    echo "✅ .env file created! Please update it with your actual values."
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
if command -v bun &> /dev/null; then
    echo "Using Bun package manager..."
    bun install
elif command -v yarn &> /dev/null; then
    echo "Using Yarn package manager..."
    yarn install
elif command -v pnpm &> /dev/null; then
    echo "Using PNPM package manager..."
    pnpm install
else
    echo "Using NPM package manager..."
    npm install
fi

echo "🔨 Setting up database..."
if [ -f .env ]; then
    # Try to generate Prisma client
    if command -v bun &> /dev/null; then
        bun prisma generate
    else
        npx prisma generate
    fi
    
    echo "📊 Database setup complete!"
    echo "   Note: Run 'npx prisma db push' when your database is ready"
else
    echo "⚠️  Skipping database setup - no .env file found"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with actual values"
echo "2. Set up your database (PostgreSQL recommended)"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit '/project-config' to test the new features"
echo ""
echo "New features added:"
echo "✨ Environment variable configuration"
echo "✨ Library installer with popular packages"
echo "✨ Photo upload and management"
echo "✨ Project setup file generation"
echo ""
echo "Happy coding! 🎨"