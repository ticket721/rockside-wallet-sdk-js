export declare type RocksideNetwork = [3, 'ropsten'] | [1, 'mainnet'];
export declare type RocksideApiOpts = {
    baseUrl: string;
    token?: string;
    apikey?: string;
    network: RocksideNetwork;
};
export declare type RelayedTransactionResponse = {
    transaction_hash: string;
    tracking_id: string;
};
export declare type TransactionReceiptLog = {
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
};
export declare type TransactionReceipt = {
    status: number;
    cumulative_gas_used: number;
    logs: TransactionReceiptLog[];
    transaction_hash: string;
    contract_address: string;
    gas_used: number;
    block_hash: string;
    block_number: number;
    transaction_index: number;
};
export declare type TransactionInfosResponse = {
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
    status: "success" | "failure";
};
export declare type ExecuteTransaction = {
    relayer: string;
    from: string;
    to: string;
    value: number;
    data: ArrayBuffer;
    gas: number;
    gasPrice: number;
    signature: string;
};
export declare type EncryptedAccount = {
    username: string;
    iterations: number;
    passwordHash: ArrayBuffer;
    passwordDerivedKeyHash: ArrayBuffer;
    encryptedEncryptionKey: ArrayBuffer;
    encryptedEncryptionKeyIV: ArrayBuffer;
};
export declare type EncryptedWallet = {
    encryptedMnemonic: ArrayBuffer;
    encryptedMnemonicIV: ArrayBuffer;
};
export declare type IdentityResponse = {
    address: string;
    transactionHash: string;
};
export declare type TransactionOpts = {
    from: string;
    to?: string;
    value?: string | number | BigInt;
    gas?: string | number | BigInt;
    gasPrice?: string | number | BigInt;
    data?: string;
    nonce?: number;
};
export declare class RocksideApi {
    private readonly opts;
    private readonly headers;
    private generateHeaders;
    private authenticationChecks;
    constructor(opts: RocksideApiOpts);
    private extractError;
    private send;
    getIdentities(): Promise<string[]>;
    createIdentity(forwarder: string, account: string): Promise<IdentityResponse>;
    getEOAs(): Promise<string[]>;
    createEOA(): Promise<{
        address: string;
    }>;
    signMessageWithEOA(eoa: string, hash: string): Promise<{
        signed_message: string;
    }>;
    sendTransaction(tx: TransactionOpts): Promise<{
        transaction_hash: string;
        tracking_id: string;
    }>;
    createEncryptedAccount(account: EncryptedAccount): Promise<void>;
    connectEncryptedAccount(username: string, passwordHash: ArrayBuffer): Promise<{
        data: ArrayBuffer;
        iv: ArrayBuffer;
    }>;
    createEncryptedWallet(account: EncryptedAccount, wallet: EncryptedWallet): Promise<void>;
    getEncryptedWallets(username: string, passwordHash: ArrayBuffer): Promise<Array<EncryptedWallet>>;
    deployIdentityContract(address: string): Promise<{
        address: string;
        txHash: string;
    }>;
    getRelayParams(identity: string, account: string, channel: number): Promise<{
        nonce: number;
        relayer: string;
    }>;
    relayTransaction(identity: string, tx: ExecuteTransaction): Promise<RelayedTransactionResponse>;
    getTransaction(txHashOrTrackingId: string): Promise<TransactionInfosResponse>;
    getRpcUrl(): string;
    getToken(): string;
}
