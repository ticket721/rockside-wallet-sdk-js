import fetch from 'cross-fetch';

export type RocksideNetwork = [3, 'ropsten'] | [1, 'mainnet'];

export type RocksideApiOpts = {
  baseUrl: string,
  token?: string,
  apikey?: string,
  network: RocksideNetwork;
};

export type RelayedTransactionResponse = {
  transaction_hash: string;
  tracking_id: string;
}

export type TransactionReceiptLog = {
  address: string;
  block_hash: string;
  block_number: number;
  data: string;
  log_index: number;
  removed: boolean;
  topics: string[];
  transaction_hash: string;
  transaction_index: number;
  id: string;
}

export type TransactionReceipt = {
  status: number;
  cumulative_gas_used: number;
  logs: TransactionReceiptLog[];
  transaction_hash: string;
  contract_address: string;
  gas_used: number;
  block_hash: string;
  block_number: number;
  transaction_index: number;
}

export type TransactionInfosResponse = {
  transaction_hash: string;
  tracking_id: string;
  from: string;
  to: string;
  data_length: number;
  value: number;
  gas: number;
  gas_price: number;
  chain_id: number;
  receipt: TransactionReceipt;
  status: "success" | "failure",
}

export type ExecuteTransaction = {
  relayer: string,
  from: string,
  to: string,
  value: number,
  data: ArrayBuffer,
  gas: number,
  gasPrice: number,
  signature: string,
};

export type EncryptedAccount = {
  username: string,
  iterations: number,
  passwordHash: ArrayBuffer,
  passwordDerivedKeyHash: ArrayBuffer,
  encryptedEncryptionKey: ArrayBuffer,
  encryptedEncryptionKeyIV: ArrayBuffer,
};

export type EncryptedWallet = {
  encryptedMnemonic: ArrayBuffer,
  encryptedMnemonicIV: ArrayBuffer,
};

export type IdentityResponse = {
  address: string,
  transactionHash: string,
};

export type TransactionOpts = {
  from: string;
  to?: string;
  value?: string | number | BigInt;
  gas?: string | number | BigInt;
  gasPrice?: string | number | BigInt;
  data?: string;
  nonce?: number;
}

export class RocksideApi {
  private readonly opts: RocksideApiOpts;
  private readonly headers: { [key: string]: string };

  private generateHeaders(opts: RocksideApiOpts): { [key: string]: string } {

    if (opts.apikey) {
      return {
        'apikey': opts.apikey
      }
    } else {
      return {
        'Authorization': 'Bearer ' + opts.token,
      }
    }

  }

  private authenticationChecks(opts: RocksideApiOpts): void {

    if (opts.apikey && opts.token) {
      throw new Error('Both access token and api key provided. Only one needed.');
    }

    if (!opts.apikey && !opts.token) {
      throw new Error('No authentication method provided: define apikey or token.');
    }

  }

  constructor(opts: RocksideApiOpts) {

    this.authenticationChecks(opts);
    this.headers = this.generateHeaders(opts);

    this.opts = opts;
  }

  private async extractError(resp: Response): Promise<Error> {
    const json = await resp.json();
    throw new Error(json['error']);
  }

  private async send(route: string, method: string, body: object): Promise<Response> {
    const url = `${this.opts.baseUrl}${route}`;
    return await fetch(url, {
      method,
      body: !!body ? JSON.stringify(body) : null,
      headers: this.headers,
    });
  }

  async getIdentities(): Promise<string[]> {
    const resp = await this.send(`/ethereum/${this.opts.network[1]}/smartwallets`, 'GET', null);

    if (resp.status != 200) {
      throw await this.extractError(resp);
    }

    const json = await resp.json();
    return json as string[];
  }

  async createIdentity(forwarder: string, account: string): Promise<IdentityResponse> {
    const resp = await this.send(`/ethereum/${this.opts.network[1]}/smartwallets`, 'POST', {
      forwarder,
      account
    });

    if (resp.status != 201) {
      throw await this.extractError(resp);
    }

    const json = await resp.json();
    return {
      address: json.address,
      transactionHash: json.transaction_hash,
    };
  }

  async getEOAs(): Promise<string[]> {
    const resp = await this.send(`/ethereum/eoa`, 'GET', null);

    if (resp.status !== 200) {
      throw await this.extractError(resp);
    }

    return resp.json();
  }

  async createEOA(): Promise<{ address: string }> {
    const resp = await this.send(`/ethereum/eoa`, 'POST', {});

    if (resp.status !== 200) {
      throw await this.extractError(resp);
    }

    const json = await resp.json();

    return {
      address: json['address']
    }
  }

  async signMessageWithEOA(eoa: string, hash: string): Promise<{ signed_message: string }> {
    const resp = await this.send(`/ethereum/eoa/${eoa}/sign-message`, 'POST', {
      message: hash
    });

    if (resp.status !== 200) {
      throw await this.extractError(resp);
    }

    const json = await resp.json();

    return {
      signed_message: json['signed_message']
    }
  }

  async sendTransaction(tx: TransactionOpts): Promise<{ transaction_hash: string, tracking_id: string }> {
    const resp = await this.send(`/ethereum/${this.opts.network[1]}/transaction`, 'POST', tx);

    if (resp.status !== 200) {
      throw await this.extractError(resp);
    }

    const json = await resp.json();

    return {
      transaction_hash: json['transaction_hash'],
      tracking_id: json['tracking_id']
    }
  }

