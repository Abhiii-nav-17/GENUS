import React from 'react';
import { Link } from 'react-router-dom';

const AboutUs: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">About GENUS</h1>
      <p className="text-lg mb-4 text-muted-foreground">
        GENUS is a research-driven platform that connects biodiversity data, genomics, and taxonomy through intuitive tools and curated scientific resources.
      </p>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Our Approach</h2>
        <p className="text-sm text-muted-foreground">
          We integrate verified datasets, apply reproducible methods, and present findings in formats useful to researchers, educators, and conservationists.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/mission" className="p-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold text-center">Mission</Link>
        <Link to="/team" className="p-4 rounded-lg bg-white/90 text-green-800 font-semibold text-center border">Meet the Team</Link>
        <Link to="/contact" className="p-4 rounded-lg bg-white/90 text-green-800 font-semibold text-center border">Contact</Link>
        <Link to="/about#red-list" className="p-4 rounded-lg bg-white/90 text-green-800 font-semibold text-center border">Red List Dashboard</Link>
      </div>
    </div>
  );
};

export default AboutUs;
