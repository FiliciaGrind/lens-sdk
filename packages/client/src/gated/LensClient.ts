import {
  AuthenticationConfig,
  GatedClient,
  IEncryptionProvider,
  ISigner,
} from '@lens-protocol/gated-content';
import { webCryptoProvider } from '@lens-protocol/gated-content/web';
import { InMemoryStorageProvider } from '@lens-protocol/storage';

import * as base from '../LensClient';
import { Gated } from './Gated';

export type LensClientConfig = base.LensClientConfig & {
  /**
   * The authentication configuration to use for authenticating with the Lit Protocol network.
   */
  authentication: AuthenticationConfig;
  /**
   * The signer to use for signing the SIWE for Lit Protocol authentication.
   */
  signer: ISigner;
  /**
   * The encryption provider to use for encrypting and decrypting strings.
   *
   * @defaultValue a Web Crypto API based encryption provider
   */
  encryption?: IEncryptionProvider;
};

/**
 * Lens Protocol Client with token-gated content support.
 *
 * It provides access to all the base {@link Base.LensClient} modules and the {@link Gated} module.
 *
 * @example
 * NodeJS example:
 * ```ts
 * import { Wallet } from 'ethers';
 * import { production } from '@lens-protocol/client';
 * import { LensClient } from '@lens-protocol/client/gated';
 *
 * const signer = new Wallet(process.env.PRIVATE_KEY);
 *
 * const client = new LensClient({
 *   environment: production,
 *
 *   authentication: {
 *     domain: process.env.DOMAIN,
 *     uri: process.env.URI,
 *   },
 *
 *   signer,
 * });
 * ```
 *
 * @example
 * Browser example with `ethers` v6 and browser wallet (e.g. MetaMask):
 * ```ts
 * import { BrowserProvider } from 'ethers';
 * import { production } from '@lens-protocol/client';
 * import { LensClient } from '@lens-protocol/client/gated';
 *
 * const provider = new BrowserProvider(window.ethereum);
 *
 * const client = new LensClient({
 *   environment: production,
 *
 *   authentication: {
 *     domain: window.location.hostname,
 *     uri: window.location.href,
 *   },
 *
 *   signer: await provider.getSigner(),
 * });
 * ```
 */
export class LensClient extends base.LensClient {
  private _gated: Gated;

  constructor(config: LensClientConfig) {
    super(config);
    this._gated = new Gated(
      new GatedClient({
        environment: config.environment.gated,
        authentication: config.authentication,
        signer: config.signer,
        storageProvider: config.storage ?? new InMemoryStorageProvider(),
        encryptionProvider: config.encryption ?? webCryptoProvider(),
      }),
      this._authentication,
    );
  }

  /**
   * The Gated module
   */
  get gated(): Gated {
    return this._gated;
  }
}
