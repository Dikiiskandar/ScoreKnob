import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCw } from 'lucide-react';

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
            A modern, intuitive way to track scores with an interactive rotary knob interface. Perfect for games, competitions, and scoring events.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild className="text-lg px-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              <Link to="/knob-page">
                Try ScoreKnob
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 hover:-translate-y-0.5 transition-all">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border rounded-2xl shadow-sm p-6 text-center space-y-4 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <RotateCw className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Intuitive Controls</h3>
              <p className="text-muted-foreground">
                Rotate the knob to adjust scores with natural, fluid motion
              </p>
            </div>
            <div className="bg-card border rounded-2xl shadow-sm p-6 text-center space-y-4 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <RotateCw className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Multi-Player Support</h3>
              <p className="text-muted-foreground">
                Track scores for up to 6 players simultaneously
              </p>
            </div>
            <div className="bg-card border rounded-2xl shadow-sm p-6 text-center space-y-4 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <RotateCw className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Touch Friendly</h3>
              <p className="text-muted-foreground">
                Works seamlessly on both desktop and mobile devices
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
