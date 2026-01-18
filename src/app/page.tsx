import { Navbar } from "@/components/Navbar";
import { SwapCard } from "@/components/SwapCard";
import { PositionList } from "@/components/PositionList";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Trade with <span className="bg-gradient-to-r from-orange-600 to-yellow-500 bg-clip-text text-transparent italic">Pyro-Precision</span>
          </h1>
          <p className="max-w-2xl text-slate-400 text-lg md:text-xl">
            The first Solana AMM adapter with built-in Stop Loss and Take Profit. 
            Automate your exits directly from the swap interface.
          </p>
        </div>

        <section id="swap" className="mb-20">
          <SwapCard />
        </section>

        <section id="positions">
          <PositionList />
        </section>
      </main>

      {/* Footer / Background decorations */}
      <footer className="py-12 border-t border-slate-900 text-center text-slate-600 text-sm">
        <p>&copy; 2026 PyroSwap Protocol. Empowering Solana Traders.</p>
      </footer>
    </div>
  );
}
