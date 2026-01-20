import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bidding } from "../target/types/bidding";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

describe("  solana bidding dapp test cases",() => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.bidding as Program<Bidding>;

  const adminWallet = (provider.wallet as NodeWallet).payer;
  const secondWallet = anchor.web3.Keypair.generate();

  let itemCounterAccountPda: anchor.web3.PublicKey;
  let itemAccountPda: anchor.web3.PublicKey;


  const findPda = (programId: anchor.web3.PublicKey, seeds: (Buffer | Uint8Array)[]): anchor.web3.PublicKey => {
    const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, programId);
    return pda;
  }

  const airDropSol = async (amount: number, wallet: anchor.web3.Keypair) => {
    const tx = await provider.connection.requestAirdrop(wallet.publicKey, amount);
    await provider.connection.confirmTransaction(tx);
  }

  beforeEach(() => {
    itemCounterAccountPda = findPda(program.programId, [Buffer.from("item_counter")]);
    itemAccountPda = findPda(program.programId, [Buffer.from("item"), new anchor.BN(0).toArrayLike(Buffer, "le", 2)]);
    console.log("Derived itemAccountPda in beforeEach:", itemAccountPda.toBase58());
    airDropSol(1000000000, adminWallet);
    airDropSol(1000000000, secondWallet);
  })

  it("should initialize item counter account successfully", async ()=> {
    const tx = await program.methods.initializeCounter().accounts({
      authority: adminWallet.publicKey,
      itemCounterAccount: itemCounterAccountPda,
    }).signers([adminWallet]).rpc();
    console.log("    Your transaction signature", tx);
  });

  it("should initialize item successfully", async () => {
    const name = "Item Name";
    const description = "This is the Item description";
    const imageUrl = "https://example.com/image.jpg";
    const price = 100;

    const tx = await program.methods.initializeItem(name, description, imageUrl, new anchor.BN(price)).accounts({
      authority: adminWallet.publicKey,
      itemCounterAccount: itemCounterAccountPda,
      itemAccount: itemAccountPda,
    }).signers([adminWallet]).rpc();
    console.log("    Your transaction signature", tx);
    console.log("    item counter account pda", itemCounterAccountPda.toBase58());
    console.log("    item account pda", itemAccountPda.toBase58());

    const itemAccountPda2 = findPda(program.programId, [Buffer.from("item"), new anchor.BN(1).toArrayLike(Buffer, "le", 2)]);

    const tx2 = await program.methods.initializeItem(name, description, imageUrl, new anchor.BN(price)).accounts({
      authority: secondWallet.publicKey,
      itemCounterAccount: itemCounterAccountPda,
      itemAccount: itemAccountPda2,
    }).signers([secondWallet]).rpc();
    console.log("    Your transaction signature", tx2);
  });
});
