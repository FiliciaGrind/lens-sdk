/*
 * @jest-environment node
 */
import { SafeApolloClient } from '@lens-protocol/api-bindings';
import {
  mockCreateUnfollowTypedDataData,
  mockCreateUnfollowTypedDataResponse,
  mockLensApolloClient,
  mockRelaySuccessFragment,
  mockUnfollowResponse,
} from '@lens-protocol/api-bindings/mocks';
import { NativeTransaction, UnsignedTransaction } from '@lens-protocol/domain/entities';
import { mockUnfollowRequest, mockWallet } from '@lens-protocol/domain/mocks';
import { ChainType } from '@lens-protocol/shared-kernel';
import { providers } from 'ethers';
import { mock } from 'jest-mock-extended';

import { UnsignedProtocolCall } from '../../../../wallet/adapters/ConcreteWallet';
import { mockIProviderFactory } from '../../../../wallet/adapters/__helpers__/mocks';
import { UnsignedContractCallTransaction } from '../../AbstractContractCallGateway';
import { assertUnsignedProtocolCallCorrectness } from '../../__helpers__/assertions';
import { mockITransactionFactory, mockJsonRpcProvider } from '../../__helpers__/mocks';
import { UnfollowProfileGateway } from '../UnfollowProfileGateway';

function setupTestScenario({
  apolloClient,
  provider = mock<providers.JsonRpcProvider>(),
}: {
  apolloClient: SafeApolloClient;
  provider?: providers.JsonRpcProvider;
}) {
  const transactionFactory = mockITransactionFactory();
  const providerFactory = mockIProviderFactory({
    chainType: ChainType.POLYGON,
    provider,
  });

  const gateway = new UnfollowProfileGateway(providerFactory, apolloClient, transactionFactory);

  return { gateway };
}

describe(`Given an instance of ${UnfollowProfileGateway.name}`, () => {
  const request = mockUnfollowRequest();

  describe(`when creating an ${UnsignedTransaction.name}<UnfollowRequest>`, () => {
    const wallet = mockWallet();
    const data = mockCreateUnfollowTypedDataData();

    it(`should succeed with the expected ${UnsignedContractCallTransaction.name}`, async () => {
      const provider = await mockJsonRpcProvider();
      const apolloClient = mockLensApolloClient([
        mockCreateUnfollowTypedDataResponse({
          variables: {
            request: {
              unfollow: [request.profileId],
            },
          },
          data,
        }),
      ]);
      const { gateway } = setupTestScenario({ apolloClient, provider });

      const unsignedTransaction = await gateway.createUnsignedTransaction(request, wallet);

      expect(unsignedTransaction).toBeInstanceOf(UnsignedContractCallTransaction);
    });
  });

  describe(`when creating an IUnsignedProtocolCall<UnfollowRequest>`, () => {
    it(`should create an instance of the ${UnsignedProtocolCall.name} with the expected typed data`, async () => {
      const data = mockCreateUnfollowTypedDataData();

      const apolloClient = mockLensApolloClient([
        mockCreateUnfollowTypedDataResponse({
          variables: {
            request: {
              unfollow: [request.profileId],
            },
          },
          data,
        }),
      ]);

      const { gateway } = setupTestScenario({ apolloClient });

      const unsignedCall = await gateway.createUnsignedProtocolCall(request);

      assertUnsignedProtocolCallCorrectness(unsignedCall, data.result);
    });
  });

  describe(`when creating a ${NativeTransaction.name}<UnfollowRequest>`, () => {
    it(`should create an instance of the ${NativeTransaction.name}`, async () => {
      const apolloClient = mockLensApolloClient([
        mockUnfollowResponse({
          variables: {
            request: {
              unfollow: [request.profileId],
            },
          },
          data: {
            result: mockRelaySuccessFragment(),
          },
        }),
      ]);
      const { gateway } = setupTestScenario({ apolloClient });

      const result = await gateway.createDelegatedTransaction(request);

      expect(result.unwrap()).toBeInstanceOf(NativeTransaction);
      expect(result.unwrap()).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          request,
        }),
      );
    });
  });
});
