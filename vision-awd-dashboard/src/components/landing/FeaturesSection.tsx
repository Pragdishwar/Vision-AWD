import { motion } from "framer-motion";
import { Layers, Brain, Gauge, ToggleRight, BatteryCharging } from "lucide-react";

const features = [
  { icon: Layers, title: "Surface-Level Soil Analysis", description: "Analyzes top-layer soil conditions using brightness segmentation." },
  { icon: Brain, title: "Smart AWD Logic", description: "Implements Alternate Wetting and Drying protocol automatically." },
  { icon: Gauge, title: "Sensor Validation", description: "Cross-validates visual data with capacitive moisture sensors." },
  { icon: ToggleRight, title: "Automated Relay Control", description: "Precision pump switching with fail-safe mechanisms." },
  { icon: BatteryCharging, title: "Energy Efficient", description: "Reduces pump runtime by up to 40%, cutting electricity costs." },
];

const FeaturesSection = () => {
  return (
    <section className="section-padding bg-muted">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-primary mb-3 block">Features</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground font-display mb-4">
            Built for Real-World Farming
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="metric-card group"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground font-display mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
