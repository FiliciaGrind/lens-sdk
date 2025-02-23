import { GetSnapshotProposalDocument, SnapshotProposal } from '../generated';

export function mockGetSnapshotProposalDataResponse({ proposal }: { proposal: SnapshotProposal }) {
  return {
    request: {
      query: GetSnapshotProposalDocument,
      variables: {
        proposalId: proposal.id,
        spaceId: proposal.space?.id,
        includeVotes: false,
        voterAddress: '0x000',
      },
    },
    result: {
      data: {
        proposal,
      },
    },
  };
}
