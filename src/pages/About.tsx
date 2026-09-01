import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RotateCw, Users, Sparkles } from 'lucide-react';

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
          <div className="flex items-start gap-4 p-4 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <RotateCw className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Knob Scoring</h3>
              <p className="text-muted-foreground">
                The rotary interface lets you spin to score. It is ideal for tracking totals, points, or quick running counts without tapping buttons repeatedly.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Versus Mode</h3>
              <p className="text-muted-foreground">
                A split-screen scoreboard for two players or teams. Keep the focus on the match and update scores in real time.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Light & Responsive</h3>
              <p className="text-muted-foreground">
                The interface is simple, touch-friendly, and works well on phones, tablets, and desktops.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <RotateCw className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Why It Exists</h3>
              <p className="text-muted-foreground">
                ScoreKnob was made to keep scoring friction-free and fun, without the clutter of full game management tools.
              </p>
            </div>
          </div>
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
