import { NextResponse } from "next/server";

export async function GET() {
  // In a real app, this might fetch from a database or indexed blockchain data
  const positions = [
    {
      id: "1",
      inputAccount: "...",
      outputAccount: "...",
      amountIn: "1000000000", // 1 SOL
      slBps: 500, // 5%
      tpBps: 2000, // 20%
      status: "active",
    },
  ];

  return NextResponse.json(positions);
}
