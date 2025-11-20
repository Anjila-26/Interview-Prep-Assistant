import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const loResRegular = localFont({
  src: "../public/fonts/LoRes12OT-Regular.ttf",
  variable: "--font-lores-regular",
});

const loResBold = localFont({
  src: "../public/fonts/LoRes15OT-Bold.ttf",
  variable: "--font-lores-bold",
});

export const metadata: Metadata = {
  title: "Virtual Interview Assistant",
  description: "AI-powered interview preparation tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${loResRegular.variable} ${loResBold.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
