import { motion } from "framer-motion";
import { Droplets, Zap, Eye } from "lucide-react";

const problems = [
  {
    icon: Droplets,
    title: "Massive Water Waste",
    description: "Traditional flood irrigation wastes up to 60% of water, depleting precious groundwater reserves.",
  },
  {
    icon: Zap,
    title: "Skyrocketing Energy Costs",
    description: "Continuous pumping without intelligent control leads to excessive electricity consumption and higher bills.",
  },
  {
    icon: Eye,
    title: "Blind Manual Monitoring",
    description: "Farmers rely on guesswork to determine soil moisture, leading to over or under-irrigation.",
  },
];

const ProblemSection = () => {
  return (
    <section id="problem" className="section-padding bg-muted">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-primary mb-3 block">The Problem</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground font-display mb-4">
            Traditional Irrigation is Failing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Outdated irrigation methods waste resources, increase costs, and harm crop yields.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="metric-card text-center"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 font-display">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
