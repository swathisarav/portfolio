import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  summary: string;
  tags: string[];
  image: string;
  detailedExplanation: string;
  additionalImages?: string[];
  links?: { label: string; url: string }[];
}

const projects: Project[] = [
  {
    id: 1,
    title: 'Enterprise Design System',
    summary: 'Building a scalable component library for a B2B SaaS platform serving 50K+ users',
    tags: ['Product', 'Design', 'Systems'],
    image: 'https://images.unsplash.com/photo-1769149068959-b11392164add?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ24lMjBzeXN0ZW0lMjBjb21wb25lbnRzfGVufDF8fHx8MTc2OTQ3ODg2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    detailedExplanation: 'Led the development of a comprehensive design system that reduced engineering time by 40% and improved cross-platform consistency. Created design tokens, component patterns, and documentation that scaled across web, mobile, and internal tools. Collaborated with 15+ engineers to establish governance processes and contribution workflows.',
    links: [
      { label: 'Case Study', url: '#' },
      { label: 'Documentation', url: '#' }
    ]
  },
  {
    id: 2,
    title: 'AI-Powered Analytics Platform',
    summary: 'Product strategy and UX for real-time data visualization serving enterprise clients',
    tags: ['Product', 'Strategy', 'Tech'],
    image: 'https://images.unsplash.com/photo-1686061594225-3e92c0cd51b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwc3RyYXRlZ3klMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzY5NTM3MTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    detailedExplanation: 'Defined product roadmap and designed interfaces for a platform processing 10M+ data points daily. Conducted stakeholder interviews across 8 enterprise clients to identify core workflows. Shipped v1 in 6 months with 95% feature adoption rate. Led integration of machine learning recommendations that increased user engagement by 60%.',
    links: [
      { label: 'Product Overview', url: '#' }
    ]
  },
  {
    id: 3,
    title: 'Mobile Health Companion',
    summary: 'End-to-end design for a consumer health tracking app with 500K+ downloads',
    tags: ['Product', 'Design', 'Research'],
    image: 'https://images.unsplash.com/photo-1748801583975-720cb5e4985e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBhcHAlMjBwcm90b3R5cGV8ZW58MXx8fHwxNzY5NTIzMDg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    detailedExplanation: 'Owned the complete product experience from concept to launch. Conducted 40+ user interviews and usability tests to validate core hypotheses. Designed an adaptive interface that personalizes to user behavior patterns. Collaborated with clinical advisors to ensure medical accuracy. Achieved 4.8 App Store rating and sustained 30% monthly active user retention.',
    links: [
      { label: 'App Store', url: '#' },
      { label: 'Research Insights', url: '#' }
    ]
  },
  {
    id: 4,
    title: 'Platform Infrastructure Redesign',
    summary: 'Systems thinking approach to rebuilding developer tools and internal workflows',
    tags: ['Systems', 'Strategy', 'Tech'],
    image: 'https://images.unsplash.com/photo-1721244653657-ad6b91780492?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGF0Zm9ybSUyMGFyY2hpdGVjdHVyZSUyMGRpYWdyYW18ZW58MXx8fHwxNzY5NTM3MTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    detailedExplanation: 'Architected a developer experience overhaul affecting 200+ internal users. Mapped complex system dependencies and identified bottlenecks causing 15+ hours of weekly friction. Designed modular tooling that reduced onboarding time from 2 weeks to 3 days. Created visual documentation standards that became company-wide practice.',
    links: [
      { label: 'Technical Overview', url: '#' }
    ]
  },
  {
    id: 5,
    title: 'Voice-First Research Study',
    summary: 'Exploratory research into conversational interfaces and multi-modal interaction',
    tags: ['Research', 'Design', 'Tech'],
    image: 'https://images.unsplash.com/photo-1723987251277-18fc0a1effd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcmVzZWFyY2glMjBhbmFseXNpc3xlbnwxfHx8fDE3Njk1MzcxNDV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    detailedExplanation: 'Led foundational research into emerging interaction models for voice + visual interfaces. Designed and conducted mixed-method studies with 60+ participants. Synthesized findings into actionable design principles and prototypes. Presented insights to executive team, influencing strategic product decisions for next 18 months.',
    links: [
      { label: 'Research Report', url: '#' },
      { label: 'Prototype Demo', url: '#' }
    ]
  },
  {
    id: 6,
    title: 'Zero-to-One Marketplace MVP',
    summary: 'Product design and go-to-market strategy for a two-sided marketplace startup',
    tags: ['Product', 'Strategy', 'Design'],
    image: 'https://images.unsplash.com/photo-1750056393326-8feed2a1c34f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwZGVzaWduJTIwaW50ZXJmYWNlJTIwbW9ja3VwfGVufDF8fHx8MTc2OTUzNzE0M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    detailedExplanation: 'Shaped product strategy for early-stage startup, defining MVP scope and phasing plan. Designed core transaction flows balancing supply and demand dynamics. Established key metrics and instrumentation strategy. Led user testing with both buyer and seller segments. Launched with 200 active users in first month, achieving 40% week-over-week growth.',
    links: [
      { label: 'Product Demo', url: '#' }
    ]
  }
];

