const adapterPackageSources = require('./adapterPackageSources.json');

const adapterPackageNames = adapterPackageSources.packageNames;
const adapterPackageDirectoryByName = adapterPackageSources.packageDirectoryByName;
const adapterPatchSourceDescriptions = adapterPackageSources.patchSourceDescriptions;

function isAdapterPackageName(packageName) {
  return packageName in adapterPackageDirectoryByName;
}

function getAdapterPackageDirectoryName(packageName) {
  if (!isAdapterPackageName(packageName)) {
    throw new Error(`Unknown adapter package: ${packageName}`);
  }

  return adapterPackageDirectoryByName[packageName];
}

module.exports = {
  adapterPackageNames,
  adapterPackageDirectoryByName,
  adapterPatchSourceDescriptions,
  isAdapterPackageName,
  getAdapterPackageDirectoryName,
};
