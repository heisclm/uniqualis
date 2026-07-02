import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'UniQualis | QA Command Center',
  description: 'University Quality Assurance & Course/Lecturer Evaluation System',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased bg-[#F4F7FE] text-slate-900" suppressHydrationWarning>
        <Toaster position="top-right" toastOptions={{
          className: 'text-sm font-medium rounded-xl border border-slate-100 shadow-xl',
          duration: 4000,
          style: {
            background: '#fff',
            color: '#0f172a',
          }
        }} />
        {children}
      </body>
    </html>
  );
}
