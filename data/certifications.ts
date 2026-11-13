export type Credential = {
  title: string;
  issuer: string;
  date?: string;
  type: string;
  description: string;
  url?: string;
  topics?: string[];
};

export const certifications: Credential[] = [
  { title: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", date: "October 2026", type: "Professional Certification · CLF-C02", description: "AWS foundational cloud certification.", url: "https://www.credly.com/badges/6d3dbe08-9ee7-4e72-8c33-4768ef66e7dc/linked_in_profile" },
  { title: "AWS Academy Graduate - Cloud Foundations", issuer: "Amazon Web Services (AWS Academy)", date: "September 2026", type: "Training Badge", description: "AWS Academy Cloud Foundations learning credential.", url: "https://www.credly.com/badges/e185beb5-8123-4e6a-a2b2-92e404eb2578/linked_in_profile" },
  { title: "Quantum Horizons (Basic to Advanced Level)", issuer: "Amrita Vishwa Vidyapeetham, Amaravati Campus · with MeitY, Government of India and IEEE Student Chapter", type: "Completed 3-Day Quantum Computing Bootcamp", description: "A three-day introduction to quantum computing principles, applications, and emerging ideas. Educational workshop; not a professional certification.", topics: ["Fundamentals of Quantum Computing", "Key quantum concepts and applications", "Advanced ideas shaping next-generation technologies"] },
  { title: "Introduction to AI", issuer: "Authorized by Google · completed through Coursera", type: "Introductory Learning Credential", description: "Introductory learning program covering foundational artificial intelligence concepts.", url: "https://www.linkedin.com/feed/update/urn:li:activity:7470130509398876160/" },
  { title: "TATA Data Visualisation: Empowering Business with Effective Insights", issuer: "Forage", type: "Virtual Experience Program", description: "Virtual experience focused on data visualization and communicating business insights. This is not employment at TATA.", url: "https://www.linkedin.com/feed/update/urn:li:activity:7469995630426324992/" },
  { title: "TCS iON Career Edge - Young Professional", issuer: "TCS iON · Tata Consultancy Services", date: "June 2026", type: "Professional Development Program", description: "Career development program completed through TCS iON.", url: "https://www.linkedin.com/feed/update/urn:li:activity:7469757577954983936/" },
];
