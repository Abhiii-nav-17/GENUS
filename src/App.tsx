import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Home from "./pages/Home";
import AnimalSearch from "./pages/AnimalSearch";
import TaxonomyChart from "./pages/TaxonomyChart";
import LearnTaxonomy from "./pages/LearnTaxonomy";
import RedList from "./pages/Red-List";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import Mission from "./pages/Mission";
import Team from "./pages/Team";
import Contact from "./pages/Contact";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<AnimalSearch />} />
            <Route path="/taxonomy" element={<TaxonomyChart />} />
            <Route path="/learn-taxonomy" element={<LearnTaxonomy />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/mission" element={<Mission />} />
            <Route path="/team" element={<Team />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/red-list" element={<RedList />} />
            {/* keep backward compatibility: redirect old /about to /red-list */}
            <Route path="/about" element={<Navigate to="/red-list" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
