import "./globals.css";

export const metadata = {
  title: "MoneyLeft — Simple Budgeting",
  description: "Answer one question every day: how much can I safely spend?",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
