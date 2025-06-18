#!/bin/bash

# Default values
CONFIG_FILE=""
PORT=8080

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -f, --config FILE    Load Strapi configuration from JSON file (.articlerc.json format)"
            echo "  -p, --port PORT      Server port (default: 8080)"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 Starting WeChat Article Editor..."
echo "📁 Current directory: $(pwd)"
echo "🌐 Server will run on port: $PORT"

if [ -n "$CONFIG_FILE" ]; then
    echo "⚙️  Loading config from: $CONFIG_FILE"
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "❌ Error: Config file '$CONFIG_FILE' not found."
        exit 1
    fi
fi

echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Please run this script from the editor directory."
    exit 1
fi

# Check for Node.js and use secure server
if command -v node &> /dev/null; then
    echo "🚀 Using secure Node.js server..."
    
    if [ -n "$CONFIG_FILE" ]; then
        echo "🔐 Loading config securely on server-side..."
        node server.cjs -p $PORT -f "$CONFIG_FILE"
    else
        echo "⚙️  Starting without config file..."
        node server.cjs -p $PORT
    fi
    
elif command -v python3 &> /dev/null; then
    echo "⚠️  WARNING: Using Python server - no Strapi proxy available"
    echo "🐍 Using Python 3..."
    
    if [ -n "$CONFIG_FILE" ]; then
        echo "❌ Config file loading not supported with Python server"
        echo "💡 Install Node.js for secure config loading: https://nodejs.org"
        echo ""
        read -p "Continue with Python server? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    python3 -m http.server $PORT
    
elif command -v python &> /dev/null; then
    echo "⚠️  WARNING: Using Python server - no Strapi proxy available"
    echo "🐍 Using Python..."
    
    if [ -n "$CONFIG_FILE" ]; then
        echo "❌ Config file loading not supported with Python server"
        echo "💡 Install Node.js for secure config loading: https://nodejs.org"
        echo ""
        read -p "Continue with Python server? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    python -m http.server $PORT
    
else
    echo "❌ Neither Node.js nor Python found."
    echo ""
    echo "Please install one of the following:"
    echo "1. Node.js (recommended): https://nodejs.org"
    echo "2. Python: https://python.org"
    echo ""
    echo "Alternative methods:"
    echo "1. npx http-server -p $PORT"
    echo "2. PHP: php -S localhost:$PORT"
    echo "3. VS Code Live Server extension"
    echo ""
    exit 1
fi