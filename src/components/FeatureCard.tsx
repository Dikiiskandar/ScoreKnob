import type { LucideIcon } from "lucide-react";

/** Home and About share these feature highlights; "stacked" is centered, "row" is icon-left. */
const FeatureCard: React.FC<{
  icon: LucideIcon;
  title: string;
  description: string;
  layout?: "stacked" | "row";
}> = ({ icon: Icon, title, description, layout = "stacked" }) =>
  layout === "stacked" ? (
    <div className="bg-card border rounded-2xl shadow-sm p-6 text-center space-y-4 hover:shadow-md transition-all hover:-translate-y-1">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  ) : (
    <div className="flex items-start gap-4 bg-card border rounded-2xl shadow-sm p-6 hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );

export default FeatureCard;
