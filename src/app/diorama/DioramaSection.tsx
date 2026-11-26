import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';
import { useIsMobile } from '../components/ui/use-mobile';
import { DIORAMA_ITEMS, type DioramaId } from './items';

// three.js is large; load it only when this section is actually shown.
const DioramaScene = lazy(() => import('./DioramaScene'));

export function DioramaSection() {
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<DioramaId | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const item = DIORAMA_ITEMS.find((i) => i.id === selected) ?? null;

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelected(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const openFromScene = (id: DioramaId) => {
    setSelected(id);
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section id="explore" ref={sectionRef} className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm uppercase tracking-wider text-teal mb-8">Explore</h2>

        {isMobile ? (
          <div className="grid grid-cols-2 gap-4">
            {DIORAMA_ITEMS.map((it) => (
              <button
                key={it.id}
                onClick={() => setSelected(it.id)}
                className="text-left rounded-xl bg-white p-4 shadow-sm ring-1 ring-navy/5 active:scale-[0.98] transition-transform"
              >
                <div className="mb-3 h-16 rounded-lg" style={{ background: it.color }} />
                <h3 className="text-base text-navy">{it.title}</h3>
                <p className="text-sm text-navy/60">{it.subtitle}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="relative h-[620px]">
            {/* The canvas bleeds past its box (it is transparent) so tilting never clips the scene. */}
            <div className="absolute -top-16 -bottom-72 -inset-x-16">
              <Suspense fallback={null}>
                <DioramaScene selected={selected} onSelect={openFromScene} />
              </Suspense>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {item && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className={`fixed inset-0 z-50 ${isMobile ? 'bg-navy/70 backdrop-blur-sm' : 'bg-navy/10'}`}
            />
            <motion.div
              key="card"
              initial={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, x: 60 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26, delay: isMobile ? 0 : 0.25 }}
              className={
                isMobile
                  ? 'fixed inset-x-4 bottom-4 z-50 max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-2xl'
                  : 'fixed right-8 top-1/2 z-50 w-full max-w-md -translate-y-1/2 rounded-2xl bg-white shadow-2xl'
              }
              role="dialog"
              aria-label={item.title}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-aqua/40 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="h-2 rounded-t-2xl" style={{ background: item.color }} />
              <div className="p-8">
                <p className="text-sm uppercase tracking-wider text-teal mb-2">{item.subtitle}</p>
                <h3 className="text-2xl text-navy mb-4">{item.title}</h3>
                <p className="text-navy/80 leading-relaxed mb-6">{item.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {item.tags.map((t) => (
                    <span key={t} className="px-3 py-1 bg-aqua/50 text-navy/80 rounded-full text-sm">
                      {t}
                    </span>
                  ))}
                </div>
                {item.links && item.links.length > 0 && (
                  <div className="flex flex-wrap gap-4">
                    {item.links.map((l) => (
                      <a
                        key={l.url}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-teal hover:text-navy transition-colors"
                      >
                        {l.label} <ArrowUpRight className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
