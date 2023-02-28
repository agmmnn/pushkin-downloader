import "./globals.css";

export const metadata = {
  title: "State Historical Museum and Pushkin Museum Downloader",
  description:
    "Download zoomify images from State Historical Museum and The Pushkin Museum in full quality.",
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
