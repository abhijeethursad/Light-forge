# ⚡ Light Forge

**The Elite Workout Operating System**

Light Forge is a high-performance, mobile-optimized fitness application engineered to track, visualize, and elevate your training progression. Built with a focus on cinematic UI design and advanced data telemetry, it bridges the gap between a standard workout logger and a premium, native-feeling fitness experience.

🔴 **Live Application:** [Light Forge on Vercel](https://light-forge-s2zi.vercel.app/)

---

## ✨ Core Features

*   **Dual-Axis Telemetry Tracking:** Track true progressive overload. The custom `Recharts` engine maps both your Max Load (Weight) and Volume (Reps) on independent, dynamically scaling axes so you can visualize real strength gains.
*   **Cinematic Mobile UI:** Engineered for the modern smartphone. Features include edge-to-edge locked-height video containers, ambient background blurs, frosted glass overlays, and native iOS-style drag-to-close gestures.
*   **Precision Execution Logging:** Log sets, reps, and exact weight loads. Includes smart toggles for unilateral/bilateral equipment (e.g., automatically calculating `x2` for dumbbells).
*   **Hardware-Accelerated Animations:** Powered by `framer-motion`, every modal, screen transition, and chart render is buttery smooth (60fps) with realistic spring physics.
*   **Responsive Architecture:** Flawlessly adapts from ultra-wide desktop monitors down to portrait mobile screens without cutting off data or breaking layouts.

---

## 🛠️ Tech Stack

This project leverages a modern, highly scalable frontend stack:

*   **Framework:** [Next.js](https://nextjs.org/) (React)
*   **Language:** [TypeScript](https://www.typescriptlang.org/) for strict type safety
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) for rapid, utility-first styling
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) for fluid physics and gestures
*   **Data Visualization:** [Recharts](https://recharts.org/) for responsive, customizable SVG charting
*   **Icons:** [Lucide React](https://lucide.dev/) for clean, consistent SVG iconography
*   **Deployment:** [Vercel](https://vercel.com/) (Edge Network)

---

## 🚀 Getting Started (Local Development)

To run Light Forge locally on your machine, follow these steps:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed.

### 2. Clone the Repository
```bash
git clone [https://github.com/YOUR_GITHUB_USERNAME/light-forge.git](https://github.com/YOUR_GITHUB_USERNAME/light-forge.git)
cd light-forge