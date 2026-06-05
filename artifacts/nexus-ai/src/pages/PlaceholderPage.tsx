import { motion } from "framer-motion";

interface PlaceholderPageProps {
  title: string;
  onOpenSidebar: () => void;
}

export default function PlaceholderPage({ title, onOpenSidebar }: PlaceholderPageProps) {
  return (
    <div className="h-[100dvh] w-full flex flex-col relative" data-testid={`page-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <header className="h-16 flex items-center justify-between px-6 border-b border-primary/20 bg-background/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenSidebar}
            className="p-1 text-primary hover:bg-primary/10 transition-colors rounded-sm"
            data-testid="button-open-sidebar-placeholder"
          >
            <div className="flex flex-col gap-[3px] w-5">
              <div className="h-[2px] bg-primary w-full shadow-[0_0_4px_currentColor]"></div>
              <div className="h-[2px] bg-primary w-full shadow-[0_0_4px_currentColor]"></div>
              <div className="h-[2px] bg-primary w-full shadow-[0_0_4px_currentColor]"></div>
            </div>
          </button>
          <h2 className="font-display text-xs text-primary text-shadow-primary tracking-wider mt-1">{title}</h2>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 179, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 179, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center'
        }}></div>

        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="font-display text-sm md:text-lg text-secondary text-shadow-secondary tracking-widest relative inline-block opacity-50">
            MODULE INITIALIZING...
          </div>
          <p className="text-muted-foreground font-sans text-sm max-w-md mx-auto">
            The {title.toLowerCase()} module is currently offline or under construction. 
            Check back after the next system cycle.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
