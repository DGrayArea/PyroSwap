import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { WalletContextProvider } from '@/components/providers/WalletContextProvider';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'PyroSwap | Advanced Conditional Trading',
  description: 'Instant swaps and decentralized limit orders on Solana.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${inter.variable} font-sans`}>
        <WalletContextProvider>
            {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
