import { AnyPublication, PublicationTypes, useGetPublications } from '@lens-protocol/api-bindings';
import { ProfileId, PublicationId } from '@lens-protocol/domain/entities';
import { OneOf, XOR } from '@lens-protocol/shared-kernel';

import {
  useActiveProfileAsDefaultObserver,
  useLensApolloClient,
  useMediaTransformFromConfig,
  useSourcesFromConfig,
  WithObserverIdOverride,
} from '../helpers/arguments';
import { PaginatedArgs, PaginatedReadResult, usePaginatedReadResult } from '../helpers/reads';
import { DEFAULT_PAGINATED_QUERY_LIMIT } from '../utils';
import { createPublicationMetadataFilters, PublicationMetadataFilters } from './filters';

export type UsePublicationsArgs = PaginatedArgs<
  WithObserverIdOverride<{
    metadataFilter?: PublicationMetadataFilters;
  }> &
    XOR<
      OneOf<{ profileId: ProfileId; profileIds: ProfileId[] }> & {
        publicationTypes?: PublicationTypes[];
      },
      { publicationIds: PublicationId[] }
    >
>;

/**
 * `usePublications` is a paginated hook that lets you fetch publications based on a set of filters.
 *
 * @category Publications
 * @group Hooks
 *
 * @example
 * Fetch publications by a Profile ID
 * ```tsx
 * const { data, loading, error } = usePublications({
 *   profileId: profileId('0x0635')
 * });
 * ```
 *
 * @example
 * Fetch publications by several Profile IDs
 * ```tsx
 * const { data, loading, error } = usePublications({
 *   profileIds: [ profileId('0x0635'), profileId('0x0f') ]
 * });
 * ```
 *
 * @example
 * Filter publications by type
 * ```tsx
 * const { data, loading, error } = usePublications({
 *   profileId: profileId('0x0635')
 *   publicationTypes: [ PublicationTypes.Post ]
 * });
 * ```
 */
export function usePublications({
  metadataFilter,
  observerId,
  profileId,
  profileIds,
  publicationIds,
  publicationTypes,
  limit = DEFAULT_PAGINATED_QUERY_LIMIT,
}: UsePublicationsArgs): PaginatedReadResult<AnyPublication[]> {
  return usePaginatedReadResult(
    useGetPublications(
      useLensApolloClient(
        useActiveProfileAsDefaultObserver({
          variables: useMediaTransformFromConfig(
            useSourcesFromConfig({
              limit,
              metadata: createPublicationMetadataFilters(metadataFilter),
              observerId,
              profileId,
              profileIds,
              publicationIds,
              publicationTypes,
            }),
          ),
        }),
      ),
    ),
  );
}
