// app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose lg:prose-xl">
        <h2>Information We Collect</h2>
        <p><strong>Personal Information:</strong> When you register, we collect your email address and may collect additional information like your name.</p>
        
        <p><strong>Usage Data:</strong> We automatically collect information about how you use our services, including IP address, browser type, and pages visited.</p>
        
        <p><strong>AI Interaction Data:</strong> We collect data about your interactions with AI models to improve our services.</p>

        <h2>How We Use Information</h2>
        <ul>
          <li>To provide, maintain, and improve our services</li>
          <li>To send you technical notices and support messages</li>
          <li>To monitor and analyze usage patterns</li>
          <li>To improve our AI models and features</li>
        </ul>

        <h2>Data Retention</h2>
        <p>We retain your personal information for as long as necessary to provide our services and as otherwise necessary to comply with our legal obligations.</p>

        <h2>Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.</p>
      </div>
    </div>
  );
}
