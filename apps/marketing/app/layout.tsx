import type { Metadata } from "next";

import "./globals.css";

const themeInitScript = `(function(){var t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://fodmapp.fr"),
  title: {
    default: "FODMAPP",
    template: "%s | FODMAPP",
  },
  description:
    "Un outil pour trouver des substitutions compatibles avec un régime pauvre en FODMAP.",
  openGraph: {
    title: "FODMAPP",
    description:
      "Un outil pour trouver des substitutions compatibles avec un régime pauvre en FODMAP.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
