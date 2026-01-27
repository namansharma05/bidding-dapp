import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bidding } from "../target/types/bidding";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

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
    airDropSol(5000000000, secondWallet);
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
    const minimumBid = 100000000;
    
    console.log("    admin wallet public key is", adminWallet.publicKey.toBase58());
    const tx = await program.methods.initializeItem(name, description, imageUrl, new anchor.BN(price), new anchor.BN(minimumBid)).accounts({
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
    console.log("    admin wallet balance before first bid", await provider.connection.getBalance(adminWallet.publicKey));
    
    // First bid: previousBidder is SystemProgram (read-only is fine)
    const tx = await program.methods.bid(itemId).accounts({
      authority: adminWallet.publicKey,
      itemAccount: itemAccountPda,
      escrowAccount: escrowAccountPda,
      previousBidder: anchor.web3.SystemProgram.programId, // The system program is the default bidder for new items
      systemProgram: anchor.web3.SystemProgram.programId,
    }).signers([adminWallet]).rpc();

    console.log("    Your transaction signature for first bid", tx);
    
    // Wait for transaction confirmation
    await provider.connection.confirmTransaction(tx, "confirmed");
    
    const txInfo = await provider.connection.getTransaction(tx, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0
    });
    console.log("    transaction 1 fee is", txInfo?.meta?.fee);
    console.log("    escrow account balance after first bidding", await provider.connection.getBalance(escrowAccountPda));
    console.log("    admin wallet balance after first bid", await provider.connection.getBalance(adminWallet.publicKey));

    // Second bid: previousBidder is adminWallet (must be writable validation)
    const ix2 = await program.methods.bid(itemId).accounts({
      authority: adminWallet.publicKey,
      itemAccount: itemAccountPda,
      escrowAccount: escrowAccountPda,
      previousBidder: adminWallet.publicKey, // Previous bidder is adminWallet
      systemProgram: anchor.web3.SystemProgram.programId,
    }).instruction();

    // Manually mark previousBidder as writable because IDL says mut: false (to allow SystemProgram)
    // but in this specific case (refunding a user), it must be writable.
    ix2.keys.forEach((key) => {
      if (key.pubkey.equals(adminWallet.publicKey)) {
        key.isWritable = true;
      }
    });

    const tx2 = new anchor.web3.Transaction().add(ix2);
    const sig2 = await provider.sendAndConfirm(tx2, [adminWallet]);

    console.log("    Your transaction signature for second bid", sig2);
    
    // Wait for transaction confirmation
    await provider.connection.confirmTransaction(sig2, "confirmed");
    
    const tx2Info = await provider.connection.getTransaction(sig2, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0
    });
    console.log("    transaction 2 fee is", tx2Info?.meta?.fee);
    console.log("    escrow account balance after second bidding", await provider.connection.getBalance(escrowAccountPda));
    console.log("    admin wallet balance after second bid", await provider.connection.getBalance(adminWallet.publicKey));

    // Third bid: previousBidder is adminWallet, new bidder is secondWallet
    const ix3 = await program.methods.bid(itemId).accounts({
      authority: secondWallet.publicKey,
      itemAccount: itemAccountPda,
      escrowAccount: escrowAccountPda,
      previousBidder: adminWallet.publicKey, // Previous bidder is adminWallet
      systemProgram: anchor.web3.SystemProgram.programId,
    }).instruction();

    // Manually mark previousBidder as writable
    ix3.keys.forEach((key) => {
      if (key.pubkey.equals(adminWallet.publicKey)) {
        key.isWritable = true;
      }
    });

    const tx3 = new anchor.web3.Transaction().add(ix3);
    const sig3 = await provider.sendAndConfirm(tx3, [secondWallet]);
    
    console.log("    Your transaction signature for third bid", sig3);
    await provider.connection.confirmTransaction(sig3, "confirmed");
    console.log("    escrow account balance after third bidding", await provider.connection.getBalance(escrowAccountPda));
    console.log("    admin wallet balance after third bid (should be refunded)", await provider.connection.getBalance(adminWallet.publicKey));
  });
});
