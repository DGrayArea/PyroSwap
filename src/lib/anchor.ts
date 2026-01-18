import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import idl from "./idl.json";

export const PROGRAM_ID = new PublicKey(idl.metadata.address);

export function getProgram(provider: AnchorProvider) {
  return new Program(idl as unknown as Idl, provider);
}

export const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
