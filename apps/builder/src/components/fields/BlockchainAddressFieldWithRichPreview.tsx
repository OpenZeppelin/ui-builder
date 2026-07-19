import type { FieldValues } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

import {
  AddressFieldWithResolvedPreview,
  type AddressFieldProps,
} from '@openzeppelin/ui-components';
import { ResolvedAddressFieldPreviewWithNameResolution } from '@openzeppelin/ui-renderer';
import type { AddressingCapability } from '@openzeppelin/ui-types';

type BlockchainAddressFieldWithRichPreviewProps<TFieldValues extends FieldValues> =
  AddressFieldProps<TFieldValues> & {
    networkId?: string;
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
  addressing,
  ...addressFieldProps
}: BlockchainAddressFieldWithRichPreviewProps<TFieldValues>): React.ReactElement {
  const previewAddress = useWatch({ control, name }) as string | undefined;

  return (
    <AddressFieldWithResolvedPreview<TFieldValues>
      {...addressFieldProps}
      control={control}
      name={name}
      addressing={addressing}
      previewAddress={previewAddress}
      previewNetworkId={networkId}
      preview={
        <ResolvedAddressFieldPreviewWithNameResolution
          address={previewAddress}
          networkId={networkId}
          addressing={addressing}
        />
      }
    />
  );
}
