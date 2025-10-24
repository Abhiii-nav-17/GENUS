import React, { useState } from 'react';

const Contact: React.FC = () => {
  const [sent, setSent] = useState(false);
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-4xl font-bold mb-4">Contact</h1>
      <p className="text-sm text-muted-foreground mb-6">Questions, collaborations, or data inquiries — reach out to the GENUS team.</p>

      {!sent ? (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <label className="block mb-2 text-sm">Email</label>
          <input type="email" required className="w-full mb-4 px-3 py-2 border rounded" />
          <label className="block mb-2 text-sm">Message</label>
          <textarea required className="w-full mb-4 px-3 py-2 border rounded" rows={5} />
          <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-green-600 to-emerald-500 text-white">Send Message</button>
        </form>
      ) : (
        <div className="p-4 rounded bg-green-50 text-green-800">Thanks — your message has been received. We'll reply shortly.</div>
      )}

      <div className="mt-6 text-sm text-muted-foreground">
        <div>Email: <a href="mailto:contact@genus.org" className="text-green-700 hover:underline">contact@genus.org</a></div>
        <div>Office: GENUS Research, Remote</div>
      </div>
    </div>
  );
};

export default Contact;
