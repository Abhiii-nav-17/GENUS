import React from 'react';

const Mission: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Our Mission</h1>
      <p className="text-lg mb-4 text-muted-foreground">
        GENUS aims to accelerate understanding of biodiversity by combining authoritative datasets with modern computational tools, promoting open science and conservation action.
      </p>

      <ul className="list-disc pl-6 space-y-2 text-sm">
        <li>Curate and integrate trusted biodiversity datasets.</li>
        <li>Build accessible tools for taxonomy and genomics research.</li>
        <li>Support evidence-based conservation decisions.</li>
        <li>Foster collaboration across research and conservation communities.</li>
      </ul>
    </div>
  );
};

export default Mission;
