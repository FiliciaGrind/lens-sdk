import { Quote } from '@lens-protocol/api-bindings';
import {
  InsufficientGasError,
  PendingSigningRequestError,
  PublicationId,
  UserRejectedError,
  WalletConnectionError,
} from '@lens-protocol/domain/entities';
import {
  OpenActionConfig,
  ReferencePolicyConfig,
} from '@lens-protocol/domain/use-cases/publications';
import { BroadcastingError } from '@lens-protocol/domain/use-cases/transactions';
import { invariant } from '@lens-protocol/shared-kernel';

import { SessionType, useSession } from '../authentication';
import { useDeferredTask, UseDeferredTask } from '../helpers/tasks';
import { AsyncTransactionResult } from './adapters/AsyncTransactionResult';
import { createQuoteRequest } from './adapters/schemas/builders';
import { useCreateQuoteController } from './adapters/useCreateQuoteController';

/**
 * An object representing the result of a quote creation.
 *
 * It allows to wait for the quote to be fully processed and indexed.
 */
export type QuoteAsyncResult = AsyncTransactionResult<Quote>;

/**
 * Create new quote details.
 */
export type CreateQuoteArgs = {
  /**
   * The publication ID to quote on.
   */
  quoteOn: PublicationId;
  /**
   * The metadata URI.
   */
  metadata: string;
  /**
   * The Open Actions associated with the publication.
   *
   * @defaultValue empty, no open actions
   */
  actions?: OpenActionConfig[];
  /**
   * The quote reference policy.
   *
   * Determines the criteria that must be met for a user to be able to comment, quote, or mirror the quote.
   *
   * @defaultValue `{ type: ReferencePolicyType.ANYONE }`
   */
  reference?: ReferencePolicyConfig;
  /**
   * Whether the transaction costs should be sponsored by the Lens API or
   * should be paid by the authenticated wallet.
   *
   * There are scenarios where the sponsorship will be denied regardless of this value.
   * See {@link BroadcastingError} with:
   * - {@link BroadcastingErrorReason.NOT_SPONSORED} - the profile is not sponsored
   * - {@link BroadcastingErrorReason.RATE_LIMITED} - the profile reached the rate limit
   * - {@link BroadcastingErrorReason.APP_NOT_ALLOWED} - the app is not whitelisted for gasless transactions
   *
   * @defaultValue true, the request will be attempted to be sponsored by the Lens API.
   */
  sponsored?: boolean;
};

