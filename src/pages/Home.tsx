import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCw, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <RotateCw className="w-4 h-4" />
            Interactive Score Tracking
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground drop-shadow-sm">
            ScoreKnob
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A simple way to keep score. Use the knob for one-tap scoring, or switch to Versus for head-to-head matches.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild className="text-lg px-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              <Link to="/knob-page">
                Open Knob
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 hover:-translate-y-0.5 transition-all">
              <Link to="/versus">
                <Users className="mr-2 w-5 h-5" />
                Start Versus
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Ways to Score</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border rounded-2xl shadow-sm p-6 text-center space-y-4 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <RotateCw className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Rotary Knob</h3>
              <p className="text-muted-foreground">
                Spin the dial to add or remove points in a single, intuitive motion
              </p>
            </div>
            <div className="bg-card border rounded-2xl shadow-sm p-6 text-center space-y-4 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Head-to-Head</h3>
              <p className="text-muted-foreground">
                Track two scores side by side for quick duels and 1v1 games
              </p>
            </div>
            <div className="bg-card border rounded-2xl shadow-sm p-6 text-center space-y-4 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <RotateCw className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Works Anywhere</h3>
              <p className="text-muted-foreground">
                Built for desktop and mobile, so you can score on the go
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
