import { ethers, BigNumberish } from "ethers";

export const formatDate = (secs: number) => {
  var t = new Date(secs * 1000); // Epoch
  return t.toLocaleString() + "⏱";
};

export const formatCurrency = (amount: BigNumberish, symbol: string) => {
  return `${ethers.utils.formatEther(amount)} ${symbol}`;
};
