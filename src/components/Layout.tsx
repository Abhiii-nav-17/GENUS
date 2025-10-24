import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Search,
  Home,
  BarChart3,
  TriangleAlert,
  PawPrint,
  BookOpen,
  Github,
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
  Mail,
  ArrowUp
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // detect About page to apply page-scoped red theme for header only
  const isRedList = location.pathname === '/red-list';

  const headerStyle: React.CSSProperties | undefined = isRedList
    ? { background: 'linear-gradient(90deg,#b71c1c,#8f1212)' }
    : undefined;

  const navBtnClass = (path: string) => {
    // when on Red-List, non-active links should be white with a subtle white hover; else keep existing theme classes
    if (isActive(path)) return '';
    return isRedList ? 'text-white hover:bg-white/10' : 'text-primary-foreground hover:bg-primary-foreground/10';
  };

  // New: green theme for active nav buttons and hover behavior (page-matching)
  const GREEN_GRADIENT = 'linear-gradient(90deg,#16a34a,#059669)';
  const GREEN_HOVER = '#047857';
  const navButtonStyle = (path: string): React.CSSProperties | undefined => {
    if (isActive(path) && !isRedList) {
      return {
        background: GREEN_GRADIENT,
        color: '#fff',
        boxShadow: '0 8px 20px rgba(16,185,129,0.12)',
      };
    }
    return undefined;
  };
  
  // small helper to wire hover effects on Buttons (applied inline per element)
  const applyHoverHandlers = (elStyleRef: React.RefObject<HTMLElement> | null) => {
    // no-op placeholder; hover handlers are attached inline on JSX elements below
    return;
  };

  // Footer state & helpers
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const newsletterRef = useRef<HTMLInputElement | null>(null);
  const submitNewsletter = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newsletterEmail || newsletterStatus === 'sending') return;
    setNewsletterStatus('sending');
    // Simulate API call; replace with real integration later
    try {
      await new Promise((r) => setTimeout(r, 700));
      setNewsletterStatus('sent');
      setTimeout(() => setNewsletterStatus('idle'), 2000);
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('error');
    }
  };

  const backToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-gradient-earth">
      <header
        className={`shadow-nature border-b border-border/50 ${isRedList ? '' : 'bg-gradient-forest'}`}
        style={headerStyle}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className={`flex items-center space-x-3 ${isRedList ? 'text-white' : ''}`}>
              <PawPrint className={`h-8 w-8 ${isRedList ? 'text-white' : 'text-primary-foreground'} animate-float`} />
              <span className={`text-2xl font-bold tracking-tight ${isRedList ? 'text-white' : 'text-primary-foreground'}`}>
                G E N U S
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-2">
              {/* Home */}
              <Button
                variant={isActive('/') ? 'accent' : 'ghost'}
                asChild
                className={navBtnClass('/')}
                style={navButtonStyle('/')}
                onMouseEnter={(e) => {
                  if (!isRedList && isActive('/')) {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 34px rgba(6,95,70,0.18)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.background = `linear-gradient(90deg, ${GREEN_HOVER}, ${GREEN_GRADIENT})`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRedList && isActive('/')) {
                    (e.currentTarget as HTMLElement).style.boxShadow = navButtonStyle('/')?.boxShadow || '';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                    (e.currentTarget as HTMLElement).style.background = navButtonStyle('/')?.background as string || '';
                  }
                }}
              >
                <Link to="/" className="flex items-center space-x-2">
                  <Home className={`h-4 w-4 ${isRedList ? 'text-white' : ''}`} />
                  <span>Home</span>
                </Link>
              </Button>

              {/* Search */}
              <Button
                variant={isActive('/search') ? 'accent' : 'ghost'}
                asChild
                className={navBtnClass('/search')}
                style={navButtonStyle('/search')}
                onMouseEnter={(e) => {
                  if (!isRedList && isActive('/search')) {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 34px rgba(6,95,70,0.18)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.background = `linear-gradient(90deg, ${GREEN_HOVER}, ${GREEN_GRADIENT})`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRedList && isActive('/search')) {
                    (e.currentTarget as HTMLElement).style.boxShadow = navButtonStyle('/search')?.boxShadow || '';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                    (e.currentTarget as HTMLElement).style.background = navButtonStyle('/search')?.background as string || '';
                  }
                }}
              >
                <Link to="/search" className="flex items-center space-x-2">
                  <Search className={`h-4 w-4 ${isRedList ? 'text-white' : ''}`} />
                  <span>Search</span>
                </Link>
              </Button>

              {/* Taxonomy */}
              <Button
                variant={isActive('/taxonomy') ? 'accent' : 'ghost'}
                asChild
                className={navBtnClass('/taxonomy')}
                style={navButtonStyle('/taxonomy')}
                onMouseEnter={(e) => {
                  if (!isRedList && isActive('/taxonomy')) {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 34px rgba(6,95,70,0.18)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.background = `linear-gradient(90deg, ${GREEN_HOVER}, ${GREEN_GRADIENT})`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRedList && isActive('/taxonomy')) {
                    (e.currentTarget as HTMLElement).style.boxShadow = navButtonStyle('/taxonomy')?.boxShadow || '';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                    (e.currentTarget as HTMLElement).style.background = navButtonStyle('/taxonomy')?.background as string || '';
                  }
                }}
              >
                <Link to="/taxonomy" className="flex items-center space-x-2">
                  <BarChart3 className={`h-4 w-4 ${isRedList ? 'text-white' : ''}`} />
                  <span>Taxonomy</span>
                </Link>
              </Button>

              {/* Learn */}
              <Button
                variant={isActive('/learn-taxonomy') ? 'accent' : 'ghost'}
                asChild
                className={navBtnClass('/learn-taxonomy')}
                style={navButtonStyle('/learn-taxonomy')}
                onMouseEnter={(e) => {
                  if (!isRedList && isActive('/learn-taxonomy')) {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 34px rgba(6,95,70,0.18)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.background = `linear-gradient(90deg, ${GREEN_HOVER}, ${GREEN_GRADIENT})`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRedList && isActive('/learn-taxonomy')) {
                    (e.currentTarget as HTMLElement).style.boxShadow = navButtonStyle('/learn-taxonomy')?.boxShadow || '';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                    (e.currentTarget as HTMLElement).style.background = navButtonStyle('/learn-taxonomy')?.background as string || '';
                  }
                }}
              >
                <Link to="/learn-taxonomy" className="flex items-center space-x-2">
                  <BookOpen className={`h-4 w-4 ${isRedList ? 'text-white' : ''}`} />
                  <span>Learn</span>
                </Link>
              </Button>
              
              <Button
                variant={isActive('/red-list') ? 'accent' : 'ghost'}
                asChild
                className={navBtnClass('/red-list')}
                style={navButtonStyle('/red-list')}
              >
                <Link to="/red-list" className="flex items-center space-x-2">
                  <TriangleAlert className={`h-4 w-4 ${isRedList ? 'text-white' : ''}`} />
                  <span>Red List</span>
                </Link>
              </Button>
            </nav>

            <div className="md:hidden">
              <Button variant="ghost" size="icon" className={isRedList ? 'text-white' : 'text-primary-foreground'}>
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      {/* Professional multi-column footer */}
      <footer className="mt-auto" aria-label="Site footer">
        <div className="container mx-auto px-4 py-12" style={{ background: 'linear-gradient(180deg,#f3fff7, #ecfbef)' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About GENUS */}
            <div>
              <h4 className="text-lg font-bold mb-3" style={{ color: '#064c2a' }}>About GENUS</h4>
              <p className="text-sm text-muted-foreground mb-3" style={{ color: '#0b4528' }}>
                GENUS explores biodiversity with AI-powered taxonomy and research-grade data. We connect species information, genomics and conservation resources for researchers and the public.
              </p>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about-us" className="hover:underline text-[#0f9d58]">About</Link></li>
                <li><Link to="/mission" className="hover:underline text-[#0f9d58]">Mission</Link></li>
                <li><Link to="/team" className="hover:underline text-[#0f9d58]">Team</Link></li>
                <li><Link to="/contact" className="hover:underline text-[#0f9d58]">Contact</Link></li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold mb-3" style={{ color: '#064c2a' }}>Quick Links</h4>
              <ul className="grid grid-cols-1 gap-2 text-sm">
                <li><Link to="/" className="hover:underline text-[#0f9d58]">Home</Link></li>
                <li><Link to="/taxonomy" className="hover:underline text-[#0f9d58]">Explore Taxonomy</Link></li>
                <li><Link to="/red-list" className="hover:underline text-[#0f9d58]">Red List Species</Link></li>
                <li><Link to="/search" className="hover:underline text-[#0f9d58]">Species Data Explorer</Link></li>
                <li><Link to="/learn-taxonomy" className="hover:underline text-[#0f9d58]">Learn Taxonomy</Link></li>
              </ul>
            </div>

            {/* Data & Research Partners */}
            <div>
              <h4 className="text-lg font-bold mb-3" style={{ color: '#064c2a' }}>Data & Research Partners</h4>
              <p className="text-sm text-muted-foreground mb-3" style={{ color: '#0b4528' }}>
                GENUS sources data from verified scientific repositories.
              </p>
              <div className="flex gap-3 flex-wrap items-center">
                <a href="https://www.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer" title="NCBI">
                  <img src="https://wildbrine.com/wp-content/uploads/2017/08/ncbi.png" alt="NCBI" style={{ width: 88, height: 'auto', filter: 'grayscale(0)', borderRadius: 6 }} />
                </a>
                <a href="https://www.itis.gov/" target="_blank" rel="noopener noreferrer" title="ITIS">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5b/ITIS_logo.svg" alt="ITIS" style={{ width: 88, height: 'auto', objectFit: 'contain' }} />
                </a>
                <a href="https://www.iucnredlist.org/" target="_blank" rel="noopener noreferrer" title="IUCN">
                  <img src="https://aws.cause.clickandpledge.com/accounts/28975/connect/images/638647635878904431_logo-iucn-red-list-1_1.png" alt="IUCN" style={{ width: 88, height: 'auto' }} />
                </a>
                <a href="https://www.gbif.org/" target="_blank" rel="noopener noreferrer" title="GBIF">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/1/1e/GBIF-2015-full-stacked.png" alt="GBIF" style={{ width: 88, height: 'auto' }} />
                </a>
                <a href="https://eol.org/" target="_blank" rel="noopener noreferrer" title="Encyclopedia of Life">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0CPt4MulDfgNl2MKWjNMlHkwamxBpD-Q8cg&s" alt="EOL" style={{ width: 88, height: 'auto' }} />
                </a>
              </div>
            </div>

            {/* Connect with GENUS */}
            <div>
              <h4 className="text-lg font-bold mb-3" style={{ color: '#064c2a' }}>Connect with GENUS</h4>
              <p className="text-sm text-muted-foreground mb-3" style={{ color: '#0b4528' }}>
                Contact: <a href="mailto:contact@genus.org" className="text-[#0f9d58] hover:underline">contact@genus.org</a>
              </p>
              <div className="flex items-center gap-3 mb-4">
                <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:translate-y-[-4px] transition-transform" aria-label="LinkedIn">
                  <Linkedin size={20} />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:translate-y-[-4px] transition-transform" aria-label="GitHub">
                  <Github size={20} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:translate-y-[-4px] transition-transform" aria-label="Twitter/X">
                  <Twitter size={20} />
                </a>
                <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:translate-y-[-4px] transition-transform" aria-label="YouTube">
                  <Youtube size={20} />
                </a>
                <a href="https://www.researchgate.net" target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:translate-y-[-4px] transition-transform" aria-label="ResearchGate">
                  <img src="https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/logos/researchgate-qluh45s2vvsohi1d061qt.png/researchgate-rma9jjrhn7bt7wjizf5h5.png?_a=DATAg1AAZAA0" alt="ResearchGate" style={{ width: 20, height: 20 }} />
                </a>
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded hover:translate-y-[-4px] transition-transform" aria-label="Instagram">
                  <Instagram size={20} />
                </a>
              </div>

              {/* Newsletter */}
              <form onSubmit={submitNewsletter} className="flex gap-2 items-center">
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    ref={newsletterRef}
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Subscribe: email@example.com"
                    aria-label="Newsletter email"
                    className="px-3 py-2 rounded border"
                    style={{ minWidth: 220 }}
                  />
                  <Button type="submit" style={{ background: GREEN_GRADIENT, color: '#fff' }} disabled={newsletterStatus === 'sending'}>
                    <Mail size={16} />&nbsp;{newsletterStatus === 'sending' ? 'Sending...' : 'Subscribe'}
                  </Button>
                </div>
              </form>
              {newsletterStatus === 'sent' && <div className="text-sm mt-2 text-green-700">Thanks — check your inbox.</div>}
              {newsletterStatus === 'error' && <div className="text-sm mt-2 text-red-600">Subscription failed — try later.</div>}
            </div>
          </div>

          {/* micro-footer row */}
          <div className="mt-8 border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground" style={{ color: '#0b4528' }}>
              © 2025 GENUS Project — All Rights Reserved · Built with data, science, and passion for biodiversity.
            </div>

            <div className="flex items-center gap-4">
              {/* language switcher */}
              <select aria-label="Language" className="border rounded px-2 py-1 text-sm" defaultValue="en">
                <option value="en">EN</option>
                <option value="es">ES</option>
                <option value="fr">FR</option>
              </select>
              {/* accessibility badge */}
              <a href="/accessibility" className="text-sm hover:underline" aria-label="Accessibility statement" style={{ color: 'rgba(255,255,255,0.9)' }}>Accessibility</a>
              {/* Back to top */}
              <button onClick={backToTop} aria-label="Back to top" style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.06)', padding: 8, borderRadius: 8 }}>
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};