/**
 * `useCreateQuote` is React Hook that allows you to create a new Lens Quote.
 *
 * You MUST be authenticated via {@link useLogin} to use this hook.
 *
 * @example
 * ```ts
 * const { execute, error, loading } = useCreateQuote();
 * ```
 *
 * ## Basic usage
 *
 * Create a text-only quote:
 *
 * ```tsx
 * const { execute, error, loading } = useCreateQuote();
 *
 * const quote = (content: string) => {
 *   // create the desired metadata via the `@lens-protocol/metadata` package helpers
 *   const metadata = textOnly({ content });
 *
 *   // upload the metadata to a storage provider of your choice (IPFS in this example)
 *   const uri = await uploadToIpfs(metadata);
 *
 *   // invoke the `execute` function to create the quote
 *   const result = await execute({
 *     metadata: uri,
 *     quoteOn: : publicationId, // the publication ID to quote
 *   });
 * }
 * ```
 *
 * See the [`@lens-protocol/metadata` package](https://github.com/lens-protocol/metadata) for more
 * information on how to create metadata for other types of publications.
 *
 * ## Failure scenarios
 *
 * You can handle possible failure scenarios by checking the `result` value.
 *
 * ```tsx
 * const { execute, error, loading } = useCreateQuote();
 *
 * const quote = async (content: string) => {
 *   // first part is the same as in the initial example
 *
 *   // invoke the `execute` function to create the quote
 *   const result = await execute({
 *     metadata: uri,
 *     quoteOn: : publicationId,
 *   });
 *
 *   if (result.isFailure()) {
 *     switch (result.error.name) {
 *       case 'BroadcastingError':
 *         console.log('There was an error broadcasting the transaction', error.message);
 *         break;
 *
 *       case 'PendingSigningRequestError':
 *         console.log(
 *           'There is a pending signing request in your wallet. ' +
 *             'Approve it or discard it and try again.'
 *         );
 *         break;
 *
 *       case 'WalletConnectionError':
 *         console.log('There was an error connecting to your wallet', error.message);
 *         break;
 *
 *       case 'UserRejectedError':
 *         // the user decided to not sign, usually this is silently ignored by UIs
 *         break;
 *     }
 *     return;
 *   }
 * };
 * ```
 * At this point the quote creation is completed from an end-user perspective but,
 * in case of on-chain TX, this is not necessarily mined and indexed (yet). See the following section.
 *
 * ## Wait for completion
 *
 * In case of successful submission, the `result` value can be used to wait for the quote to be fully processed.
 *
 * This gives you an opportunity to decide what UX to provide to the end-user.
 *
 * For example if the quote is on-chain it might take a while to be mined and indexed. So you might want to show a loading indicator or
 * let the user navigate away from the page.
 *
 * ```tsx
 * const { execute, error, loading } = useCreateQuote();
 *
 * const quote = async (content: string) => {
 *   // first part is the same as in the initial example
 *
 *   // invoke the `execute` function to create the quote
 *   const result = await execute({
 *     metadata: uri,
 *     quoteOn: : publicationId,
 *   });
 *
 *   if (result.isFailure()) {
 *     // handle failure scenarios
 *     return;
 *   }
 *
 *   // this might take a while, depends on the type of tx (on-chain or Momoka)
 *   // and the congestion of the network
 *   const completion = await result.value.waitForCompletion();
 *
 *   if (completion.isFailure()) {
 *     console.log('There was an processing the transaction', completion.error.message);
 *     return;
 *   }
 *
 *   // the quote is now ready to be used
 *   const quote = completion.value;
 *   console.log('quote created', quote);
 * };
 * ```
 *
 * ## Open actions
 *
 * Contextually to the quote creation you can configure the open actions.
 *
 * As with anything involving amounts in the Lens SDK you can use the
 * {@link Amount} helper with currencies from the {@link useCurrencies} hook to
 * create the desired amounts.
 *
 * Create a quote with a `SimpleCollectOpenAction` module:
 * ```tsx
 * const wmatic = ... // from useCurrencies hook
 *
 * const result = await execute({
 *   metadata: uri,
 *   actions: [
 *     {
 *       type: OpenActionType.SIMPLE_COLLECT,
 *       amount: Amount.erc20(wmatic, 100), // 100 WMATIC
 *       followerOnly: true,
 *       collectLimit: 10,
 *       recipient: '0x4f94FAFEE38F545920485fC747467EFc85C302E0',
 *       endsAt: new Date('2025-12-31T00:00:00.000Z'),
 *     }
 *   ]
 * });
 * ```
 * See {@link SimpleCollectActionConfig} for more details.
 *
 * Create a quote with a `MultirecipientCollectOpenAction` module:
 * ```tsx
 * const wmatic = ... // from useCurrencies hook
 *
 * const result = await execute({
 *   metadata: uri,
 *   quoteOn: : publicationId,
 *   actions: [
 *     {
 *       type: OpenActionType.MULTIRECIPIENT_COLLECT,
 *       amount: Amount.erc20(wmatic, 100), // 100 WMATIC
 *       followerOnly: true,
 *       collectLimit: 10,
 *       recipients: [
 *         {
 *           recipient: '0x4f94FAFEE38F545920485fC747467EFc85C302E0',
 *           split: 30, // 30%
 *         },
 *         {
 *           recipient: '0x097A4fE5cfFf0360438990b88549d4288748f6cB',
 *           split: 70, // 70%
 *         },
 *       ],
 *       endsAt: new Date('2025-12-31T00:00:00.000Z'),
 *     }
 *   ]
 * });
 * ```
 *
 * See {@link MultirecipientCollectActionConfig} for more details.
 *
 * Finally you can also create a quote with a custom open action (AKA unknown open action):
 *
 * ```tsx
 * const result = await execute({
 *   metadata: uri,
 *   quoteOn: : publicationId,
 *   actions: [
 *     {
 *       type: OpenActionType.UNKNOWN_OPEN_ACTION,
 *       address: '0x4f94FAFEE38F545920485fC747467EFc85C302E0',
 *       data: '0x.....'
 *     }
 *   ]
 * });
 * ```
 *
 * See {@link UnknownOpenActionConfig} for more details.
 *
 * ## Reference policy
 *
 * Contextually to the quote creation you can configure the reference policy.
 *
 * A quote with reference policy other than `ANYONE` will be hosted on-chain.
 * If the quote has reference policy `ANYONE` (which is also the default value) and does not have
 * any open actions, it will be hosted on Momoka.
 *
 * No one can comment, quote, or mirror the quote:
 * ```tsx
 * const result = await execute({
 *   metadata: uri,
 *   quoteOn: : publicationId,
 *   reference: {
 *     type: ReferencePolicyType.NO_ONE
 *   }
 * });
 * ```
 *
 * Only followers can comment, quote, or mirror the quote:
 * ```tsx
 * const result = await execute({
 *   metadata: uri,
 *   quoteOn: : publicationId,
 *   reference: {
 *     type: ReferencePolicyType.FOLLOWERS_ONLY
 *   }
 * });
 * ```
 *
 * You can have finer control over who can comment, quote, or mirror the quote by using the `DEGREES_OF_SEPARATION` reference policy:
 * ```tsx
 * const result = await execute({
 *   metadata: uri,
 *   quoteOn: : publicationId,
 *   reference: {
 *     type: ReferencePolicyType.DEGREES_OF_SEPARATION,
 *     params: {
 *       degreesOfSeparation: 2, // followers and followers of your followers
 *       commentsRestricted: true, // can comment
 *       mirrorsRestricted: true, // can mirror
 *       quotesRestricted: false, // cannot quote
 *     }
 *   }
 * });
 * ```
 *
 * You can even set the `DEGREES_OF_SEPARATION` reference policy to follow someone elses graph:
 * ```tsx
 * const result = await execute({
 *   metadata: uri,
 *   quoteOn: : publicationId,
 *   reference: {
 *     type: ReferencePolicyType.DEGREES_OF_SEPARATION,
 *     params: {
 *       degreesOfSeparation: 2, // followers and followers of your followers
 *       commentsRestricted: true, // can comment
 *       mirrorsRestricted: true, // can mirror
 *       quotesRestricted: false, // cannot quote
 *
 *       sourceProfileId: '0x01', // in relation to Profile Id 0x01
 *     }
 *   }
 * });
 * ```
 *
 * See {@link DegreesOfSeparationReferencePolicyConfig} for more details.
 *
 * ## Self-funded approach
 *
 * In case you want to pay for the transaction gas costs yourself, you can do so by setting the
 * `sponsored` parameter to `false`:
 *
 * ```ts
 * const quote = async (content: string) => {
 *   // create and upload metadata as before
 *
 *   const result = await execute({
 *     metadata: uri,
 *     quoteOn: : publicationId,
 *     sponsored: false,
 *   });
 *
 *   if (result.isFailure()) {
 *     switch (result.error.name) {
 *       case 'InsufficientGasError':
 *         console.log('You do not have enough funds to pay for the transaction cost.');
 *         break;
 *
 *       // ...
 *     }
 *     return;
 *   }
 *
 *   // ...
 * }
 * ```
 *
 * The example above shows how to detect when the user does not have enough funds to pay for the transaction cost.
 *
 * ## Self-funded fallback
 *
 * If for some reason the Lens API cannot sponsor the transaction, the hook will fail with a {@link BroadcastingError} with one of the following reasons:
 * - {@link BroadcastingErrorReason.NOT_SPONSORED} - the profile is not sponsored
 * - {@link BroadcastingErrorReason.RATE_LIMITED} - the profile reached the rate limit
 * - {@link BroadcastingErrorReason.APP_NOT_ALLOWED} - the app is not whitelisted for gasless transactions
 *
 * In those cases you can retry the transaction as self-funded like in the following example:
 *
 * ```ts
 * const quote = async (content: string) => {
 *   // create and upload metadata as before
 *
 *   const sponsoredResult = await execute({
 *     metadata: uri,
 *     quoteOn: : publicationId,
 *   });
 *
 *   if (sponsoredResult.isFailure()) {
 *     switch (sponsoredResult.error.name) {
 *       case 'BroadcastingError':
 *         if ([BroadcastingErrorReason.NOT_SPONSORED, BroadcastingErrorReason.RATE_LIMITED].includes(sponsoredResult.error.reason)) {
 *
 *           const chargedResult = = await execute({
 *             metadata: uri,
 *             quoteOn: : publicationId,
 *             sponsored: false,
 *           });
 *
 *           // continue with chargedResult as in the previous example
 *         }
 *         break;
 *
 *      // ...
 *   }
 * }
 * ```
 *
 * We omitted the handling of the {@link BroadcastingErrorReason.APP_NOT_ALLOWED} error because it's usually
 * something that builder will face when deploying their app to production using the Production Lens API.
 *
 * It just requires the app to apply for whitelisting. See https://docs.lens.xyz/docs/gasless-and-signless#whitelisting-your-app.
 *
 * ## Create an app-specific quote
 *
 * You can create a comment that is specific to an app by defining the `appId` when creating the comment metadata.
 *
 * This allows apps to build custom experiences by only surfacing publications that were created in their app.
 *
 * ```tsx
 * const metadata = textOnly({
 *  content: 'Quote content',
 *  appId: 'my-app-id',
 * });
 *
 * const uri = await uploadToIpfs(metadata);
 *
 * const result = await execute({
 *  quoteOn: publicationId, // the publication ID to quote
 *  metadata: uri
 * });
 * ```
 *
 * ## Momoka quotes
 *
 * For a quote to be hosted on Momoka it must meet the following criteria:
 * - it must be a quote of a Momoka publication
 * - reference policy `ANYONE` (which is also the default value in case it's not specified)
 * - no open actions
 * - sponsored by the Lens API (which is also the default value in case it's not specified)
 *
 * If the quote does not meet the above criteria, it will be hosted on-chain.
 *
 * @category Publications
 * @group Hooks
 */
export function useCreateQuote(): UseDeferredTask<
  QuoteAsyncResult,
  | BroadcastingError
  | InsufficientGasError
  | PendingSigningRequestError
  | UserRejectedError
  | WalletConnectionError,
  CreateQuoteArgs
> {
  const { data: session } = useSession();
  const createQuote = useCreateQuoteController();

  return useDeferredTask(async (args: CreateQuoteArgs) => {
    invariant(
      session?.authenticated,
      'You must be authenticated to create a quote. Use `useLogin` hook to authenticate.',
    );
    invariant(
      session.type === SessionType.WithProfile,
      'You must have a profile to create a quote.',
    );

    const request = createQuoteRequest({
      signless: session.profile.signless,
      sponsored: args.sponsored ?? true,
      ...args,
    });

    return createQuote(request);
  });
}
