import { Helmet } from 'react-helmet-async';
export default function TermsPage() {
  return (
    <>
      <Helmet><title>Terms & Conditions — MobileStore</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 py-10 prose prose-sm">
        <h1>Terms & Conditions</h1>
        <p><strong>Last updated:</strong> January 2025</p>
        <h2>Acceptance of Terms</h2>
        <p>By accessing or using MobileStore, you agree to these Terms & Conditions. If you disagree, please stop using the platform.</p>
        <h2>Use of the Platform</h2>
        <ul>
          <li>You must be 18 years or older to create an account.</li>
          <li>You are responsible for maintaining the confidentiality of your account.</li>
          <li>You agree not to use the platform for any unlawful purpose.</li>
        </ul>
        <h2>Products & Pricing</h2>
        <p>All prices are in Indian Rupees (INR) and inclusive of GST. We reserve the right to change prices at any time. Product availability is subject to stock.</p>
        <h2>Order Cancellation</h2>
        <p>Orders may be cancelled before they are shipped. Once shipped, please refer to our Refund & Return Policy.</p>
        <h2>Limitation of Liability</h2>
        <p>MobileStore is not liable for indirect, incidental, or consequential damages arising from the use of the platform.</p>
        <h2>Governing Law</h2>
        <p>These terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of courts in Mumbai, Maharashtra.</p>
        <h2>Contact</h2>
        <p>Email: support@mobilestore.in</p>
      </div>
    </>
  );
}