  async createEncryptedAccount(account: EncryptedAccount) {
    const resp = await this.send('/encryptedaccounts', 'PUT', {
      username: account.username,
      password_hash: buf2hex(account.passwordHash),
      encrypted_encryption_key: buf2hex(account.encryptedEncryptionKey),
      encrypted_encryption_key_iv: buf2hex(account.encryptedEncryptionKeyIV),
      iterations: account.iterations,
      password_derived_key_hash: buf2hex(account.passwordDerivedKeyHash),
    });

    if (resp.status != 201 && resp.status != 409) {
      throw await this.extractError(resp);
    }
  }

  async connectEncryptedAccount(username: string, passwordHash: ArrayBuffer): Promise<{ data: ArrayBuffer, iv: ArrayBuffer }> {
    const resp = await this.send('/encryptedaccounts/connect', 'POST', {
      username,
      password_hash: buf2hex(passwordHash),
    });
    if (resp.status != 200) {
      throw await this.extractError(resp);
    }

    const json = await resp.json();

    return {
      data: hex2buf(json['encrypted_encryption_key']),
      iv: new Uint8Array(hex2buf(json['encryption_key_iv'])),
    };
  }

  async createEncryptedWallet(account: EncryptedAccount, wallet: EncryptedWallet) {
    const resp = await this.send('/encryptedaccounts/wallets', 'PUT', {
      username: account.username,
      password_hash: buf2hex(account.passwordHash),
      encrypted_mnemonic: buf2hex(wallet.encryptedMnemonic),
      encrypted_mnemonic_iv: buf2hex(wallet.encryptedMnemonicIV),
    });
    if (resp.status != 201) {
      throw await this.extractError(resp);
    }
  }

  async getEncryptedWallets(username: string, passwordHash: ArrayBuffer): Promise<Array<EncryptedWallet>> {
    const resp = await this.send('/encryptedaccounts/wallets', 'POST', {
      username,
      password_hash: buf2hex(passwordHash),
    });
    if (resp.status != 200) {
      throw await this.extractError(resp);
    }

    const json = await resp.json();

    const wallets = json.map(jsonWallet => ({
      encryptedMnemonic: hex2buf(jsonWallet['encrypted_mnemonic']),
      encryptedMnemonicIV: hex2buf(jsonWallet['mnemonic_iv']),
    }));

    return wallets;
  }

  async deployIdentityContract(address: string): Promise<{ address: string, txHash: string }> {
    const route = `/ethereum/${this.opts.network[1]}/contracts/relayableidentity`;
    const resp = await this.send(route, 'POST', { account: address });

    if (resp.status != 201) {
      throw await this.extractError(resp);
    }

    const json = await resp.json();

    return { address: json['address'], txHash: json['transaction_hash'] };
  }

  async getRelayParams(identity: string, account: string, channel: number): Promise<{ nonce: number, relayer: string }> {
    const route = `/ethereum/${this.opts.network[1]}/contracts/relayableidentity/${identity}/relayParams`;
    const resp = await this.send(route, 'POST', {
      account,
      channel_id: channel.toString(),
    });

    if (resp.status != 200) {
      throw await this.extractError(resp);
    }

    const json = await resp.json();

    return { nonce: Number(json['nonce']), relayer: json['relayer'] };
  }

  async relayTransaction(identity: string, tx: ExecuteTransaction): Promise<RelayedTransactionResponse> {
    const route = `/ethereum/${this.opts.network[1]}/contracts/relayableidentity/${identity}/relayExecute`;
    const resp = await this.send(route, 'POST', {
      relayer: tx.relayer,
      from: tx.from,
      to: tx.to,
      value: `0x${tx.value.toString(16)}`,
      data: buf2hex(tx.data),
      signature: tx.signature,
    });

    if (resp.status != 200) {
      throw await this.extractError(resp);
    }

    const json = await resp.json();

    return {
      transaction_hash: json['transaction_hash'],
      tracking_id: json['tracking_id']
    };
  }

  async getTransaction(txHashOrTrackingId: string): Promise<TransactionInfosResponse> {
    const route = `/ethereum/${this.opts.network[1]}/transactions/${txHashOrTrackingId}`;
    const resp = await this.send(route, 'GET', null);

    if (resp.status != 200) {
      throw await this.extractError(resp);
    }

    const json = await resp.json();

    return json as TransactionInfosResponse;
  }

  getRpcUrl(): string {
    return `${this.opts.baseUrl}/ethereum/${this.opts.network[1]}/jsonrpc`;
  }

  getToken(): string {
    return this.opts.token;
  }
}

function buf2hex(buffer: ArrayBuffer): string { // buffer is an ArrayBuffer
  return '0x' + Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function hex2buf(s: string): ArrayBuffer { // buffer is an ArrayBuffer
  const noPrefix = s.substring(2);
  const length = noPrefix.length / 2;
  const view = new Uint8Array(length);
  for (let i = 0; i < noPrefix.length; i += 2) {
    view[i / 2] = parseInt(noPrefix.substring(i, i + 2), 16);
  }
  return view.buffer;
}
