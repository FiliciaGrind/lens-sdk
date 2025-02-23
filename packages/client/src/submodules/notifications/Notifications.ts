import type { PromiseResult } from '@lens-protocol/shared-kernel';

import type { Authentication } from '../../authentication';
import { LensContext } from '../../context';
import type { CredentialsExpiredError, NotAuthenticatedError } from '../../errors';
import { FetchGraphQLClient } from '../../graphql/FetchGraphQLClient';
import type { NotificationRequest } from '../../graphql/types.generated';
import {
  PaginatedResult,
  buildRequestFromConfig,
  buildPaginatedQueryResult,
  requireAuthHeaders,
  sdkAuthHeaderWrapper,
} from '../../helpers';
import {
  ActedNotificationFragment,
  CommentNotificationFragment,
  FollowNotificationFragment,
  getSdk,
  MentionNotificationFragment,
  MirrorNotificationFragment,
  QuoteNotificationFragment,
  ReactionNotificationFragment,
  Sdk,
} from './graphql/notifications.generated';

export type NotificationFragment =
  | ActedNotificationFragment
  | CommentNotificationFragment
  | FollowNotificationFragment
  | MentionNotificationFragment
  | MirrorNotificationFragment
  | QuoteNotificationFragment
  | ReactionNotificationFragment
  | Record<string, never>;

/**
 * Notifications on many activities for a profile.
 *
 * @group LensClient Modules
 */
export class Notifications {
  private readonly authentication: Authentication | undefined;
  private readonly sdk: Sdk;

  constructor(
    private readonly context: LensContext,
    authentication: Authentication,
  ) {
    const client = new FetchGraphQLClient(context);

    this.sdk = getSdk(client, sdkAuthHeaderWrapper(authentication));
    this.authentication = authentication;
  }

  /**
   * Fetch notifications.
   *
   * ⚠️ Requires authenticated LensClient.
   *
   * @param request - Request object for the query
   * @returns Array of notifications wrapped in {@link PaginatedResult}
   *
   * @example
   * ```ts
   * const result = await client.notifications.fetch();
   * ```
   */
  async fetch(
    request: NotificationRequest = {},
  ): PromiseResult<
    PaginatedResult<NotificationFragment>,
    CredentialsExpiredError | NotAuthenticatedError
  > {
    return requireAuthHeaders(this.authentication, async (headers) => {
      return buildPaginatedQueryResult(async (currRequest) => {
        const result = await this.sdk.Notifications(
          {
            request: currRequest,
            ...buildRequestFromConfig(this.context),
          },
          headers,
        );

        return result.data.result;
      }, request);
    });
  }
}
