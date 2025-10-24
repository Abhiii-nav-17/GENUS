import React from 'react';

const Team: React.FC = () => {
  const people = [
    { name: 'Ansh Bharadwaj', role: 'Project Lead' },
    { name: 'Vikash Kumar', role: 'Backend Developer' },
    { name: 'Abhinav Ranjan', role: 'Data Curator' },
    { name: 'Mohit Kumar singh', role: 'Conservation Liaison' },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Team</h1>
      <p className="text-sm text-muted-foreground mb-6">GENUS is built by a multidisciplinary team across biology, data science, and software engineering.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {people.map(p => (
          <div key={p.name} className="p-4 rounded-lg bg-white/90 shadow">
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-muted-foreground">{p.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Team;
