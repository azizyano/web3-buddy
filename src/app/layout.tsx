import Providers from "./providers";
import { AIContextProvider } from "@/contexts/AIContext";
import { TooltipProvider } from "@/contexts/TooltipContext";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AIContextProvider>
            <TooltipProvider>{children}</TooltipProvider>
            </AIContextProvider>
        </Providers>
      </body>
    </html>
  );
}