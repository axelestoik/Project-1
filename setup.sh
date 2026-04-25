#!/bin/bash
#
# A script to set up the local development environment.

echo "🚀 Starting setup..."

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Node.js could not be found. Please install it to continue."
    exit 1
fi

echo "✅ Node.js found."

# Install development dependencies
echo "📦 Installing development dependencies..."
npm install

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to install npm dependencies."
    exit 1
fi

echo "✅ Development dependencies installed."

# Create .env file from example if it doesn't exist
if [ -f ".env" ]; then
    echo "📝 .env file already exists. Skipping creation."
else
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please add your API_KEY."
fi

echo "🎉 Setup complete! You're ready to start development."
