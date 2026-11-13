import { Bot, Droplets, Newspaper, Sprout, Store } from "lucide-react";

export type Project = {
  id: string;
  index: string;
  title: string;
  category: string;
  description: string;
  status: string;
  icon: typeof Droplets;
  accentBadge: string;
  architectureDetails: { label: string; value: string }[];
  technologies: string[];
  problem: string;
  solution: string;
  architecture: string[];
  features: string[];
  implementationNotes?: string[];
  repository?: string;
  demo?: string;
  screenshot?: string;
};

export const projects: Project[] = [
  {
    id: "water-surface-trash-detection",
    index: "01",
    title: "Water Surface Trash Detection",
    category: "Computer Vision",
    description: "A Python camera and video pipeline that detects floating waste with YOLOv8, applies an optional region of interest, and tracks detections across frames.",
    status: "Prototype",
    icon: Droplets,
    accentBadge: "Detection pipeline",
    architectureDetails: [{ label: "Detector", value: "Ultralytics YOLOv8" }, { label: "Tracking", value: "ByteTrack / centroid fallback" }, { label: "Input", value: "Camera, image, or video" }],
    technologies: ["Python", "Ultralytics YOLOv8", "OpenCV", "NumPy"],
    problem: "Floating debris can be difficult to distinguish from reflections, ripples, and natural objects in water footage.",
    solution: "The repository provides a camera or file based detection loop, with optional ROI filtering and a dataset-image similarity fallback when the detector misses a presented object.",
    architecture: ["OpenCV reads camera, image, or video frames.", "Ultralytics YOLOv8 runs detection or persistent tracking over the selected ROI.", "ByteTrack is used when its dependency is available; a built-in centroid tracker is the fallback.", "Per-track labels and scores are retained in short histories for display stability. An optional fallback compares HSV and edge features against local dataset images."],
    features: ["Camera, image, and video input", "Configurable detection ROI and confidence threshold", "Persistent tracking with a built-in centroid fallback", "Optional crop classification from local dataset features", "Optional annotated output video"],
    implementationNotes: ["The README mentions MobileNetV3, but the current Python source does not load or call a MobileNetV3 model. The implementation described here is the YOLOv8 and handcrafted-feature pipeline present in source. Model weights and dataset assets are not included in the repository."],
    repository: "https://github.com/Sahithcodes/Water-Surface-Trash-detection-using-Yolov8",
  },
  {
    id: "streetsupply-hub",
    index: "02",
    title: "StreetSupply Hub",
    category: "Full-Stack Marketplace",
    description: "A B2B grocery marketplace prototype with vendor and supplier views, inventory, price discovery, bargaining, group orders, and a separate Gemini-backed chat service.",
    status: "Prototype",
    icon: Store,
    accentBadge: "Marketplace workflow",
    architectureDetails: [{ label: "Frontend", value: "HTML, CSS, JavaScript" }, { label: "Application API", value: "Node.js / Express" }, { label: "Storage & chat", value: "MySQL / Flask" }],
    technologies: ["HTML", "CSS", "JavaScript", "Node.js", "Express", "MySQL", "Flask", "Gemini API"],
    problem: "Small business buyers and local suppliers need a shared place to discover stock, coordinate bulk demand, and negotiate prices.",
    solution: "StreetSupply Hub brings buyer and supplier workflows together in a marketplace interface, with ordering and bargaining flows backed by a Node/Express application and MySQL schema.",
    architecture: ["Vanilla HTML, CSS, and JavaScript provide the marketplace and role-specific dashboard UI.", "A Node.js/Express server exposes marketplace operations backed by MySQL.", "A separate Flask service connects the support chat to the Gemini API when credentials are configured."],
    features: ["Product search and category filtering", "Supplier inventory and dashboard views", "Bargaining for bulk purchases", "Group-order flows", "Support chat service wired to Gemini"],
    implementationNotes: ["The repository README describes OTP-based access and price trends. Those details are retained as repository-described features; no independent deployment or production verification is claimed."],
    repository: "https://github.com/Sahithcodes/Streetsupply-hub",
  },
  {
    id: "farmveda",
    index: "03",
    title: "FarmVeda",
    category: "Infosys Springboard Project",
    description: "A local-first farming PWA for organizing farms, fields, sensor readings, irrigation schedules, and agricultural dashboard workflows.",
    status: "In Progress · local-first prototype",
    icon: Sprout,
    accentBadge: "Infosys Springboard project",
    architectureDetails: [{ label: "Frontend", value: "React / TypeScript" }, { label: "Local data", value: "Dexie / IndexedDB" }, { label: "App type", value: "Installable PWA" }],
    technologies: ["React", "TypeScript", "Vite", "Tailwind CSS", "Dexie", "IndexedDB", "Recharts"],
    problem: "Farm workflows involve connected information about plots, crops, sensor readings, schedules, and irrigation that is often scattered across tools.",
    solution: "FarmVeda organizes farm and field records in an installable, mobile-first application that persists data locally and offers dashboards for readings, schedules, and farm tasks.",
    architecture: ["Vite and React with TypeScript render the client application.", "Dexie stores farms, fields, sensors, readings, schedules, and related records in browser IndexedDB.", "A service worker and web app manifest provide the PWA installation and offline shell.", "Sensor telemetry is simulated or entered manually; the repository describes a local rule-based voice assistant rather than a connected AI/ML service."],
    features: ["Farm and field registration", "Farm dashboard and crop/soil records", "Sensor readings and moisture history charts", "Irrigation controls and schedules", "Offline-capable local storage and export/import", "Voice and multilingual assistant interface"],
    implementationNotes: ["This is an Infosys Springboard project. The repository explicitly describes a client-side application with local demo/simulated sensor data and no cloud backend or external AI service. No commercial deployment or Infosys endorsement is implied."],
    repository: "https://github.com/Sahithcodes/FarmVeda",
  },
  {
    id: "robotic-arm-simulator",
    index: "04",
    title: "Robotic Arm Simulator",
    category: "Interactive 3D Simulation",
    description: "A browser-based PUMA 6-DOF arm simulator with a Three.js scene, joint controls, kinematics views, and a simulated pick-and-place workflow.",
    status: "Interactive simulator",
    icon: Bot,
    accentBadge: "PUMA 6-DOF model",
    architectureDetails: [{ label: "Framework", value: "Next.js / TypeScript" }, { label: "Rendering", value: "React Three Fiber" }, { label: "Kinematics", value: "DH, FK, IK" }],
    technologies: ["Next.js", "TypeScript", "Three.js", "React Three Fiber", "Zustand"],
    problem: "Kinematic concepts and arm motion are easier to explore when joint changes and end-effector behavior can be seen together.",
    solution: "The simulator couples a 3D PUMA arm scene with joint controls, Denavit–Hartenberg and forward-kinematics displays, numerical inverse kinematics, and a simulated object manipulation task.",
    architecture: ["React Three Fiber and Three.js render the robot, table, and simulated object.", "A PUMA 6-DOF model applies joint limits and Denavit–Hartenberg parameters.", "Forward and numerical inverse-kinematics modules calculate poses and reachability.", "A Zustand store coordinates joint state, target selection, and task execution."],
    features: ["Interactive 3D robot and table scene", "Six joint controls and kinematics displays", "Inverse-kinematics target/reachability feedback", "Simulated pick-and-place task controls", "Object positioning and destination selection"],
    implementationNotes: ["This is a software simulation; no physical robot integration is present in the reviewed source."],
    repository: "https://github.com/Sahithcodes/Robotic-arm-simulator-",
  },
  {
    id: "financial-news",
    index: "05",
    title: "Financial News Summarization",
    category: "NLP Prototype",
    description: "A small financial-news prototype with feed/API ingestion helpers, LLM-based summarization, and keyword-based compliance flags.",
    status: "Prototype · integration incomplete",
    icon: Newspaper,
    accentBadge: "News analysis prototype",
    architectureDetails: [{ label: "API", value: "FastAPI" }, { label: "Summarization", value: "LangChain / OpenAI" }, { label: "Compliance", value: "Keyword rules" }],
    technologies: ["Python", "FastAPI", "Streamlit", "LangChain", "OpenAI", "FAISS"],
    problem: "Financial news can be lengthy and may contain language that merits a closer compliance review.",
    solution: "The repository sketches a workflow that summarizes submitted news text and flags configured terms, alongside RSS/API ingestion helpers and a FAISS vector-store wrapper.",
    architecture: ["FastAPI exposes a POST summarization endpoint.", "A LangChain OpenAI wrapper generates a summary.", "A keyword scan flags configured terms such as SEC, regulation, and compliance.", "Separate RSS/API ingestion and FAISS storage helpers are present in the repository."],
    features: ["Text summarization endpoint", "Keyword-based compliance flags", "RSS and generic API ingestion helpers", "FAISS vector-store wrapper", "Streamlit UI scaffold"],
    implementationNotes: ["The checked-in API uses a placeholder OpenAI key and the current endpoint does not wire ingestion or FAISS retrieval into a complete RAG flow. No live financial feed or working hosted service is claimed."],
    repository: "https://github.com/Sahithcodes/Financial-news",
  },
];

export const getProject = (slug: string) => projects.find((project) => project.id === slug);

export function getProjectLinks(project: Project) {
  if (project.demo && project.repository) {
    return {
      primary: { href: project.demo, label: "Live Demo" },
      repository: project.repository,
    };
  }
  if (project.demo) {
    return { primary: { href: project.demo, label: "View Project" }, repository: undefined };
  }
  if (project.repository) {
    return { primary: { href: project.repository, label: "View Project" }, repository: undefined };
  }
  return null;
}
