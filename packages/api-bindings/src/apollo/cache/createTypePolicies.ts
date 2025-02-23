import { FieldPolicy, TypePolicy } from '@apollo/client';

import { StrictTypedTypePolicies } from '../../lens';
import { createQueryParamsLocalFields, QueryParams } from './createQueryParamsLocalFields';
import {
  createExploreProfilesFieldPolicy,
  createExplorePublicationsFieldPolicy,
  createFeedFieldPolicy,
  createFeedHighlightsFieldPolicy,
  createFollowersFieldPolicy,
  createFollowingFieldPolicy,
  createMutualFollowersFieldPolicy,
  createProfileActionHistoryFieldPolicy,
  createProfileRecommendationsFieldPolicy,
  createProfilesFieldPolicy,
  createPublicationFieldPolicy,
  createPublicationsFieldPolicy,
  createSearchProfilesFieldPolicy,
  createSearchPublicationsFieldPolicy,
  createWhoActedOnPublicationFieldPolicy,
  createWhoReactedPublicationFieldPolicy,
} from './field-policies';
import {
  createPrimaryPublicationTypePolicy,
  createProfileOperationsTypePolicy,
  createProfileStatsTypePolicy,
  createProfileTypePolicy,
  createPublicationOperationsTypePolicy,
  createPublicationStatsTypePolicy,
  createPublicationTypePolicy,
  notNormalizedType,
} from './type-policies';

type InheritedTypePolicies = {
  AnyPublication: TypePolicy;
  PublicationMetadata: TypePolicy;
  FeedHighlight: TypePolicy;
};

export function createTypePolicies(
  params?: QueryParams,
): StrictTypedTypePolicies & InheritedTypePolicies {
  return {
    AnyPublication: createPublicationTypePolicy(),
    FeedHighlight: createPublicationTypePolicy(),
    Post: createPrimaryPublicationTypePolicy(),
    Comment: createPrimaryPublicationTypePolicy(),
    Quote: createPrimaryPublicationTypePolicy(),
    PublicationMetadata: notNormalizedType(),
    PublicationStats: createPublicationStatsTypePolicy(),
    PublicationOperations: createPublicationOperationsTypePolicy(),

    Profile: createProfileTypePolicy(),
    ProfileStats: createProfileStatsTypePolicy(),
    ProfileOperations: createProfileOperationsTypePolicy(),

    FeedItem: notNormalizedType(),
    PaginatedResultInfo: notNormalizedType(),

    Query: {
      fields: {
        exploreProfiles: createExploreProfilesFieldPolicy(),
        explorePublications: createExplorePublicationsFieldPolicy(),
        feed: createFeedFieldPolicy(),
        feedHighlights: createFeedHighlightsFieldPolicy(),
        followers: createFollowersFieldPolicy(),
        following: createFollowingFieldPolicy(),
        mutualFollowers: createMutualFollowersFieldPolicy(),
        profileActionHistory: createProfileActionHistoryFieldPolicy(),
        profileRecommendations: createProfileRecommendationsFieldPolicy(),
        profiles: createProfilesFieldPolicy(),
        publication: createPublicationFieldPolicy() as FieldPolicy<unknown>,
        publications: createPublicationsFieldPolicy(),
        searchProfiles: createSearchProfilesFieldPolicy(),
        searchPublications: createSearchPublicationsFieldPolicy(),
        whoActedOnPublication: createWhoActedOnPublicationFieldPolicy(),
        whoReactedPublication: createWhoReactedPublicationFieldPolicy(),

        ...createQueryParamsLocalFields(params),
      },
    },
  };
}
