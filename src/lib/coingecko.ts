import axios from "axios";

export async function getTokenPrice(tokenId: string) {
  const response = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
  );
  return response.data[tokenId].usd;
}