import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CustomCursor from "@/components/ui/CustomCursor";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AnimationProvider } from "@/components/animations/AnimationProvider";
import CinematicScrollDirector from "@/components/animations/CinematicScrollDirector";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "K. Venkata Sahith | AI Engineer & Full-Stack Developer",
  description:
    "Personal portfolio of K. Venkata Sahith — B.Tech Artificial Intelligence student, AI/ML engineer, computer vision researcher, and modern full-stack developer.",
  keywords: [
    "K. Venkata Sahith",
    "AI Engineer",
    "Machine Learning",
    "Computer Vision",
    "Full-Stack Developer",
    "Portfolio",
  ],
  authors: [{ name: "K. Venkata Sahith" }],
  creator: "K. Venkata Sahith",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sahith.dev",
    title: "K. Venkata Sahith | AI Engineer & Full-Stack Developer",
    description:
      "Building Intelligence. Engineering Experiences. Portfolio of K. Venkata Sahith.",
    siteName: "K. Venkata Sahith Portfolio",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1110",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} scroll-smooth`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('sahith_portfolio_theme');
                  var theme = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-content-primary antialiased selection:bg-accent/25 selection:text-content-primary transition-colors duration-200 overflow-x-hidden">
        <ThemeProvider>
          <AnimationProvider>
            <CustomCursor />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-surface-elevated focus:text-content-primary focus:border focus:border-accent rounded"
            >
              Skip to main content
            </a>
            <Navbar />
            <CinematicScrollDirector />
            <main id="main-content" tabIndex={-1} className="relative z-10 focus:outline-none">
              {children}
            </main>
            <Footer />
          </AnimationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
