import { motion } from "framer-motion";
import { Camera, PieChart, Cpu, WifiOff } from "lucide-react";

const solutions = [
  {
    icon: Camera,
    title: "Real-Time Soil Imaging",
    description: "High-resolution camera captures soil surface conditions continuously for accurate analysis.",
  },
  {
    icon: PieChart,
    title: "Segmented Dryness Detection",
    description: "AI-powered image segmentation identifies dry and wet zones across your field with precision.",
  },
  {
    icon: Cpu,
    title: "Automated Pump Control",
    description: "Intelligent relay system activates irrigation only when needed, eliminating waste.",
  },
  {
    icon: WifiOff,
    title: "No Cloud Dependency",
    description: "All processing happens on-device. Works reliably even in areas with no internet connectivity.",
  },
];

const SolutionSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-primary mb-3 block">Our Solution</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground font-display mb-4">
            Intelligent AWD Made Simple
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            AgriVision AWD combines computer vision with smart automation to deliver precise irrigation control.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {solutions.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-5 p-6 rounded-xl border border-border bg-card hover:shadow-elevated transition-all duration-300"
            >
              <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground font-display mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
