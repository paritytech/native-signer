import { SubstrateNetworkKeys, NetworkProtocols, NETWORK_LIST } from '../constants';

export function accountId({
  address,
  protocol = NetworkProtocols.SUBSTRATE,
  networkKey = SubstrateNetworkKeys.KUSAMA
}) {
  if (typeof address !== 'string' || address.length === 0 || !NETWORK_LIST[networkKey]) {
    throw new Error(`Couldn't create an accountId, address missing or wrong networkKey`);
  }
  if (protocol === NetworkProtocols.SUBSTRATE){
    const genesisHash = NETWORK_LIST[networkKey].genesisHash;
    
    return `${protocol}:${address}:${genesisHash}`;
  } else {
    return `${protocol}:${address.toLowerCase()}@${networkKey}`;
  }
}

export function empty(account = {}) {
  return {
    address: '',
    archived: false,
    createdAt: new Date().getTime(),
    encryptedSeed: null,
    name: '',
    networkKey: SubstrateNetworkKeys.KUSAMA,
    protocol: NetworkProtocols.SUBSTRATE,
    seed: '',
    updatedAt: new Date().getTime(),
    validBip39Seed: false,
    ...account
  };
}

export function validateSeed(seed, validBip39Seed) {
  if (seed.length === 0) {
    return {
      accountRecoveryAllowed: false,
      reason: `A seed phrase is required.`,
      valid: false
    };
  }

  const words = seed.split(' ');

  for (let word of words) {
    if (word === '') {
      return {
        accountRecoveryAllowed: true,
        reason: `Extra whitespace found.`,
        valid: false
      };
    }
  }

  if (!validBip39Seed) {
    return {
      accountRecoveryAllowed: true,
      reason: `This recovery phrase will be treated as a legacy Parity brain wallet.`,
      valid: false
    };
  }

  return {
    reason: null,
    valid: true
  };
}
