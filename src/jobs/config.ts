import { Raydium, parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// mainnet
const mainconnection = new Connection('https://api.mainnet-beta.solana.com');
const maincluster = 'mainnet';

// devnet
const devconnection = new Connection('https://api.devnet.solana.com');
const devcluster = 'devnet';

let raydium: Raydium | undefined;
export const raydiumV4Address = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
// private key for the wallet
const privateKey =
  '3q4an8TYSz5RLXxRVQpmpJTtqmup9MUvCHwHxNFz3D8u7jY3JgWqPx911hF6728N7iXp6T8SCdA3zp6htRZShYoY';
const owner = Keypair.fromSecretKey(bs58.decode(privateKey));

export const initRaydium = async (devnet = false) => {
  if (raydium) return raydium;

  const connection = devnet ? devconnection : mainconnection;
  const cluster = devnet ? devcluster : maincluster;
  raydium = await Raydium.load({
    owner,
    connection,
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: true,
    blockhashCommitment: 'finalized',
  });
  return raydium;
};

export const fetchTokenAccountData = async (devnet = false) => {
  const connection = devnet ? devconnection : mainconnection;

  const solAccountResp = await connection.getAccountInfo(owner.publicKey);
  const tokenAccountResp = await connection.getTokenAccountsByOwner(
    owner.publicKey,
    { programId: TOKEN_PROGRAM_ID },
  );
  const token2022Req = await connection.getTokenAccountsByOwner(
    owner.publicKey,
    { programId: TOKEN_2022_PROGRAM_ID },
  );
  const tokenAccountData = parseTokenAccountResp({
    owner: owner.publicKey,
    solAccountResp,
    tokenAccountResp: {
      context: tokenAccountResp.context,
      value: [...tokenAccountResp.value, ...token2022Req.value],
    },
  });
  return tokenAccountData;
};
