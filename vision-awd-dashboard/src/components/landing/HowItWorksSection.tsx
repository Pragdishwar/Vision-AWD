import { motion } from "framer-motion";
import { Camera, BarChart3, Droplets, Power } from "lucide-react";

const steps = [
  { icon: Camera, step: "01", title: "Capture Soil Image", description: "Camera module captures high-res images of the soil surface at regular intervals." },
  { icon: BarChart3, step: "02", title: "Segment & Analyze", description: "Image processing segments brightness zones to detect dryness levels." },
  { icon: Droplets, step: "03", title: "Validate Moisture", description: "Sensor data cross-checks visual analysis for reliable moisture reading." },
  { icon: Power, step: "04", title: "Activate Pump", description: "System triggers pump relay when soil needs water, stops when saturated." },
];

const HowItWorksSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-primary mb-3 block">Process</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground font-display mb-4">
            How It Works
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="relative z-10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
                  <item.icon className="h-7 w-7" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block">Step {item.step}</span>
                <h3 className="text-lg font-bold text-foreground font-display mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
