import "./globals.css";

export const metadata = {
  title: "State Historical Museum and The Pushkin Museum Downloader",
  description: "State Historical Museum and The Pushkin Museum Downloader",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
