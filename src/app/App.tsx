import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react';
import { Gate } from './components/Gate';
import { BoatShape } from './components/Boat';
import { DioramaSection } from './diorama/DioramaSection';
import { WaveMark } from './components/WaveMark';
import { SectionTitle } from './components/SectionTitle';
import clearsyncImg from "./assets/clearsync.png";
import diefordiceImg from "./assets/diefordice.png";
import thickmorphImg from "./assets/ThickMorph.png";
import skiitrajectoryImg from "./assets/skiitrajectory.png";
import tavusImg from "./assets/tavus.png";

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
    id: 4,
    title: 'Thick Morph',
    summary: 'Designed a manufacturable thick-origami mechanism that enables mountain–valley switching while preserving kinematic feasibility under real material thickness. Bridged theoretical origami mechanics and production constraints, contributing design rules validated through peer review and international presentation.',
    tags: ['Origami Engineering', 'DH ANalysis', 'CNC Machining'],
    image: thickmorphImg,
    detailedExplanation: 'Selected as a Young Research Fellow at IIT Madras, under the guidance of Professor Phanisri Pradeep Pratapa I led the end-to-end design of a thick-origami structure that accommodates material thickness without sacrificing motion or foldability. Developed and validated geometric strategies for mountain–valley switching, translating abstract origami theory into practical, manufacturable design guidelines. The work culminated in a peer-reviewed paper submission to Mechanisms and Machine Theory and an international conference presentation at the MMT Symposium. The project demonstrates rigorous systems thinking across kinematics, fabrication constraints, and real-world deployability of morphing structures.',
    links: [
    ]
  },
  {
    id: 5,
    title: 'GTM For Tavus',
    summary: 'Designed a focused go-to-market strategy to drive first-time adoption of Tavus among U.S. product managers by minimizing time-to-value and experimentation friction. Structured to convert awareness → trial through one-click demos, clear CTAs, and community-driven distribution within a <$30k budget.',
    tags: ['GTM', 'Product-Led Growth', 'B2B SaaS'],
    image: tavusImg,
    detailedExplanation: 'Developed an end-to-end GTM plan targeting ~45,000 core U.S. product managers, grounded in how PMs actually discover and evaluate new tools—through peers, communities, and lightweight experimentation. Identified key adoption blockers (unclear value, tool fatigue, high setup effort) and redesigned the funnel around zero-install demos, persona sharing, and highly visible CTAs. Proposed a phased rollout across PM forums, newsletters, and showcases, paired with automated follow-ups and measurable activation metrics. The strategy aims to significantly improve trial activation and sharing rates, while keeping CAC low and enabling fast signal-gathering within the first 3–6 weeks.',
    links: [
      { label: 'Documentation', url: 'https://drive.google.com/file/d/1S_tHFYCH3onzXuQmCcPVvIPZFAaOUKN_/view?usp=sharing' }
    ]
  },
  {
    id: 3,
    title: 'A Die for Dice',
    summary: 'Designed a production-ready injection mold for a 1.5 cm playing die, accounting for draft angles, shrinkage allowances, and manufacturability constraints. Enabled repeatable, high-volume production with minimal post-processing and dimensional consistency suitable for consumer-grade manufacturing.',
    tags: ['Manufacturing', 'Injection Molding', 'Dice'],
    image: diefordiceImg,
    detailedExplanation: 'Designed a single-part injection-molded playing die in ABS, incorporating appropriate draft angles and shrinkage compensation to ensure clean ejection and dimensional accuracy. Applied standard ABS shrinkage allowances (~0.6%) and optimized wall geometry to reduce sink marks and tooling wear. The mold design supports fast cycle times, low reject rates, and consistent face geometry across large production runs. At scale, the design enables thousands of identical parts per day with near-zero secondary finishing, reducing per-unit cost and manufacturing variability.',
    links: [
    ]
  },
  {
    id: 1,
    title: 'Best Path for the Skiier',
    summary: 'Designed a hierarchical hybrid NMPC controller for autonomous alpine skiing, integrating gliding, carving, and side-slipping within a unified optimization framework. Demonstrated safe, dynamically feasible downhill navigation with automatic mode switching and 100% obstacle avoidance in complex simulated mountain terrain.',
    tags: ['Hierarchical Control', 'NMPC', 'Skiing'],
    image: skiitrajectoryImg,
    detailedExplanation: 'Developed a nonlinear model predictive control framework that jointly selects motion modes and continuous control inputs to navigate obstacle-rich, unstructured slopes. Implemented physics-based dynamic models for gliding, carving, and side-slipping, enabling speed regulation, sharp maneuvering, and stable descent under varying terrain conditions. Validated the controller in large-scale simulations (300×300 terrain grid) showing smooth trajectories, meaningful mode switching, and consistent target reachability. Analyzed numerical failure modes and proposed solver- and learning-based extensions to improve real-time feasibility and robustness.',
    links: [
    ]
  },
  {
    id: 2,
    title: 'Clear-Sync',
    summary: 'Designed a human-centered digital workflow to coordinate inpatient room cleanings by aligning patient readiness, staff schedules, and environmental services constraints. Projected to reduce last-minute disruptions and manual coordination by ~20–30%, while improving patient preparedness and staff scheduling efficiency.',
    tags: ['Product', 'Strategy', 'Tech'],
    image: clearsyncImg,
    detailedExplanation: "I took a course on Human Systems Engineering by Professor James Won at the Uniersity of Pennsylvania. As a part of the course we got to talk to professionals at the Children's Hospital of Philadelphia, to identify problems in their workflow and solve them. Applied human factors and sociotechnical systems thinking to analyze inpatient room-cleaning workflows involving patients, families, nurses, and environmental services teams. Identified communication breakdowns and cognitive load drivers through interviews, surveys, and workflow mapping across U.S. and international hospital contexts. Designed a centralized digital calendar and notification system that automates scheduling, preparation tasks, and real-time status updates across stakeholders. Projected to cut ad-hoc coordination, rescheduling, and room-preparation delays by approximately 20–30%, while improving patient comfort, predictability, and operational clarity.",
    links: [
    ]
  }
];

