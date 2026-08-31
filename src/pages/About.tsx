import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RotateCw, Code2, Zap } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">About ScoreKnob</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern score tracking application built with React, TypeScript, and Tailwind CSS
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <RotateCw className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Interactive Knob Interface</h3>
                <p className="text-muted-foreground">
                  ScoreKnob features an innovative rotary knob interface that makes adjusting scores intuitive and natural. Simply click and drag to rotate the knob and update scores in real-time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Code2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Built with Modern Technologies</h3>
                <p className="text-muted-foreground">
                  Built using React 19, TypeScript, Vite, and Tailwind CSS v4. The application leverages modern web technologies for optimal performance and developer experience.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Responsive & Accessible</h3>
                <p className="text-muted-foreground">
                  Designed to work seamlessly across desktop and mobile devices with touch support. The interface follows accessibility best practices for inclusive user experience.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-card border rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1">
            <h3 className="text-xl font-semibold mb-4">Tech Stack</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                React 19 with TypeScript
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Vite for fast development
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Tailwind CSS v4 with custom theme
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Radix UI components
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                React Router for navigation
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Zustand for state management
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Lucide React icons
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center pt-8">
          <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
            <Link to="/knob-page">Try ScoreKnob Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default About;
