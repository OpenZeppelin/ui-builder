import adapterPackageSources from './adapterPackageSources.json';

type AdapterPackageDirectoryByName = typeof adapterPackageSources.packageDirectoryByName;

export type AdapterPackageName = keyof AdapterPackageDirectoryByName;

export const adapterPackageNames = adapterPackageSources.packageNames as AdapterPackageName[];

export const adapterPackageDirectoryByName =
  adapterPackageSources.packageDirectoryByName as AdapterPackageDirectoryByName;

export const adapterPatchSourceDescriptions = adapterPackageSources.patchSourceDescriptions;

export function isAdapterPackageName(packageName: string): packageName is AdapterPackageName {
  return packageName in adapterPackageDirectoryByName;
}

export function getAdapterPackageDirectoryName(packageName: string): string {
  if (!isAdapterPackageName(packageName)) {
    throw new Error(`Unknown adapter package: ${packageName}`);
  }

  return adapterPackageDirectoryByName[packageName];
}
