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
    title: 'Best Path for the Skiier',
    summary: 'Designed a hierarchical hybrid NMPC controller for autonomous alpine skiing, integrating gliding, carving, and side-slipping within a unified optimization framework. Demonstrated safe, dynamically feasible downhill navigation with automatic mode switching and 100% obstacle avoidance in complex simulated mountain terrain.',
    tags: ['Hierarchical Control', 'NMPC', 'Skiing'],
    image: 'https://drive.google.com/file/d/1eji9WhXAp2jhMlwpFc6hwVkzRuPTNniW/view?usp=drive_link',
    detailedExplanation: 'Developed a nonlinear model predictive control framework that jointly selects motion modes and continuous control inputs to navigate obstacle-rich, unstructured slopes. Implemented physics-based dynamic models for gliding, carving, and side-slipping, enabling speed regulation, sharp maneuvering, and stable descent under varying terrain conditions. Validated the controller in large-scale simulations (300×300 terrain grid) showing smooth trajectories, meaningful mode switching, and consistent target reachability. Analyzed numerical failure modes and proposed solver- and learning-based extensions to improve real-time feasibility and robustness.',
    links: [
      { label: 'Documentation', url: '#' }
    ]
  },
  {
    id: 2,
    title: 'Clear-Sync',
    summary: 'Designed a human-centered digital workflow to coordinate inpatient room cleanings by aligning patient readiness, staff schedules, and environmental services constraints. Projected to reduce last-minute disruptions and manual coordination by ~20–30%, while improving patient preparedness and staff scheduling efficiency.',
    tags: ['Product', 'Strategy', 'Tech'],
    image: 'https://drive.google.com/file/d/1dVgzrFb9-khy4tE7fh8aQya04juEbdh4/view?usp=sharing',
    detailedExplanation: "I took a course on Human Systems Engineering by Professor James Won at the Uniersity of Pennsylvania. As a part of the course we got to talk to professionals at the Children's Hospital of Philadelphia, to identify problems in their workflow and solve them. Applied human factors and sociotechnical systems thinking to analyze inpatient room-cleaning workflows involving patients, families, nurses, and environmental services teams. Identified communication breakdowns and cognitive load drivers through interviews, surveys, and workflow mapping across U.S. and international hospital contexts. Designed a centralized digital calendar and notification system that automates scheduling, preparation tasks, and real-time status updates across stakeholders. Projected to cut ad-hoc coordination, rescheduling, and room-preparation delays by approximately 20–30%, while improving patient comfort, predictability, and operational clarity.",
    links: [
    ]
  },
  {
    id: 3,
    title: 'A Die for Dice',
    summary: 'Designed a production-ready injection mold for a 1.5 cm playing die, accounting for draft angles, shrinkage allowances, and manufacturability constraints. Enabled repeatable, high-volume production with minimal post-processing and dimensional consistency suitable for consumer-grade manufacturing.',
    tags: ['Manufacturing', 'Injection Molding', 'Dice'],
    image: 'https://drive.google.com/file/d/1gEpTWvxpf8lzvNb9OCvD1ynaWHj0a6uU/view?usp=sharing',
    detailedExplanation: 'Designed a single-part injection-molded playing die in ABS, incorporating appropriate draft angles and shrinkage compensation to ensure clean ejection and dimensional accuracy. Applied standard ABS shrinkage allowances (~0.6%) and optimized wall geometry to reduce sink marks and tooling wear. The mold design supports fast cycle times, low reject rates, and consistent face geometry across large production runs. At scale, the design enables thousands of identical parts per day with near-zero secondary finishing, reducing per-unit cost and manufacturing variability.',
    links: [
    ]
  },
  {
    id: 4,
    title: 'Thick Morph',
    summary: 'Designed a manufacturable thick-origami mechanism that enables mountain–valley switching while preserving kinematic feasibility under real material thickness. Bridged theoretical origami mechanics and production constraints, contributing design rules validated through peer review and international presentation.',
    tags: ['Origami Engineering', 'DH ANalysis', 'CNC Machining'],
    image: 'https://drive.google.com/file/d/1ld5lNQ5eOa-BE_RpvWMr4GLbx5qO4T-z/view?usp=sharing',
    detailedExplanation: 'Selected as a Young Research Fellow at IIT Madras, under the guidance of Professor Phanisri Pradeep Pratapa I led the end-to-end design of a thick-origami structure that accommodates material thickness without sacrificing motion or foldability. Developed and validated geometric strategies for mountain–valley switching, translating abstract origami theory into practical, manufacturable design guidelines. The work culminated in a peer-reviewed paper submission to Mechanisms and Machine Theory and an international conference presentation at the MMT Symposium. The project demonstrates rigorous systems thinking across kinematics, fabrication constraints, and real-world deployability of morphing structures.',
    links: [
    ]
  },
  {
    id: 5,
    title: 'GTM For Tavus',
    summary: 'Exploratory strategy  into conversational interfaces and multi-modal interaction',
    tags: ['Research', 'Design', 'Tech'],
    image: 'https://images.unsplash.com/photo-1723987251277-18fc0a1effd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcmVzZWFyY2glMjBhbmFseXNpc3xlbnwxfHx8fDE3Njk1MzcxNDV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    detailedExplanation: 'Led foundational research into emerging interaction models for voice + visual interfaces. Designed and conducted mixed-method studies with 60+ participants. Synthesized findings into actionable design principles and prototypes. Presented insights to executive team, influencing strategic product decisions for next 18 months.',
    links: [
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
              Swathi Saravanan
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed">
              Graduate Mechanical Engineering student at the University of Pennsylvania, exploring the intersection of product design, engineering, and entrepreneurship.
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
            I started out building things - 3D models, simulations, and systems rooted in first principles. I honed my building skills through reasearch as an undergrad at IIT Madras and through several hobby-projects. Over time, I found myself less interested in building in isolation and more curious about what happens when these ideas meet the real world: users, markets, costs, and constraints. 
          </p>
          <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 max-w-3xl">
            Lately, I’ve been focusing on developing a stronger business and strategy perspective. I like digging into products and industries where technical feasibility and commercial realities collide, and working through the tradeoffs that actually shape decisions.
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
                              <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-4">Tags & Links</h4>
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
            When I’m not working toward my bigger goals, I spend time exploring smaller curiosities. This is where boundaries blur, ideas stay open-ended, and I give myself room to experiment. I think of these as the side quests that keep me learning.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-gray-100 p-12 cursor-pointer group"
          >
            <div className="relative z-10">
              <h3 className="mb-3">Here's a Record of Things I've found Interesting</h3>
              <p className="text-gray-600 mb-6">
                Engineering, Art, and Adventure
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
              href="mailto:swathisarav@alumni.iitm.ac.in"
              className="flex items-center gap-4 text-xl hover:text-blue-600 transition-colors group"
            >
              <Mail className="w-6 h-6" />
              <span>swathisarav@alumni.iitm.ac.in</span>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </a>
            <a
              href="https://www.linkedin.com/in/swathi-saravanan-21b3a1233/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 text-xl hover:text-blue-600 transition-colors group"
            >
              <Linkedin className="w-6 h-6" />
              <span>LinkedIn</span>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </a>
            <a
              href="https://github.com/swathisarav"
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
          © 2026 Swathi Saravanan. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
