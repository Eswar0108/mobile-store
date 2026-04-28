import { Helmet } from 'react-helmet-async';
export default function RefundPolicyPage() {
  return (
    <>
      <Helmet><title>Refund & Return Policy — MobileStore</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 py-10 prose prose-sm">
        <h1>Refund & Return Policy</h1>
        <p><strong>Last updated:</strong> January 2025</p>
        <h2>Return Window</h2>
        <p>You may request a return within <strong>7 days</strong> of delivery. Products must be in original condition with all accessories and packaging.</p>
        <h2>Eligible Reasons</h2>
        <ul>
          <li>Defective or damaged product</li>
          <li>Wrong item delivered</li>
          <li>Product not as described</li>
        </ul>
        <h2>How to Request a Return</h2>
        <ol>
          <li>Go to My Orders and select the order.</li>
          <li>Click "Request Return" on the delivered item.</li>
          <li>Fill in the reason and upload photos (required for defective products).</li>
          <li>Our team will review within 2–3 business days.</li>
        </ol>
        <h2>Refund Process</h2>
        <ul>
          <li><strong>Online payments (Razorpay):</strong> Refunded to the original payment method within 5–7 business days after return approval.</li>
          <li><strong>Cash on Delivery:</strong> Refunded via bank transfer. Please provide your account details in the return request.</li>
        </ul>
        <h2>Non-Returnable Items</h2>
        <p>Items damaged due to customer misuse, missing serial numbers, or returned after the 7-day window are not eligible.</p>
        <h2>Contact</h2>
        <p>Email: support@mobilestore.in</p>
      </div>
    </>
  );
}
