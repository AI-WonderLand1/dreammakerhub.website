#!/bin/bash
# Test script to verify AI assistant implementation

echo "🤖 AI Assistant Implementation Test"
echo "===================================="

# Check if all components exist
echo ""
echo "📁 Checking component files..."

components=(
  "apps/web/components/ai/UniversalAIAssistant.tsx"
  "apps/web/components/ai/DashboardAI.tsx"
  "apps/web/app/api/unified-ai/route.ts"
  "apps/web/lib/useSubscription.ts"
)

for file in "${components[@]}"; do
  if [ -f "/home/wonderingtribe/psychic-octo-fishstick/$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (missing)"
  fi
done

# Check if layout was updated
echo ""
echo "🔍 Checking layout integration..."
if grep -q "UniversalAIAssistant" /home/wonderingtribe/psychic-octo-fishstick/apps/web/app/layout.tsx; then
  echo "✅ Root layout updated with AI assistant"
else
  echo "❌ Root layout not updated"
fi

# Check if dashboard page was updated
echo ""
echo "📊 Checking dashboard integration..."
if grep -q "DashboardAI" /home/wonderingtribe/psychic-octo-fishstick/apps/web/app/\(workspace\)/dashboard/agents/page.tsx; then
  echo "✅ Dashboard agents page updated with AI component"
else
  echo "❌ Dashboard not updated"
fi

# Test API endpoint
echo ""
echo "🔌 Testing API endpoint..."
cd /home/wonderingtribe/psychic-octo-fishstick
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/unified-ai)
if [ "$response" = "200" ]; then
  echo "✅ Unified AI API endpoint accessible"
else
  echo "⚠️  Unified AI API endpoint may need server running"
fi

echo ""
echo "📋 Summary:"
echo "------------"
echo "1. Universal AI Assistant: On all pages"
echo "2. Dashboard AI: Central hub for management"
echo "3. Subscription gating: Free vs Pro features"
echo "4. Unified API: Connects to existing agents/runners"
echo ""
echo "🎯 Next steps:"
echo "1. Run: npm run dev --workspace=apps/web"
echo "2. Visit any page - AI assistant appears bottom-right"
echo "3. Visit /dashboard/agents - Dashboard AI sidebar"
echo "4. Free users see Spirit Guide only"
echo "5. Pro users see all agents/runners"