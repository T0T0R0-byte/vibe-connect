import { Outfit } from "next/font/google";
import "./globals.css";

import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import FirebaseSetupHelp from "./components/FirebaseSetupHelp";
import { Providers } from "./providers";
import type { Metadata } from "next";
import SmoothScroll from "./components/SmoothScroll"; // Import SmoothScroll

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "VibeConnect | Discover Amazing Workshops",
  description: "Join the community. Learn, Teach, Connect.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body className={`${outfit.variable} relative min-h-screen overflow-x-hidden bg-background text-foreground antialiased font-sans`}>
        <Providers attribute="class" defaultTheme="dark" themes={["light", "dark", "cozy"]} enableSystem disableTransitionOnChange={true}>
          <AuthProvider>
            <SmoothScroll /> {/* Add SmoothScroll here */}
            <FirebaseSetupHelp />
            <Navbar />
            <main className="relative z-10 pt-24 min-h-screen flex flex-col">{children}</main>

            {/* Premium Immersive Background - Optimized */}
            <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden">
              {/* Base Mesh */}
              <div className="absolute inset-0 bg-background"></div>

              {/* Simplified Animated Atmosphere - Reduced blur for performance */}
              <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-primary/10 rounded-full blur-[80px] animate-vibe-float"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[1200px] h-[1200px] bg-indigo-500/8 rounded-full blur-[100px] opacity-80"></div>

              {/* Noise Overlay - Reduced opacity */}
              <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
