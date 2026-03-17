import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "FODMAPP",
  description:
    "Un outil pour trouver des substitutions compatibles avec un régime pauvre en FODMAP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);})();",
          }}
        />
        {children}
      </body>
    </html>
  );
}
