import { Inter, Syne } from "next/font/google";
import "../styles.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap" });

export const metadata = {
  title: "Portfolio",
  description: "Portfolio personnel: presentation, competences, projets et liens de contact.",
  verification: {
    google: "rXjZlosAG9-mqXyzW7ABdTlXHa6UiWrVDgoYNoAgFA4"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'document.documentElement.dataset.theme=localStorage.getItem("portfolioTheme")||"dark";'
          }}
        />
      </head>
      <body className={`${inter.variable} ${syne.variable}`}>{children}</body>
    </html>
  );
}
