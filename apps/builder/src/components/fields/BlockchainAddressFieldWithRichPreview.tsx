import type { FieldValues } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

import {
  AddressFieldWithResolvedPreview,
  type AddressFieldProps,
} from '@openzeppelin/ui-components';
import { ResolvedAddressFieldPreviewWithNameResolution } from '@openzeppelin/ui-renderer';
import type { AddressingCapability, NetworkConfig } from '@openzeppelin/ui-types';

type BlockchainAddressFieldWithRichPreviewProps<TFieldValues extends FieldValues> =
  AddressFieldProps<TFieldValues> & {
    /** Wallet-global network id (builder surfaces always use the active runtime). */
    networkId?: string;
    /**
     * When set, reverse preview resolves against this network's runtime instead of
     * the wallet-global active network. Unused today — builder has no per-field
     * network selector; reserved for future dialogs with their own network dropdown.
     */
    network?: NetworkConfig;
    addressing?: AddressingCapability;
  };

/**
 * Pattern A (wallet-runtime): AddressFieldWithResolvedPreview + renderer bridge for
 * async reverse ENS lookup. Parent watches the field and passes previewAddress.
 */
export function BlockchainAddressFieldWithRichPreview<TFieldValues extends FieldValues>({
  control,
  name,
  networkId,
  network,
  addressing,
  ...addressFieldProps
}: BlockchainAddressFieldWithRichPreviewProps<TFieldValues>): React.ReactElement {
  const previewAddress = useWatch({ control, name }) as string | undefined;
  const previewNetworkId = network?.id ?? networkId;

  return (
    <AddressFieldWithResolvedPreview<TFieldValues>
      {...addressFieldProps}
      control={control}
      name={name}
      addressing={addressing}
      previewAddress={previewAddress}
      previewNetworkId={previewNetworkId}
      preview={
        <ResolvedAddressFieldPreviewWithNameResolution
          address={previewAddress}
          networkId={previewNetworkId}
          network={network}
          addressing={addressing}
        />
      }
    />
  );
}
