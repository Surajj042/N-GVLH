import { ThemeProvider } from "@/components/theme-provider";
import { MyProvider } from "@/context/teacherContext";
import { ConfettiProvider } from "@/providers/confetti-provider";
import { ToastProvider } from "@/providers/taoster-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "../styles/prism.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider
          signUpForceRedirectUrl="/"
          signInForceRedirectUrl="/"
          appearance={{
            variables: {
              colorBackground: "#1c1f2e",
              colorForeground: "#f1f2f6",
              colorMutedForeground: "#a3aaba",
              colorInput: "#252a3d",
              colorInputForeground: "#f1f2f6",
              colorBorder: "#3a4159",
              colorNeutral: "white",
              colorPrimary: "#7c3aed",
              colorRing: "#7c3aed",
              borderRadius: "0.75rem",
            },
            elements: {
              formButtonPrimary:
                "primary-gradient border-white hover:opacity-90",
              footerActionLink: "primary-gradient bg-clip-text text-transparent",
              logoImage: "h-10 w-10",
            },
          }}
        >
          <ConfettiProvider />
          <ToastProvider />
          <ThemeProvider>
            <MyProvider>{children}</MyProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
