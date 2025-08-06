import '../app/ui/global.css'
import { lusitana, montserrat } from './ui/fonts';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} antialiased`}>
        {children}
        <footer className={`${lusitana.className} text-center p-4 bg-gray-100`}>
          © 2023 Acme Corporation. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
