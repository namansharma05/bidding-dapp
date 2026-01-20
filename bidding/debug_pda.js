
const { PublicKey } = require("@solana/web3.js");
const BN = require("bn.js");

const PROGRAM_ID = new PublicKey("D7rhKbV2vR28tjtKEf7w1dk3TdyFmDKq2GouMHcSJSGs");
const EXPECTED_PDA = "ECjVRkw8SMptj6b14ey5bwQ2TwhL28Boei62spFxQks3";

function findPda(seeds) {
    const [pda] = PublicKey.findProgramAddressSync(seeds, PROGRAM_ID);
    return pda.toBase58();
}

console.log("Expected:", EXPECTED_PDA);

// Try different combinations
const seedBase = Buffer.from("item");

// u8 0
let s1 = [seedBase, Buffer.from([0])];
console.log("u8(0):", findPda(s1));

// u16 0
let s2 = [seedBase, new BN(0).toArrayLike(Buffer, "le", 2)];
console.log("u16(0):", findPda(s2));

// u32 0
let s3 = [seedBase, new BN(0).toArrayLike(Buffer, "le", 4)];
console.log("u32(0):", findPda(s3));

// u64 0
let s4 = [seedBase, new BN(0).toArrayLike(Buffer, "le", 8)];
console.log("u64(0):", findPda(s4));

// u16 1
let s5 = [seedBase, new BN(1).toArrayLike(Buffer, "le", 2)];
console.log("u16(1):", findPda(s5));

// u8 1
let s6 = [seedBase, Buffer.from([1])];
console.log("u8(1):", findPda(s6));

// Maybe big endian?
let s7 = [seedBase, new BN(0).toArrayLike(Buffer, "be", 2)];
console.log("u16(0) be:", findPda(s7));

// Maybe just "item" without count?
let s8 = [seedBase];
console.log("no count:", findPda(s8));
