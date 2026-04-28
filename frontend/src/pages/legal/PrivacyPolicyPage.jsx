import { Helmet } from 'react-helmet-async';
export default function PrivacyPolicyPage() {
  return (
    <>
      <Helmet><title>Privacy Policy — MobileStore</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 py-10 prose prose-sm">
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> January 2025</p>
        <p>MobileStore ("we", "us", "our") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our platform.</p>
        <h2>Information We Collect</h2>
        <ul>
          <li><strong>Account data:</strong> Name, email address, phone number, and password (hashed).</li>
          <li><strong>Order data:</strong> Delivery addresses, order history, payment references.</li>
          <li><strong>Usage data:</strong> Pages viewed, search queries, device information.</li>
        </ul>
        <h2>How We Use Your Information</h2>
        <ul>
          <li>Process orders and send confirmations.</li>
          <li>Improve product recommendations and search results.</li>
          <li>Send transactional emails (order updates, password resets).</li>
          <li>Comply with legal obligations.</li>
        </ul>
        <h2>Data Sharing</h2>
        <p>We do not sell your personal data. We share it only with service providers (Razorpay, Cloudinary, SendGrid) as necessary to operate the platform.</p>
        <h2>Security</h2>
        <p>Passwords are hashed using bcrypt. Access tokens expire in 15 minutes. We use HTTPS and HTTP-only cookies for session management.</p>
        <h2>Your Rights</h2>
        <p>You may request access, correction, or deletion of your personal data by emailing support@mobilestore.in.</p>
        <h2>Contact</h2>
        <p>Email: support@mobilestore.in</p>
      </div>
    </>
  );
}
