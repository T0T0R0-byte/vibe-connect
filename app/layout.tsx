import { Outfit } from "next/font/google";
import "./globals.css";

import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import FirebaseSetupHelp from "./components/FirebaseSetupHelp";
import { Providers } from "./providers";
import type { Metadata } from "next";

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
        <Providers attribute="class" defaultTheme="dark" themes={["light", "dark", "cozy"]} enableSystem disableTransitionOnChange>
          <AuthProvider>
            <FirebaseSetupHelp />
            <Navbar />
            <main className="relative z-10 pt-24 min-h-screen flex flex-col">{children}</main>

            {/* Ambient Background Glows */}
            <div className="fixed top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[80px] -z-10 pointer-events-none animate-float"></div>
            <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[80px] -z-10 pointer-events-none animate-float" style={{ animationDelay: "1s" }}></div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