export default function App() {
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'about', 'projects', 'side-quests', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Sticky Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => scrollToSection('hero')}
              className="tracking-tight hover:text-gray-600 transition-colors"
            >
              Portfolio
            </button>
            <div className="flex items-center gap-8">
              {['about', 'projects', 'side-quests', 'contact'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`capitalize tracking-tight transition-colors ${
                    activeSection === section ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {section === 'side-quests' ? 'Side Quests' : section}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-7xl tracking-tight mb-6">
              Alex Chen
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed">
              Product designer and strategist building systems that scale. I work at the intersection of design, technology, and systems thinking.
            </p>
            
            {/* Geometric accent element */}
            <div className="mt-16 flex gap-2">
              <motion.div 
                className="h-1 bg-gray-900"
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
              <motion.div 
                className="h-1 bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
              <motion.div 
                className="h-1 bg-gray-300"
                initial={{ width: 0 }}
                animate={{ width: 20 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-8">About</h2>
          <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 max-w-3xl">
            I believe the best products emerge from deep systems thinking—understanding not just what users need today, but how those needs evolve as technology and context shift. My approach combines rigorous research, strategic product thinking, and hands-on design craft.
          </p>
          <a 
            href="https://drive.google.com/file/d/example" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <span>View Resume</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-32 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-12">Selected Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                layoutId={`project-${project.id}`}
                onClick={() => setExpandedProject(project.id)}
                className="bg-white rounded-lg overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                  <motion.img
                    layoutId={`project-image-${project.id}`}
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <motion.h3 layoutId={`project-title-${project.id}`} className="mb-2">
                    {project.title}
                  </motion.h3>
                  <motion.p layoutId={`project-summary-${project.id}`} className="text-gray-600 mb-4 leading-relaxed">
                    {project.summary}
                  </motion.p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expanded Project Modal */}
      <AnimatePresence>
        {expandedProject && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedProject(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Expanded Card */}
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="min-h-screen px-4 py-20 flex items-center justify-center">
                <motion.div
                  layoutId={`project-${expandedProject}`}
                  className="bg-white rounded-lg overflow-hidden max-w-4xl w-full relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setExpandedProject(null)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  {projects
                    .filter((p) => p.id === expandedProject)
                    .map((project) => (
                      <div key={project.id}>
                        <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                          <motion.img
                            layoutId={`project-image-${project.id}`}
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-8 md:p-12">
                          <motion.h3 layoutId={`project-title-${project.id}`} className="mb-4">
                            {project.title}
                          </motion.h3>
                          <motion.p layoutId={`project-summary-${project.id}`} className="text-gray-600 mb-6 leading-relaxed">
                            {project.summary}
                          </motion.p>
                          
                          <div className="mb-8">
                            <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-4">Details</h4>
                            <p className="text-gray-700 leading-relaxed">
                              {project.detailedExplanation}
                            </p>
                          </div>

                          {project.links && project.links.length > 0 && (
                            <div>
                              <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-4">Related Links</h4>
                              <div className="flex flex-wrap gap-4">
                                {project.links.map((link, index) => (
                                  <a
                                    key={index}
                                    href={link.url}
                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors group"
                                  >
                                    <span>{link.label}</span>
                                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </motion.div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Side Quests Section */}
      <section id="side-quests" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-8">Side Quests</h2>
          <p className="text-xl text-gray-700 leading-relaxed mb-12 max-w-2xl">
            Experiments, explorations, and ideas outside the main thread—from design tools to emerging tech prototypes.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-gray-100 p-12 cursor-pointer group"
          >
            <div className="relative z-10">
              <h3 className="mb-3">Explore Side Projects</h3>
              <p className="text-gray-600 mb-6">
                Interactive experiments, design tools, and research prototypes
              </p>
              <div className="inline-flex items-center gap-2 text-blue-600 group-hover:gap-3 transition-all">
                <span>View collection</span>
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            
            {/* Decorative geometric element */}
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <motion.circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
                <motion.line
                  x1="20"
                  y1="100"
                  x2="180"
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.3 }}
                />
                <motion.line
                  x1="100"
                  y1="20"
                  x2="100"
                  y2="180"
                  stroke="currentColor"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.6 }}
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-12">Get in Touch</h2>
          <div className="space-y-6">
            <a
              href="mailto:alex.chen@example.com"
              className="flex items-center gap-4 text-xl hover:text-blue-600 transition-colors group"
            >
              <Mail className="w-6 h-6" />
              <span>alex.chen@example.com</span>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </a>
            <a
              href="https://linkedin.com/in/alexchen"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 text-xl hover:text-blue-600 transition-colors group"
            >
              <Linkedin className="w-6 h-6" />
              <span>LinkedIn</span>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </a>
            <a
              href="https://github.com/alexchen"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 text-xl hover:text-blue-600 transition-colors group"
            >
              <Github className="w-6 h-6" />
              <span>GitHub</span>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          © 2026 Alex Chen. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
