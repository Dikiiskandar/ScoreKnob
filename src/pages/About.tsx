import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import FeatureCard from '@/components/FeatureCard';
import { RotateCw, Users, Sparkles, Lightbulb } from 'lucide-react';

const POINTS = [
  {
    icon: RotateCw,
    title: 'Knob Scoring',
    description:
      'The rotary interface lets you spin to score. It is ideal for tracking totals, points, or quick running counts without tapping buttons repeatedly.',
  },
  {
    icon: Users,
    title: 'Versus Mode',
    description:
      'A split-screen scoreboard for two players or teams. Keep the focus on the match and update scores in real time.',
  },
  {
    icon: Sparkles,
    title: 'Light & Responsive',
    description:
      'The interface is simple, touch-friendly, and works well on phones, tablets, and desktops.',
  },
  {
    icon: Lightbulb,
    title: 'Why It Exists',
    description:
      'ScoreKnob was made to keep scoring friction-free and fun, without the clutter of full game management tools.',
  },
];

const About = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">About ScoreKnob</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A focused score-keeping app with two quick tools for everyday games and matches.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {POINTS.map((point) => (
            <FeatureCard key={point.title} layout="row" {...point} />
          ))}
        </div>

        <div className="text-center pt-8">
          <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
            <Link to="/knob-page">Try the Knob</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default About;
