#!/bin/bash
# Integration Script: Copy All Backend Files to Your Deploy Site

# This script copies all backend files to your deploy-site repo with correct paths

REPO_PATH="/Users/lexilucks/Documents/New project/deploy-site"
SOURCE_PATH="/home/claude"

echo "🚀 Lexi Text/Call Funnel - Backend Integration"
echo "=============================================="
echo ""
echo "Source: $SOURCE_PATH"
echo "Destination: $REPO_PATH"
echo ""

# Create directory structure
echo "📁 Creating directories..."
mkdir -p "$REPO_PATH/api/stripe"
mkdir -p "$REPO_PATH/api/twilio"
mkdir -p "$REPO_PATH/src/lib"
mkdir -p "$REPO_PATH/supabase/migrations"
mkdir -p "$REPO_PATH/test"
mkdir -p "$REPO_PATH/docs"
mkdir -p "$REPO_PATH/admin"

# Copy API files
echo "📝 Copying API handlers..."
cp "$SOURCE_PATH/api_stripe_webhook.js" "$REPO_PATH/api/stripe/webhook.js"
cp "$SOURCE_PATH/api_twilio_inbound_sms.js" "$REPO_PATH/api/twilio/inbound-sms.js"
cp "$SOURCE_PATH/api_twilio_send_sms.js" "$REPO_PATH/api/twilio/send-sms.js"

# Copy library files
echo "📚 Copying libraries..."
cp "$SOURCE_PATH/src_lib_sms_state_machine.js" "$REPO_PATH/src/lib/sms-state-machine.js"
cp "$SOURCE_PATH/src_lib_sms_copy.js" "$REPO_PATH/src/lib/sms-copy.js"

# Copy SQL migrations
echo "🗄️  Copying database migrations..."
cp "$SOURCE_PATH/supabase_001_fan_requests.sql" "$REPO_PATH/supabase/migrations/001_create_fan_requests.sql"
cp "$SOURCE_PATH/supabase_002_fan_contacts.sql" "$REPO_PATH/supabase/migrations/002_create_fan_contacts.sql"
cp "$SOURCE_PATH/supabase_003_consent_events.sql" "$REPO_PATH/supabase/migrations/003_create_consent_events.sql"
cp "$SOURCE_PATH/supabase_004_payment_events.sql" "$REPO_PATH/supabase/migrations/004_create_payment_events.sql"

# Copy tests
echo "✅ Copying test files..."
cp "$SOURCE_PATH/test_stripe_webhook.test.js" "$REPO_PATH/test/stripe-webhook.test.js"
cp "$SOURCE_PATH/test_sms_inbound.test.js" "$REPO_PATH/test/sms-inbound.test.js"

# Copy documentation
echo "📖 Copying documentation..."
cp "$SOURCE_PATH/docs_SMS_FLOW.md" "$REPO_PATH/docs/SMS_FLOW.md"
cp "$SOURCE_PATH/docs_STRIPE_SETUP.md" "$REPO_PATH/docs/STRIPE_SETUP.md"
cp "$SOURCE_PATH/docs_ADMIN_SETUP.md" "$REPO_PATH/docs/ADMIN_SETUP.md"
cp "$SOURCE_PATH/docs_DEPLOYMENT_CHECKLIST.md" "$REPO_PATH/docs/DEPLOYMENT_CHECKLIST.md"
cp "$SOURCE_PATH/IMPLEMENTATION_GUIDE.md" "$REPO_PATH/IMPLEMENTATION_GUIDE.md"

# Copy configuration
echo "⚙️  Copying configuration..."
cp "$SOURCE_PATH/env_local_example.txt" "$REPO_PATH/.env.local.example"
cp "$SOURCE_PATH/package.json" "$REPO_PATH/package.json"

# Copy admin dashboard
echo "🎛️  Copying admin dashboard..."
cp "$SOURCE_PATH/admin_dashboard.html" "$REPO_PATH/admin/dashboard.html"

# Update .gitignore
echo ""
echo "🔐 Updating .gitignore..."
if ! grep -q ".env.local" "$REPO_PATH/.gitignore"; then
  echo ".env.local" >> "$REPO_PATH/.gitignore"
  echo "   Added .env.local to .gitignore"
fi

# Done
echo ""
echo "✨ Integration complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd $REPO_PATH"
echo "2. npm install"
echo "3. cp .env.local.example .env.local"
echo "4. Fill in .env.local with your API keys"
echo "5. npm test"
echo "6. npm run build"
echo ""
echo "📖 Read IMPLEMENTATION_GUIDE.md for detailed instructions"
echo ""
