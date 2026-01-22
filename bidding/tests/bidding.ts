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
    airDropSol(1000000000, adminWallet);
    airDropSol(1000000000, secondWallet);
  })

  it("should initialize item counter account successfully", async ()=> {
    itemCounterAccountPda = findPda(program.programId, [Buffer.from("item_counter")]);
    const tx = await program.methods.initializeCounter().accounts({
      authority: adminWallet.publicKey,
      itemCounterAccount: itemCounterAccountPda,
    }).signers([adminWallet]).rpc();
    let itemCounterAccountData = await program.account.itemCounter.fetch(itemCounterAccountPda);
    console.log("    item counter when declared is", itemCounterAccountData.itemCount);
    console.log("    Your transaction signature", tx);
  });

  it("should initialize item successfully", async () => {
    let itemCounterAccountData = await program.account.itemCounter.fetch(itemCounterAccountPda);
    console.log("    item counter when item account is declared is", itemCounterAccountData.itemCount);
    
    itemAccountPda = findPda(program.programId, [Buffer.from("item"), new anchor.BN(itemCounterAccountData.itemCount).toArrayLike(Buffer, "le", 2)]);
    
    const name = "Item Name";
    const description = "This is the Item description";
    const imageUrl = "https://example.com/image.jpg";
    const price = 100;
    
    console.log("    admin wallet public key is", adminWallet.publicKey.toBase58());
    const tx = await program.methods.initializeItem(name, description, imageUrl, new anchor.BN(price)).accounts({
      authority: adminWallet.publicKey,
      itemCounterAccount: itemCounterAccountPda,
      itemAccount: itemAccountPda,
    }).signers([adminWallet]).rpc();

    itemCounterAccountData = await program.account.itemCounter.fetch(itemCounterAccountPda);
    console.log("    item counter after item account has been declared is", itemCounterAccountData.itemCount);
    console.log("    Your transaction signature", tx);
    console.log("    item counter account pda", itemCounterAccountPda.toBase58());
    console.log("    item account pda", itemAccountPda.toBase58());
  });

  // it("should return all the accounts associated with the wallet address", async() => {
  //   const accounts = await provider.connection.getAccountInfo(adminWallet.publicKey);
  //   // accounts.forEach(element => {
  //   //   console.log("    account pda/public key associated with admin wallet is",element.pubkey.toBase58());
  //   // });
  //   console.log("    all the associated accounts are", accounts);
  // })
});
