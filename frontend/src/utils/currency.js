export async function getEthPrice() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=gbp,usd"
  );
  if (!res.ok) throw new Error("Failed to fetch ETH price");
  const data = await res.json();
  return { gbp: data.ethereum.gbp, usd: data.ethereum.usd };
}

export function ethToGbp(ethAmount, ethPriceGbp) {
  return (parseFloat(ethAmount) * ethPriceGbp).toFixed(2);
}

export function ethToUsd(ethAmount, ethPriceUsd) {
  return (parseFloat(ethAmount) * ethPriceUsd).toFixed(2);
}

export function formatGbp(ethAmount, ethPriceGbp) {
  return `£${ethToGbp(ethAmount, ethPriceGbp)}`;
}

export function formatUsd(ethAmount, ethPriceUsd) {
  return `$${ethToUsd(ethAmount, ethPriceUsd)}`;
}