/** Length of the little boat in the nav bar (it points up, so this is its height there). */
const NAV_BOAT_W = 30;

export default function App() {
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState('');
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem('portfolio-unlocked') === '1'
  );

  const unlock = () => {
    sessionStorage.setItem('portfolio-unlocked', '1');
    setUnlocked(true);
    window.scrollTo({ top: 0 });
  };

  const relock = () => {
    sessionStorage.removeItem('portfolio-unlocked');
    setUnlocked(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'projects', 'explore', 'contact'];
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
    <div className="min-h-screen bg-paper text-ink">
      <AnimatePresence>{!unlocked && <Gate onUnlock={unlock} />}</AnimatePresence>

      {/* Sticky Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-paper/80 backdrop-blur-md border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="group flex items-center gap-2 text-left">
              <WaveMark className="h-6 w-auto text-sea transition-transform duration-500 group-hover:-translate-x-0.5 group-hover:scale-110" />
              <span className="font-display text-xl tracking-tight text-ink">Swathi</span>
            </button>
            <div className="flex items-center gap-8">
              {['about', 'projects', 'explore', 'side-quests', 'contact'].map((section) =>
                section === 'side-quests' ? (
                  // goes straight to the Sidequests site
                  <a
                    key={section}
                    href="https://swathisarav.github.io/sidequests/"
                    className="text-base font-medium transition-colors border-b-2 pb-1 text-sea border-transparent hover:text-sea-deep"
                  >
                    Side Quests
                  </a>
                ) : (
                  <button
                    key={section}
                    onClick={() => scrollToSection(section)}
                    className={`capitalize text-base font-medium transition-colors border-b-2 pb-1 ${
                      activeSection === section ? 'text-ink border-sea' : 'text-ink-soft border-transparent hover:text-ink'
                    }`}
                  >
                    {section}
                  </button>
                )
              )}
              <button
                onClick={relock}
                title="Back to the beach"
                aria-label="Back to the beach"
                className="flex h-8 w-12 items-center justify-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 hover:scale-110"
              >
                <span className="block rotate-90">
                  <BoatShape width={NAV_BOAT_W} shadow={false} outline="#3E4644" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* About Section */}
      <section id="about" className="pt-36 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionTitle n="01" title="About" />
          <p className="text-xl md:text-2xl text-ink-soft leading-relaxed mb-8 max-w-3xl">
            I started out building things - 3D models, simulations, and systems rooted in first principles. I honed my building skills through research as an undergrad at IIT Madras and through several hobby-projects. Over time, I found myself less interested in building in isolation and more curious about what happens when these ideas meet the real world: users, markets, costs, and constraints. 
          </p>
          <p className="text-xl md:text-2xl text-ink-soft leading-relaxed mb-8 max-w-3xl">
            Lately, I’ve been focusing on developing a stronger business and strategy perspective. I like digging into products and industries where technical feasibility and commercial realities collide, and working through the tradeoffs that actually shape decisions.
          </p>
          {/*
          <a 
            href="https://drive.google.com/file/d/example" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-lg text-sea hover:text-ink transition-colors group"
          >
             <span>View Resume</span> 
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a> */}
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-32 px-6 bg-paper-2 border-t border-line">
        <div className="max-w-6xl mx-auto">
          <SectionTitle n="02" title="Selected Work" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                layoutId={`project-${project.id}`}
                onClick={() => setExpandedProject(project.id)}
                className="bg-surface border border-line rounded-xl overflow-hidden cursor-pointer group hover:border-sea/60 transition-colors"
              >
                <div className="aspect-[16/10] overflow-hidden bg-paper-2">
                  <motion.img
                    layoutId={`project-image-${project.id}`}
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-7">
                  <motion.h3 layoutId={`project-title-${project.id}`} className="mb-3 font-display text-2xl text-ink">
                    {project.title}
                  </motion.h3>
                  <motion.p layoutId={`project-summary-${project.id}`} className="text-lg text-ink-soft mb-5 leading-relaxed">
                    {project.summary}
                  </motion.p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-sm font-semibold uppercase tracking-[0.12em] text-sea"
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

      {/* Explore: interactive 3D diorama (cards on phones) */}
      <DioramaSection />

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
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
            />
            
            {/* Expanded Card */}
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="min-h-screen px-4 py-20 flex items-center justify-center">
                <motion.div
                  layoutId={`project-${expandedProject}`}
                  className="bg-surface border border-line rounded-xl overflow-hidden max-w-4xl w-full relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setExpandedProject(null)}
                    className="absolute top-4 right-4 z-10 p-2 bg-paper-2 text-ink rounded-full border border-line hover:bg-sea/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  {projects
                    .filter((p) => p.id === expandedProject)
                    .map((project) => (
                      <div key={project.id}>
                        <div className="aspect-[16/9] overflow-hidden bg-paper-2">
                          <motion.img
                            layoutId={`project-image-${project.id}`}
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-8 md:p-12">
                          <motion.h3 layoutId={`project-title-${project.id}`} className="mb-4 font-display text-3xl text-ink">
                            {project.title}
                          </motion.h3>
                          <motion.p layoutId={`project-summary-${project.id}`} className="text-lg text-ink-soft mb-6 leading-relaxed">
                            {project.summary}
                          </motion.p>
                          
                          <div className="mb-8">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-sea mb-4">Details</h4>
                            <p className="text-lg text-ink-soft leading-relaxed">
                              {project.detailedExplanation}
                            </p>
                          </div>

                          {project.links && project.links.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-sea mb-4">Tags & Links</h4>
                              <div className="flex flex-wrap gap-4">
                                {project.links.map((link, index) => (
                                  <a
                                    key={index}
                                    href={link.url}
                                    className="inline-flex items-center gap-2 text-lg text-sea hover:text-ink transition-colors group"
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

      {/* Contact Section */}
      <section id="contact" className="relative overflow-hidden py-32 px-6 bg-paper-2 border-t border-line">
        <div className="max-w-6xl mx-auto">
          <SectionTitle n="04" title="Get in Touch" />
          <div className="space-y-6">
            <a
              href="mailto:swathisarav@alumni.iitm.ac.in"
              className="flex items-center gap-4 text-2xl text-ink hover:text-sea transition-colors group"
            >
              <Mail className="w-6 h-6" />
              <span>swathisarav@alumni.iitm.ac.in</span>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </a>
            <a
              href="https://www.linkedin.com/in/swathi-saravanan-21b3a1233/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 text-2xl text-ink hover:text-sea transition-colors group"
            >
              <Linkedin className="w-6 h-6" />
              <span>LinkedIn</span>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </a>
            <a
              href="https://github.com/swathisarav"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 text-2xl text-ink hover:text-sea transition-colors group"
            >
              <Github className="w-6 h-6" />
              <span>GitHub</span>
              <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </a>
          </div>
        </div>
        {/* the Sidequests wave, a quiet link between the two sites */}
        <WaveMark className="pointer-events-none absolute -right-8 bottom-6 w-[26rem] max-w-[70vw] h-auto text-sea opacity-15" />
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-line">
        <div className="max-w-6xl mx-auto text-center text-ink-faint text-base">
          © 2026 Swathi Saravanan. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
