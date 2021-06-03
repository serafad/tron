export declare const genPrKey: () => {
    publicKey: string;
    privateKey: string;
};
export declare const computeAddress: (publicKey: string) => string;
export declare const getBase58CheckAddress: (address: string) => string;
export declare const sha256: (msg: string) => string;
