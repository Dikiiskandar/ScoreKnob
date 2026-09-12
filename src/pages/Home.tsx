import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Info, Moon, RotateCw, Sun, Users } from 'lucide-react';
import IconButton from '@/components/IconButton';
import { useThemeStore } from '@/store/useThemeStore';

type MenuItem = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  /** "primary" for the main action, "card" for the secondary one. */
  tone: 'primary' | 'card';
};

const GAME_MODES: MenuItem[] = [
  {
    to: '/knob-page',
    icon: RotateCw,
    label: 'Knob',
    description: 'Spin the dial to score',
    tone: 'primary',
  },
  {
    to: '/versus',
    icon: Users,
    label: 'Versus',
    description: 'Head-to-head match',
    tone: 'card',
  },
];

/** Big pressable card, like a level select in a game menu. */
const MenuTile: React.FC<{ item: MenuItem }> = ({ item }) => {
  const { to, icon: Icon, label, description, tone } = item;
  return (
    <Link
      to={to}
      className={`group w-full flex items-center gap-4 px-5 py-4 rounded-2xl border shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.98] ${
        tone === 'primary'
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-card text-foreground hover:bg-accent'
      }`}
    >
      <span
        className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
          tone === 'primary' ? 'bg-primary-foreground/15' : 'bg-primary/10 text-primary'
        }`}
      >
        <Icon className="w-7 h-7" />
      </span>
      <span className="flex-1 text-left">
        <span className="block text-xl font-bold leading-tight">{label}</span>
        <span className={`block text-sm ${tone === 'primary' ? 'opacity-80' : 'text-muted-foreground'}`}>
          {description}
        </span>
      </span>
      <ChevronRight className="w-6 h-6 opacity-60 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
};

const Home = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center gap-10 px-6 py-16 pb-[calc(4rem+var(--safe-bottom))]">
      <div className="absolute right-4 top-[calc(1rem+var(--safe-top))]">
        <IconButton onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </IconButton>
      </div>

      <div className="flex flex-col items-center text-center space-y-4">
        <img src="./logo.svg" alt="ScoreKnob" className="w-20 h-20 rounded-3xl shadow-lg" />
        <h1 className="text-5xl md:text-6xl font-black tracking-tight drop-shadow-sm">ScoreKnob</h1>
        <p className="text-lg text-muted-foreground">Pick a mode to start scoring.</p>
      </div>

      <nav className="w-full max-w-sm space-y-4">
        {GAME_MODES.map((item) => (
          <MenuTile key={item.to} item={item} />
        ))}
        <Link
          to="/about"
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          <Info className="w-4 h-4" />
          About
        </Link>
      </nav>
    </div>
  );
};

export default Home;
