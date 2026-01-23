import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bidding } from "../target/types/bidding";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("  solana bidding dapp test cases",() => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.bidding as Program<Bidding>;

  const adminWallet = (provider.wallet as NodeWallet).payer;
  const secondWallet = anchor.web3.Keypair.generate();

  let itemCounterAccountPda: anchor.web3.PublicKey;
  let itemAccountPda: anchor.web3.PublicKey;
  let escrowAccountPda: anchor.web3.PublicKey;


  const findPda = (programId: anchor.web3.PublicKey, seeds: (Buffer | Uint8Array)[]): anchor.web3.PublicKey => {
    const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, programId);
    return pda;
  }

  const airDropSol = async (amount: number, wallet: anchor.web3.Keypair) => {
    const tx = await provider.connection.requestAirdrop(wallet.publicKey, amount);
    await provider.connection.confirmTransaction(tx);
  }

  beforeEach(async() => {
    airDropSol(1000000000, adminWallet);
    airDropSol(1000000000, secondWallet);
    itemCounterAccountPda = findPda(program.programId, [Buffer.from("item_counter")]);
  })

  it("should initialize item counter account successfully", async ()=> {
    const tx = await program.methods.initializeCounter().accounts({
      authority: adminWallet.publicKey,
      itemCounterAccount: itemCounterAccountPda,
    }).signers([adminWallet]).rpc();
    let itemCounterAccountData = await program.account.itemCounter.fetch(itemCounterAccountPda);
    console.log("    item counter when declared is", itemCounterAccountData.itemCount);
    // console.log("    Your transaction signature", tx);
  });

  it("should initialize item successfully", async () => {
    let itemCounterAccountData = await program.account.itemCounter.fetch(itemCounterAccountPda);
    itemAccountPda = findPda(program.programId, [Buffer.from("item"), new anchor.BN(itemCounterAccountData.itemCount).toArrayLike(Buffer, "le", 2)]);
    escrowAccountPda = findPda(program.programId, [Buffer.from("escrow"), adminWallet.publicKey.toBuffer(), new anchor.BN(itemCounterAccountData.itemCount).toArrayLike(Buffer, "le", 2)]);
    
    const name = "Item Name";
    const description = "This is the Item description";
    const imageUrl = "https://example.com/image.jpg";
    const price = 1000000000;
    const minimumBid = 1000000000;
    
    console.log("    admin wallet public key is", adminWallet.publicKey.toBase58());
    const tx = await program.methods.initializeItem(name, description, imageUrl, new anchor.BN(price/LAMPORTS_PER_SOL), new anchor.BN(minimumBid/LAMPORTS_PER_SOL)).accounts({
      authority: adminWallet.publicKey,
      itemCounterAccount: itemCounterAccountPda,
      itemAccount: itemAccountPda,
      escrowAccount: escrowAccountPda,
    }).signers([adminWallet]).rpc();

    itemCounterAccountData = await program.account.itemCounter.fetch(itemCounterAccountPda);
    console.log("    item counter after item account has been declared is", itemCounterAccountData.itemCount);
    console.log("    Your transaction signature", tx);
    console.log("    item counter account pda", itemCounterAccountPda.toBase58());
    console.log("    item account pda", itemAccountPda.toBase58());
    console.log("    escrow account pda", escrowAccountPda.toBase58());
    console.log("    escrow account balance when initialized", await provider.connection.getBalance(escrowAccountPda));
  });

  it("should bid successfully", async() => {
    let itemCounterAccountData = await program.account.itemCounter.fetch(itemCounterAccountPda);
    const itemId = itemCounterAccountData.itemCount - 1; // Assuming we bid on the last item created
    
    itemAccountPda = findPda(program.programId, [Buffer.from("item"), new anchor.BN(itemId).toArrayLike(Buffer, "le", 2)]);
    // Note: Escrow PDA in this DApp seems to be derived using the creator's wallet (adminWallet)
    escrowAccountPda = findPda(program.programId, [Buffer.from("escrow"), adminWallet.publicKey.toBuffer(), new anchor.BN(itemId).toArrayLike(Buffer, "le", 2)]);
    
    const tx = await program.methods.bid(itemId).accounts({
      authority: adminWallet.publicKey,
      itemAccount: itemAccountPda,
      escrowAccount: escrowAccountPda,
    }).signers([adminWallet]).rpc();
    console.log("    Your transaction signature for bid", tx);
    console.log("    escrow account balance after first bidding", await provider.connection.getBalance(escrowAccountPda));
  });
});
