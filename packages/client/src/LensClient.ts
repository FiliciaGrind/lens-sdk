import { InMemoryStorageProvider, IStorageProvider } from '@lens-protocol/storage';

import { Authentication, IAuthentication } from './authentication';
import { LensContext, MediaTransformsConfig } from './context';
import { Environment } from './environments';
import {
  Explore,
  Feed,
  Invites,
  Modules,
  Momoka,
  Nfts,
  Notifications,
  Poaps,
  Profile,
  Publication,
  Revenue,
  Search,
  Transaction,
  Wallet,
} from './submodules';
import { Handle } from './submodules/handle';

/**
 * LensClient configuration
 */
export type LensClientConfig = {
  /**
   * The environment to use. See {@link production} or {@link development}.
   */
  environment: Environment;

  /**
   * The storage provider to use.
   *
   * @defaultValue {@link InMemoryStorageProvider}
   */
  storage?: IStorageProvider;

  /**
   * Media returned from the publication and profile queries can be transformed
   * to sizes needed by the SDK consuming application.
   * To overwrite default transformation values, provide a `mediaTransforms` object.
   *
   * @see {@link MediaTransformsConfig} for more information
   */
  mediaTransforms?: MediaTransformsConfig;

  /**
   * The origin to be sent in the `origin` header when making requests to the Lens API.
   *
   * @deprecated Use the `headers` option instead. This will be removed in a future release.
   */
  origin?: string;

  /**
   * Allows to define extra headers to be sent when making requests to the Lens API.
   * You can set the `origin` or `user-agent` headers here.
   */
  headers?: Record<string, string>;
};

/**
 * The LensClient is the main entry point for the LensClient SDK.
 *
 * It provides access to all the different modules.
 *
 * @group LensClient
 *
 * @example
 * ```ts
 * import { LensClient, development } from '@lens-protocol/client';
 *
 * const client = new LensClient({
 *   environment: development
 * });
 * ```
 */
export class LensClient {
  protected readonly context: LensContext;
  protected readonly _authentication: Authentication;

  /**
   * @param config - The configuration for the LensClient
   */
  constructor(public readonly config: LensClientConfig) {
    this.context = {
      environment: config.environment,
      storage: config.storage || new InMemoryStorageProvider(),
      mediaTransforms: config.mediaTransforms || {},
      origin: config.origin,
      headers: config.headers,
    };
    this._authentication = new Authentication(this.context);
  }

  /**
   * The authentication module
   */
  get authentication(): IAuthentication {
    return this._authentication;
  }

  /**
   * The Explore module
   */
  get explore(): Explore {
    return new Explore(this.context, this._authentication);
  }

  /**
   * The Feed module
   */
  get feed(): Feed {
    return new Feed(this.context, this._authentication);
  }

  /**
   * The Handle module
   */
  get handle(): Handle {
    return new Handle(this.context, this._authentication);
  }

  /**
   * The Invites module
   */
  get invites(): Invites {
    return new Invites(this.context, this._authentication);
  }

  /**
   * The Modules module
   */
  get modules(): Modules {
    return new Modules(this.context, this._authentication);
  }

  /**
   * The Momoka module
   */
  get momoka(): Momoka {
    return new Momoka(this.context, this._authentication);
  }

  /**
   * The Nfts module
   */
  get nfts(): Nfts {
    return new Nfts(this.context, this._authentication);
  }

  /**
   * The Notifications module
   */
  get notifications(): Notifications {
    return new Notifications(this.context, this._authentication);
  }

  /**
   * The Poaps module
   */
  get poaps(): Poaps {
    return new Poaps(this.context, this._authentication);
  }

  /**
   * The Profile module
   */
  get profile(): Profile {
    return new Profile(this.context, this._authentication);
  }

  /**
   * The Publication module
   */
  get publication(): Publication {
    return new Publication(this.context, this._authentication);
  }

  /**
   * The Revenue module
   */
  get revenue(): Revenue {
    return new Revenue(this.context, this._authentication);
  }

  /**
   * The Search module
   */
  get search(): Search {
    return new Search(this.context, this._authentication);
  }

  /**
   * The Transaction module
   */
  get transaction(): Transaction {
    return new Transaction(this.context, this._authentication);
  }

  /**
   * The Wallet module
   */
  get wallet(): Wallet {
    return new Wallet(this.context, this._authentication);
  }
}
