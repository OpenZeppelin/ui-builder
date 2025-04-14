# [1.1.0](https://github.com/OpenZeppelin/transaction-form-builder/compare/v1.0.4...v1.1.0) (2025-04-14)


### Bug Fixes

* **config:** add structuredClone polyfill for ESLint compatibility ([0e144b8](https://github.com/OpenZeppelin/transaction-form-builder/commit/0e144b8032c105af3b28c8fb1ae6cc622a947ec8))
* **config:** add structuredClone polyfill for ESLint compatibility with Node.js 16 ([08a15a7](https://github.com/OpenZeppelin/transaction-form-builder/commit/08a15a7f15be78c7c8d9fd5532dc0096ba2e7bfb))
* **config:** align pre-commit hook with fix-all command for consistent import sorting ([763de7d](https://github.com/OpenZeppelin/transaction-form-builder/commit/763de7dfce7c9f70922755fd9469f18b4c03521f))
* **config:** allow empty commits in pre-commit hook ([b0e634e](https://github.com/OpenZeppelin/transaction-form-builder/commit/b0e634ebd52b9e474e9e060c190820f84dfc2084))
* **config:** centralized symlinked monorepo config system ([0a6b358](https://github.com/OpenZeppelin/transaction-form-builder/commit/0a6b3588e23c71bbe35a249ac19c8c58a691fc93))
* **config:** fix TypeScript configuration for monorepo packages ([9344405](https://github.com/OpenZeppelin/transaction-form-builder/commit/93444058957bcf52b26abaf376affcc916a8d416))
* **config:** import sorting conflicts ([7ef9216](https://github.com/OpenZeppelin/transaction-form-builder/commit/7ef9216e80b730d08e0544bf7498a122d4a8aa5e))
* **config:** improve pre-push hook Node.js version handling ([e434a0c](https://github.com/OpenZeppelin/transaction-form-builder/commit/e434a0c623020362dfa0875527bc99924185024f))
* **config:** prevent custom ESLint plugin from loading multiple times ([1e8a161](https://github.com/OpenZeppelin/transaction-form-builder/commit/1e8a161eaee634604e25c412a17ac20b71429985))
* **config:** prevent custom ESLint plugin from loading multiple times ([d69303e](https://github.com/OpenZeppelin/transaction-form-builder/commit/d69303eef0859cd76e73fc9dfdaff7f9ca66ff58))
* **config:** resolve ESLint issues across packages ([78a2216](https://github.com/OpenZeppelin/transaction-form-builder/commit/78a2216cc5579ce5782b3268c2dd77a794fa932d))
* **config:** resolve monorepo build and CLI export issues ([45b3a25](https://github.com/OpenZeppelin/transaction-form-builder/commit/45b3a2578d6e2145f5d6f10508df6e55782e5f1b))
* **config:** resolve TS build errors and remove [@form-renderer](https://github.com/form-renderer) alias ([fc5642f](https://github.com/OpenZeppelin/transaction-form-builder/commit/fc5642f786a1c7fc635933fa7a2967d82b846def))
* **config:** resolve unused variable handling across packages ([24c504c](https://github.com/OpenZeppelin/transaction-form-builder/commit/24c504ca21e0d1d802bdcac6e466575b7e35f47f))
* **config:** set emitDeclarationOnly to true in core package tsconfig ([61308bd](https://github.com/OpenZeppelin/transaction-form-builder/commit/61308bddb76bd1293e610dae5b98e3a26ebfcae9))
* **config:** simplify lint-staged configuration for consistent import sorting ([688c587](https://github.com/OpenZeppelin/transaction-form-builder/commit/688c587ccfe41732fc863ef776a825434d8b8191))
* **config:** simplify pre-commit flow to use fix-all command directly ([6e44a24](https://github.com/OpenZeppelin/transaction-form-builder/commit/6e44a244d766ca677a638309e8a99b572e061e60))
* **config:** simplify pre-commit hook to align with import sorting ([44e0d82](https://github.com/OpenZeppelin/transaction-form-builder/commit/44e0d827375684c626c64a65ba29f1558ad5fada))
* **config:** unify vite versions to prevent build failures ([7c0dfb9](https://github.com/OpenZeppelin/transaction-form-builder/commit/7c0dfb91b2b9ff1106e661a3a66d8ffc3909d52d))
* **config:** update build script to use emptyOutDir flag ([ecc6aeb](https://github.com/OpenZeppelin/transaction-form-builder/commit/ecc6aeb42bacdc92c5dc5d318323d5da7fa60feb))
* **config:** update ESLint config for v9 compatibility ([dfdadfc](https://github.com/OpenZeppelin/transaction-form-builder/commit/dfdadfc9bc6114c9aeb2f08d956066b0e9bf8d7c))
* **config:** update pre-push hook to use Node.js 20 ([6bffac9](https://github.com/OpenZeppelin/transaction-form-builder/commit/6bffac966124f2d981458a32fa91c8e28a40b586))
* **config:** update Tailwind CSS v4 import syntax in form-renderer demo ([edf6818](https://github.com/OpenZeppelin/transaction-form-builder/commit/edf6818d4f7d4c884b6251d0b5581dfc5f06c61c))
* **config:** update TypeScript configuration to support JSON imports and TS extensions ([b01ae52](https://github.com/OpenZeppelin/transaction-form-builder/commit/b01ae522c144aa93d474a5a664e92ab9d7b022bb))
* **config:** use NVM-managed Node.js in pre-push hook if available ([a3d1dfa](https://github.com/OpenZeppelin/transaction-form-builder/commit/a3d1dfab173efc59f588ad8185a1010653ac05f8))
* **core:** add basic test and fix package exports order ([c439522](https://github.com/OpenZeppelin/transaction-form-builder/commit/c4395226c1623d64ee92961731432c6eb8b12592))
* **core:** add tsconfig to export template dir ([9ddef53](https://github.com/OpenZeppelin/transaction-form-builder/commit/9ddef53d00822ce470c1b1db0e9ea60255fcbf54))
* **core:** build issues ([f999082](https://github.com/OpenZeppelin/transaction-form-builder/commit/f999082577f80b6b2f1ef53537ff6ee7a43895cf))
* **core:** comprehensive ESLint config fix to handle all file types properly ([46be8ca](https://github.com/OpenZeppelin/transaction-form-builder/commit/46be8ca050907988b913887e4c5625cbad10d4a6))
* **core:** disable read-only checkbox when hardcoded value invalid ([d923264](https://github.com/OpenZeppelin/transaction-form-builder/commit/d92326430505b59fca2a7f47f36fc660ec49714c))
* **core:** failing tests ([e566e73](https://github.com/OpenZeppelin/transaction-form-builder/commit/e566e730c4c5ad2cd138e700862b88d8d79ef769))
* **core:** form render config import ([8118094](https://github.com/OpenZeppelin/transaction-form-builder/commit/811809412b869877faf58cc5cf1e5b51b6e50be8))
* **core:** format check failure ([7e0f9db](https://github.com/OpenZeppelin/transaction-form-builder/commit/7e0f9dba023629532af2d1dfa2610069f0d57759))
* **core:** imports ([99f3361](https://github.com/OpenZeppelin/transaction-form-builder/commit/99f33611e9f030d3c9344c306757b3782622f122))
* **core:** improve adapter export ([a5f1d66](https://github.com/OpenZeppelin/transaction-form-builder/commit/a5f1d6675c0a7f4abe2e7af030ae42b42879a5c2))
* **core:** improve template comment removal to preserve intended spacing ([8c1d4ca](https://github.com/OpenZeppelin/transaction-form-builder/commit/8c1d4cabceffcbdf1c36175c5495dc60825d60ae))
* **core:** improve the export location and the CLI ([ac7e026](https://github.com/OpenZeppelin/transaction-form-builder/commit/ac7e026037b5dfc151cfe57066aba65aff534aed))
* **core:** lint issue ([06cb52a](https://github.com/OpenZeppelin/transaction-form-builder/commit/06cb52a1671678dcbf4cfb896150bcd3886e1e79))
* **core:** lint issues ([95c606e](https://github.com/OpenZeppelin/transaction-form-builder/commit/95c606e4845a72f9bf02d89e3e80bbf554bae523))
* **core:** move missing files to internal template dir ([84a6494](https://github.com/OpenZeppelin/transaction-form-builder/commit/84a64943cf5a5cb62361ab2d6935ce388a4db401))
* **core:** postcss config in template ([ced3bdd](https://github.com/OpenZeppelin/transaction-form-builder/commit/ced3bddd990ce0f3bf4df4de69ba3f99aa4c39f3))
* **core:** properly map array types to textarea field type in EVMAdapter ([ac135a7](https://github.com/OpenZeppelin/transaction-form-builder/commit/ac135a7a10c43d08fba2061eaf068fb94ece101d))
* **core:** remove adapter files when includeAdapters is false ([087194b](https://github.com/OpenZeppelin/transaction-form-builder/commit/087194b1826284ae4b6300f168f7805ca21201fc))
* **core:** remove unused imports ([f1dcf35](https://github.com/OpenZeppelin/transaction-form-builder/commit/f1dcf354770d0690d9e6485d74620c226d6b0b2d))
* **core:** resolve build errors in execution method step integration ([b3978b8](https://github.com/OpenZeppelin/transaction-form-builder/commit/b3978b83236fd5fff57c2255511935ce1e602175))
* **core:** resolve build issues with TypeScript compilation ([9dba80c](https://github.com/OpenZeppelin/transaction-form-builder/commit/9dba80cc03aa6e909bf3601d6e04c86a15d930a2))
* **core:** resolve linter warnings in logger and tests ([8a81bc4](https://github.com/OpenZeppelin/transaction-form-builder/commit/8a81bc4fe4915af0cc28d7ce196aabf49487ef67))
* **core:** resolve TypeScript errors in FormPreview component ([991da5f](https://github.com/OpenZeppelin/transaction-form-builder/commit/991da5f462a1feda5297b9ddbb385ddb67a7fe29))
* **core:** resolve TypeScript naming conflicts and lint errors ([cfe554c](https://github.com/OpenZeppelin/transaction-form-builder/commit/cfe554cd5e337824eef9db4df27905531d26255b))
* **core:** resolve unhandled promise errors in components ([b8e0e66](https://github.com/OpenZeppelin/transaction-form-builder/commit/b8e0e6699f9e251f78187482cb8922b845abd5da))
* **core:** resolve Vite dynamic import warning in MockContractService ([2da4f9c](https://github.com/OpenZeppelin/transaction-form-builder/commit/2da4f9c3438eddaa32a3e2d3363d900bf896b2f7))
* **core:** tailwind postcss plugin in template ([36059d2](https://github.com/OpenZeppelin/transaction-form-builder/commit/36059d24b830295d998056adeb1cdcf74355e326))
* **core:** tests ([40fb79c](https://github.com/OpenZeppelin/transaction-form-builder/commit/40fb79c8a89b3e212e6fc519d091fb31026b8820))
* **core:** update ESLint config to handle test and story files without project refs ([edcf66e](https://github.com/OpenZeppelin/transaction-form-builder/commit/edcf66e7647c3a0dc676d4754bf8df35e7ecb16c))
* **core:** update ESLint config to use negated patterns instead of excludedFiles ([bf0a0d2](https://github.com/OpenZeppelin/transaction-form-builder/commit/bf0a0d2bdbe7a39b355dda45bac4e5202eb07828))
* **core:** virtual module use in tests and extensibility ([403f5b9](https://github.com/OpenZeppelin/transaction-form-builder/commit/403f5b94cda6a9fe9adb35ce9e873183eb2e2a08))
* **export:** add conditional tailwind source for cli exports ([a4954ef](https://github.com/OpenZeppelin/transaction-form-builder/commit/a4954ef353bb075c1bae18bea9f13d1799e77784))
* **export:** correct CLI path resolution and dependency versioning ([b5fcac1](https://github.com/OpenZeppelin/transaction-form-builder/commit/b5fcac1c33a8123b42941214a7ccc52e59ca4d54))
* **export:** correct global.css import path in template ([779a287](https://github.com/OpenZeppelin/transaction-form-builder/commit/779a287aa05869eb92622f7a0a1f27361ce0f3b6))
* **export:** ensure all styles apply in exported apps & core dev ([96ad1f7](https://github.com/OpenZeppelin/transaction-form-builder/commit/96ad1f7b0e17b721579f67edfb0692441408e27c))
* **export:** export testing actions ([bade0dc](https://github.com/OpenZeppelin/transaction-form-builder/commit/bade0dc20a5b8168f16b276b61e19c9dacaa7217))
* **export:** prevent tailwind classes purge ([44b7629](https://github.com/OpenZeppelin/transaction-form-builder/commit/44b7629aae5a3c9725eff2d1817d641749a0dc56))
* **export:** remove ransaction-form-renderer css import ([f6c7fb4](https://github.com/OpenZeppelin/transaction-form-builder/commit/f6c7fb4a9fe4d22830befd694cb4d437ecb36a2c))
* **export:** use production flag in ui export ([1b90377](https://github.com/OpenZeppelin/transaction-form-builder/commit/1b90377deedc54d6cfb09001428743fb45ecba9b))
* **form-renderer:** improve build system and enable CI/CD workflow ([553ddc9](https://github.com/OpenZeppelin/transaction-form-builder/commit/553ddc91f3723f7db4ab2551ee2ad09ed709c33b))
* **form:** add explicit return types to resolve typescript warnings ([b182979](https://github.com/OpenZeppelin/transaction-form-builder/commit/b182979b250a76cbfec9f3b32939b59bc65049bb))
* **form:** add proper type annotations in components ([b2b26ee](https://github.com/OpenZeppelin/transaction-form-builder/commit/b2b26ee79194efc642c97452eca43b141b83b298))
* **form:** add return type to SelectField handleValueChange function ([f9cb35a](https://github.com/OpenZeppelin/transaction-form-builder/commit/f9cb35ad17a14f27d0e561630c57245429c66117))
* **form:** ensure tsc emits files in build script ([2b23bc5](https://github.com/OpenZeppelin/transaction-form-builder/commit/2b23bc5fb3124cee738d91c2d21890e33e5cad8a))
* **form:** fix form validation display and field mapping ([e38f494](https://github.com/OpenZeppelin/transaction-form-builder/commit/e38f494d0fa603090b99198a009a22d25d235f2a))
* **form:** fix import sorting in field components ([fb13924](https://github.com/OpenZeppelin/transaction-form-builder/commit/fb13924c1ac2dcdbe844e7a26582df83e102df8f))
* **form:** missing dependencie ([4cd06c4](https://github.com/OpenZeppelin/transaction-form-builder/commit/4cd06c4c98338ad78da69171b42ea55a4a3ea511))
* **form:** resolve linting warnings in button components ([ce49b66](https://github.com/OpenZeppelin/transaction-form-builder/commit/ce49b66a0db8a3ba78d36bd305162711921a7a38))
* **form:** sort imports ([329e19a](https://github.com/OpenZeppelin/transaction-form-builder/commit/329e19a99a8e91f9fc2275694c6a83dd50d62a45))
* **form:** unify label spacing ([4ac9292](https://github.com/OpenZeppelin/transaction-form-builder/commit/4ac9292be15952d566cbf81926fdf436f58ee812))
* **form:** update form field components ([a5d4d0a](https://github.com/OpenZeppelin/transaction-form-builder/commit/a5d4d0ab10511837d6a7e52c23d2b1534cd673e3))
* resolve linting issues in adapter files and components ([c94764d](https://github.com/OpenZeppelin/transaction-form-builder/commit/c94764d7910f5e83e0b29ae4ac000994d37a77af))
* **tests:** adjust tests for new logger and formatting ([dd7e968](https://github.com/OpenZeppelin/transaction-form-builder/commit/dd7e968d92158b854b73e618ca8b58fa95eb0580))
* **ui:** fix chain selection tracking without changing styling ([4e26dd0](https://github.com/OpenZeppelin/transaction-form-builder/commit/4e26dd028070fc1ed0fba8a82f3271da18c75324))
* **ui:** imports in css should be above all ([823c8ea](https://github.com/OpenZeppelin/transaction-form-builder/commit/823c8ea2d51517fcdf79066db177ae7296042888))
* **ui:** reduce steps title size to fit ([3889a13](https://github.com/OpenZeppelin/transaction-form-builder/commit/3889a1346ecc241679d73948dc32314d07273a26))
* **ui:** remove peer utilities for Tailwind v4 compatibility ([accd60a](https://github.com/OpenZeppelin/transaction-form-builder/commit/accd60aa22adf9d3454a06094b235a7123fddfda))
* **ui:** remove timestamp from generated data-slot styles ([4d6e8be](https://github.com/OpenZeppelin/transaction-form-builder/commit/4d6e8be4ba7eea2a8e33f387d7eb638912ee6822))
* **ui:** replace deprecated React.ElementRef with HTML element types ([4d51532](https://github.com/OpenZeppelin/transaction-form-builder/commit/4d51532d43a61b25a3df195a2f5c88c2e727e32f))
* **ui:** restructure monorepo CSS architecture to prevent duplication ([795f933](https://github.com/OpenZeppelin/transaction-form-builder/commit/795f933eeff44c86fd2fe207af8a1c970605b7b8))
* **ui:** storybook and add select group field ([ee0122d](https://github.com/OpenZeppelin/transaction-form-builder/commit/ee0122da6c1ee9fb027bff42423be0a74d5f7ab5))
* **ui:** update FieldEditor state on prop change ([95bc7ca](https://github.com/OpenZeppelin/transaction-form-builder/commit/95bc7cacbdb1d6e21ea1aac2f7cf650583c39f9b))
* **ui:** update StepChainSelect to use useEffect for tracking selections ([504827c](https://github.com/OpenZeppelin/transaction-form-builder/commit/504827c5327d9a6fe27df816439f63be8b5d92a6))
* **ui:** update styles tsconfig for TypeScript references ([1e05623](https://github.com/OpenZeppelin/transaction-form-builder/commit/1e0562331c2c497a6a9f6efd074018d776b0f67f))
* **ui:** use data-slot to extract size-3.5 in checkbox ([3c4f8f4](https://github.com/OpenZeppelin/transaction-form-builder/commit/3c4f8f4507b3795290df5103d3c61b6fb7156a8c))
* **utils:** replace any type with unknown in formUtils ([5a98841](https://github.com/OpenZeppelin/transaction-form-builder/commit/5a988416abf78b163c41dffab54dd8b0be62d8b6))
* **utils:** replace any type with unknown in transforms.ts ([7b5f342](https://github.com/OpenZeppelin/transaction-form-builder/commit/7b5f342ceb263e0db0d475d935c3cffaddb7ddcf))


### Features

* **config:** add ESLint config and dev environment for form-renderer package ([232cf61](https://github.com/OpenZeppelin/transaction-form-builder/commit/232cf61075b5c75b5becb273b5ad88677aa976bf))
* **config:** add export to commit scope ([cf83ddc](https://github.com/OpenZeppelin/transaction-form-builder/commit/cf83ddc2168c577d54e078c21d56d9552cd01356))
* **config:** add package configuration files for monorepo packages ([844eb0f](https://github.com/OpenZeppelin/transaction-form-builder/commit/844eb0f8114f23a688cac78e3cf7a0939fc2c1ff))
* **config:** add publish workflow for form-renderer package ([71a6ea6](https://github.com/OpenZeppelin/transaction-form-builder/commit/71a6ea6a8411bd1b0feee4edc15f0de37542e232))
* **config:** add Tailwind CSS v4 configuration for form-renderer demo ([c730e9e](https://github.com/OpenZeppelin/transaction-form-builder/commit/c730e9e84ad28887f9ace0cac340b1b80ea8dcca))
* **config:** enforce Node.js 20+ in all Git hooks ([d2091f3](https://github.com/OpenZeppelin/transaction-form-builder/commit/d2091f3378a73b78347b602a4a028c8990466d99))
* **config:** enforce Node.js 20+ requirement in pre-push hook ([b9c2235](https://github.com/OpenZeppelin/transaction-form-builder/commit/b9c22355ba1330aea3947c3c2a9d73ce323b554b))
* **config:** initial monorepo package structure setup ([5526e04](https://github.com/OpenZeppelin/transaction-form-builder/commit/5526e042be7a3e3d4fbad70d35806a29fc3e23df))
* **config:** require Node.js 18.17.0+ and update ESLint to v9 ([d563146](https://github.com/OpenZeppelin/transaction-form-builder/commit/d563146737671272a83f9176c71ffca17f50ad3b))
* **config:** update Node.js requirement to v20.11.1 ([3eadd96](https://github.com/OpenZeppelin/transaction-form-builder/commit/3eadd968cd1e1a6ea94e82d22bdf9e089d520693))
* **core:** [wip] add core utils for the automated export testing framework ([27bd8bb](https://github.com/OpenZeppelin/transaction-form-builder/commit/27bd8bbe99fb2667b79f82c36382958d6c4a47a1))
* **core:** add adapter pattern enforcement with custom ESLint rule ([dc3e5f5](https://github.com/OpenZeppelin/transaction-form-builder/commit/dc3e5f504ab7d644074fa9687a6146de1516a8c8))
* **core:** add comprehensive export testing framework ([cd6428b](https://github.com/OpenZeppelin/transaction-form-builder/commit/cd6428b7c1ce99fd921db13c97f3f9c317eaff6f))
* **core:** add configurable logger utility ([a6e46a7](https://github.com/OpenZeppelin/transaction-form-builder/commit/a6e46a772a86ab4f00aa95b984e7250c6865d861))
* **core:** add editable form title and description fields ([f7bd9c5](https://github.com/OpenZeppelin/transaction-form-builder/commit/f7bd9c5a52aea9577a692d1842ce4a6c68c9880d))
* **core:** add field exclusion and hardcoding UI controls ([f627689](https://github.com/OpenZeppelin/transaction-form-builder/commit/f62768930c70002c8a63529f1f67a67f74469316))
* **core:** add form-renderer placeholder components and utilities ([91d2ebc](https://github.com/OpenZeppelin/transaction-form-builder/commit/91d2ebc2e1cfbe247eae5ae6e4a0dc32185043da))
* **core:** add JSON formatting utility with dedicated tests ([f8d9431](https://github.com/OpenZeppelin/transaction-form-builder/commit/f8d94311e643d71b8254af448be7c9392043fc94))
* **core:** add modifiesState flag and getWritableFunctions method to contract adapters ([1f537b7](https://github.com/OpenZeppelin/transaction-form-builder/commit/1f537b7b3da01614ee28ebc3edef39618ee4c64c))
* **core:** add template manager for export ([34f3d2c](https://github.com/OpenZeppelin/transaction-form-builder/commit/34f3d2c682a7d8e82df6db7acff0d3265ff624bb))
* **core:** add types and adapter interface for execution method step ([a89e738](https://github.com/OpenZeppelin/transaction-form-builder/commit/a89e738f2f1cd4d53b5fd115dc4d5110819b12b7))
* **core:** complete export integration for execution method step ([8d8754e](https://github.com/OpenZeppelin/transaction-form-builder/commit/8d8754eca3f6154eead60bf3063a0374784999e1))
* **core:** configure form-renderer package for publishing ([3fcadfd](https://github.com/OpenZeppelin/transaction-form-builder/commit/3fcadfd9741ed9230aac216d0ad5c1a56e7f43eb))
* **core:** create adapter configuration files ([f2ad9e5](https://github.com/OpenZeppelin/transaction-form-builder/commit/f2ad9e57c6ffb54980980a48138f72b4ab360acf))
* **core:** define core configuration types ([d45b0e6](https://github.com/OpenZeppelin/transaction-form-builder/commit/d45b0e623f448b345aa26d72c7053e277fdb8a95))
* **core:** enhance form generation with adapter pattern and complex types support ([57e5d53](https://github.com/OpenZeppelin/transaction-form-builder/commit/57e5d53cd8cd7d27a520cb9c9f5c2c9e2ac071da))
* **core:** ensure labels are start case ([a80e57a](https://github.com/OpenZeppelin/transaction-form-builder/commit/a80e57a1a576f23d8c48f39b478a90cf20c273aa))
* **core:** export framework testing Integration and cli for manual testing ([c455e29](https://github.com/OpenZeppelin/transaction-form-builder/commit/c455e29088db4c91ad39a002eb51d328907c9e02))
* **core:** focus on EVM adapter and fix form field editor typing ([58404fa](https://github.com/OpenZeppelin/transaction-form-builder/commit/58404fadeb61e41246d85f0a3ce054bfe248ccf6))
* **core:** generate kebab case name ([f428c08](https://github.com/OpenZeppelin/transaction-form-builder/commit/f428c08632a605b67c58a4f52c56075b042caf4e))
* **core:** implement adapter export system ([6de5cd2](https://github.com/OpenZeppelin/transaction-form-builder/commit/6de5cd22f3210f5442959045533042afbce5bb66))
* **core:** implement form code generator and export functionality ([0517c27](https://github.com/OpenZeppelin/transaction-form-builder/commit/0517c276d8ae7094477348572325a66153633480))
* **core:** implement package manager class ([ce77bdb](https://github.com/OpenZeppelin/transaction-form-builder/commit/ce77bdb4f4890b351e72afa5f67087c0ac1631fb))
* **core:** implement StepExecutionMethod UI component ([523ae1a](https://github.com/OpenZeppelin/transaction-form-builder/commit/523ae1aed2eba23f5c863144709fe741dfaf0faf))
* **core:** implement ZIP generation utility for form exports ([9fb4357](https://github.com/OpenZeppelin/transaction-form-builder/commit/9fb435762d5d1b3167820332b1e81ba9fbd218c4))
* **core:** improve export system with environment modes and path constraints ([07a54a6](https://github.com/OpenZeppelin/transaction-form-builder/commit/07a54a6f9de25a2cb7360d07ff48e5fe3e2d7448))
* **core:** improve form-renderer package build system ([8c42a01](https://github.com/OpenZeppelin/transaction-form-builder/commit/8c42a01cfa4f6e179a4bd64cb2d8546afce19a06))
* **core:** integrate execution method step and validation logic ([23caacb](https://github.com/OpenZeppelin/transaction-form-builder/commit/23caacb06e7f66f327cef5ea15af77f91f45e574))
* **core:** migrate core application files to monorepo structure ([776bee5](https://github.com/OpenZeppelin/transaction-form-builder/commit/776bee5a384dd1ad82271066a48eb3d8ba081e98))
* **core:** place contract mock files into template directory temporarily ([64f2b01](https://github.com/OpenZeppelin/transaction-form-builder/commit/64f2b01297e11e5566f1e19e1f10af0b906845e1))
* **core:** prepare formatTransactionData for hardcoded value logic ([42bed1d](https://github.com/OpenZeppelin/transaction-form-builder/commit/42bed1df53aa11eebc75d84d846ac338256c7b4e))
* **core:** separate generateId into general utils and include in the export ([a88faa5](https://github.com/OpenZeppelin/transaction-form-builder/commit/a88faa584c47e19b61ee72b293453056ddb7d732))
* **core:** template manager to use import.meta.glob ([4cc3073](https://github.com/OpenZeppelin/transaction-form-builder/commit/4cc3073d8568b9cde24c530c8e3df7835f9bb42a))
* **core:** template processing plugin for vite ([422064a](https://github.com/OpenZeppelin/transaction-form-builder/commit/422064a7155a8accf5de0873d96bdffb0d4783e3))
* **core:** template-based generation implementation ([4b96570](https://github.com/OpenZeppelin/transaction-form-builder/commit/4b965702357b17dc2ec6addb6e56a4b50f33b6b1))
* **core:** update contract adapters to use MockContractService ([0fdd8b6](https://github.com/OpenZeppelin/transaction-form-builder/commit/0fdd8b6c22bee58fbb23cd341decd2cdc0f78343))
* **core:** use builderConfigToRenderSchema in code gen ([d2af408](https://github.com/OpenZeppelin/transaction-form-builder/commit/d2af40896ef168f283f5cae948d11b9e26c19c32))
* **deps:** add JSZip for form export functionality ([ff4274b](https://github.com/OpenZeppelin/transaction-form-builder/commit/ff4274b499186db93d25666963c673716ee70bed))
* **eslint:** add unused-imports plugin to auto-remove unused imports ([3546074](https://github.com/OpenZeppelin/transaction-form-builder/commit/3546074e7dbaee2022376c3a056c52b54a0e3465))
* **export:** add executionConfig to test config ([1484af9](https://github.com/OpenZeppelin/transaction-form-builder/commit/1484af9ac13d2a302c2c559233b7fbec26b82784))
* **export:** implement style export manager and update docs ([f15d9c5](https://github.com/OpenZeppelin/transaction-form-builder/commit/f15d9c53de2d8611b1667a897c180a515f4a4dd1))
* **export:** integrate automatic JSON formatting in export system ([9ecdbfb](https://github.com/OpenZeppelin/transaction-form-builder/commit/9ecdbfbeafb445749679bccd7325f3647f23a1fb))
* **export:** integrate logger utility into export system ([dd65d81](https://github.com/OpenZeppelin/transaction-form-builder/commit/dd65d815b76a8e51b696067363084c22cdb02f4b))
* **export:** support hidden, hardcoded, and readonly fields in export ([c922998](https://github.com/OpenZeppelin/transaction-form-builder/commit/c922998ac555a92d236cd40923dcc4764a32884e))
* **form:** add enhanced validation handling to all field components ([4cf5d5a](https://github.com/OpenZeppelin/transaction-form-builder/commit/4cf5d5a6768bf4f7e8734b5892e586d4369492d6))
* **form:** add MockContractSelector component for contract selection ([639e97b](https://github.com/OpenZeppelin/transaction-form-builder/commit/639e97b7a23b952409a6b6dd4e18a3be51cb6399))
* **form:** add SelectField component for form rendering ([4602485](https://github.com/OpenZeppelin/transaction-form-builder/commit/4602485f58e0862f71342dbfe476ec201e97f8ea))
* **form:** create common error handling and validation display ([55248c9](https://github.com/OpenZeppelin/transaction-form-builder/commit/55248c90807380ca6494770a2dacfff8c16e6413))
* **form:** create form-renderer configuration file ([b12b4e6](https://github.com/OpenZeppelin/transaction-form-builder/commit/b12b4e652df5509c1ad02107982a450947d69ec5))
* **form:** enhance field components with improved accessibility ([e28bb2d](https://github.com/OpenZeppelin/transaction-form-builder/commit/e28bb2de9b66336f8536789d8c16135358c05337))
* **form:** enhance field type selector and fix real-time update bug ([6459d84](https://github.com/OpenZeppelin/transaction-form-builder/commit/6459d84a3264d911080ffc6c026c44bd1d053bb2))
* **form:** enhance field type selector with blockchain type compatibility ([3f9e2d6](https://github.com/OpenZeppelin/transaction-form-builder/commit/3f9e2d6ffa9f98e779f1b01ad0ca74915d2323fa))
* **form:** enhance field type selector with grouped options and compatibility indicators ([e3b0e31](https://github.com/OpenZeppelin/transaction-form-builder/commit/e3b0e3163c7df651cc72374eade53c6a3990343e))
* **form:** enhance FormField with generic type parameters ([101593b](https://github.com/OpenZeppelin/transaction-form-builder/commit/101593b58e4d52baeb0d6b45e2e210e0d32518ae))
* **form:** implement boolean field component ([377f6a0](https://github.com/OpenZeppelin/transaction-form-builder/commit/377f6a00fc7ce0d93db2bf3b0c6fe1a203932448))
* **form:** implement data transform system ([b8f99da](https://github.com/OpenZeppelin/transaction-form-builder/commit/b8f99dac300cd1187f746558a7531a4faa739b66))
* **form:** implement FormSchemaFactory with transforms ([383c9eb](https://github.com/OpenZeppelin/transaction-form-builder/commit/383c9eb1c45089b8004802f064b4337f46725548))
* **form:** implement generic type parameters in all adapters ([7bc7fc1](https://github.com/OpenZeppelin/transaction-form-builder/commit/7bc7fc12664c464c42db6c080e540cf9bf2f756d))
* **form:** implement NumberField and AddressField components with React Hook Form integration ([dc5df2f](https://github.com/OpenZeppelin/transaction-form-builder/commit/dc5df2f694801f7fe640e34af803095fd13a78ad))
* **form:** implement preview logic for hidden, hardcoded, and read-only fields ([2554b34](https://github.com/OpenZeppelin/transaction-form-builder/commit/2554b34637cf32d31844c8309aa09af59829f760))
* **form:** integrate form-renderer in FormPreview component ([307d628](https://github.com/OpenZeppelin/transaction-form-builder/commit/307d628272df70ce99adb97e443a80a7dc1b0e9b))
* **form:** integrate LoadingButton and MockContractSelector into StepContractDefinition ([5504516](https://github.com/OpenZeppelin/transaction-form-builder/commit/5504516bd1671ffa6608f2b83c62ee433a974f38))
* **form:** move button-variants.ts from core to form-renderer ([15c8a2b](https://github.com/OpenZeppelin/transaction-form-builder/commit/15c8a2b665d81e58b3113c535790fdb394feb324))
* **form:** update ContractAdapter interface with generics ([78c9660](https://github.com/OpenZeppelin/transaction-form-builder/commit/78c9660a75f9cd8c00fad7db842d80631cabde38))
* **form:** update form builder components to use enhanced types ([ad6f6c4](https://github.com/OpenZeppelin/transaction-form-builder/commit/ad6f6c4a624dd97decbe7454d94f2fc493410603))
* **form:** update SelectField ([33a118d](https://github.com/OpenZeppelin/transaction-form-builder/commit/33a118df7bba2a3563e83f8dcddbffd789730563))
* **form:** use CommonFormProperties in components and services ([c9ce271](https://github.com/OpenZeppelin/transaction-form-builder/commit/c9ce2715cac068f13bba7bb147cc57dd399def00))
* **ui:** add AmountField story ([81b5bca](https://github.com/OpenZeppelin/transaction-form-builder/commit/81b5bca0c4e9ac57bc4ddda073d115701a69f6cf))
* **ui:** add blockchain address input field component with validation ([ca67c5f](https://github.com/OpenZeppelin/transaction-form-builder/commit/ca67c5fee2944be32fda6fb136fe350612999ca9))
* **ui:** add Button and LoadingButton component stories ([ecec1c3](https://github.com/OpenZeppelin/transaction-form-builder/commit/ecec1c3f1a6212e6faca88a23625e6343965d038))
* **ui:** add data-slot attributes for consistent styling ([646bb97](https://github.com/OpenZeppelin/transaction-form-builder/commit/646bb978a0b06b2f5ead07afbb39c27238ea069a))
* **ui:** add Dialog component with storybook documentation ([6afb472](https://github.com/OpenZeppelin/transaction-form-builder/commit/6afb4721ffcaabf8c148bf30f0c2739b90595356))
* **ui:** add LoadingButton component with storybook documentation ([6d09188](https://github.com/OpenZeppelin/transaction-form-builder/commit/6d091881187e4a6d410c9e535de246765579e5b6))
* **ui:** add RadioGroup component using Radix UI ([52e3268](https://github.com/OpenZeppelin/transaction-form-builder/commit/52e32688856cc2b942f7823eb957921d7fc1e368))
* **ui:** add Storybook component stories and fix styling issues ([dc1046d](https://github.com/OpenZeppelin/transaction-form-builder/commit/dc1046df73d25c076a808c5d5eac3c4eb29a558f))
* **ui:** add styles package to monorepo checks ([70a7af2](https://github.com/OpenZeppelin/transaction-form-builder/commit/70a7af207d0f3efedb55412595ee7e17d76efe51))
* **ui:** add template structure for exported applications ([c984423](https://github.com/OpenZeppelin/transaction-form-builder/commit/c984423b92b0eb719c649469d895eddb2ff501ee))
* **ui:** enhance blockchain selector with tile-based UI ([7f832f2](https://github.com/OpenZeppelin/transaction-form-builder/commit/7f832f21a9e607d4a4e5cadb9294a3a2856440ed))
* **ui:** enhance form-renderer demo App with Tailwind CSS styling ([40e8545](https://github.com/OpenZeppelin/transaction-form-builder/commit/40e8545a763b3e1c14c85eb6c07576e215fff8e2))
* **ui:** enhance Textarea component with accessibility features ([145b109](https://github.com/OpenZeppelin/transaction-form-builder/commit/145b109395efba2cd3a842d530c761ab8da30a2c))
* **ui:** improve field type transformation display with tooltips ([079fe52](https://github.com/OpenZeppelin/transaction-form-builder/commit/079fe526f3a100008dd9335a6220b5ad71eb3411))
* **ui:** reorganize mock contracts into chain-specific directories ([9753355](https://github.com/OpenZeppelin/transaction-form-builder/commit/975335565a18c5024e40b08aee27d42c672da7ae))
* **ui:** update to latest Tailwind v4 and shadcn/ui patterns ([7fdd328](https://github.com/OpenZeppelin/transaction-form-builder/commit/7fdd328be59bf827bfeda4fda17f3acbcac0ed6c))
* **ui:** update ui components and TypeScript config ([d71cc25](https://github.com/OpenZeppelin/transaction-form-builder/commit/d71cc25bea9633a4fcd0e88a121ec485e7ca54bb))


### Performance Improvements

* **core:** lazy load adapters ([5cba3d3](https://github.com/OpenZeppelin/transaction-form-builder/commit/5cba3d3d73876369e4940e811f6dce2c2d9a0881))
* **core:** lazy load templates ([38d6234](https://github.com/OpenZeppelin/transaction-form-builder/commit/38d623480f278355ba134265491997af345834ea))

## [1.0.4](https://github.com/OpenZeppelin/transaction-form-builder/compare/v1.0.3...v1.0.4) (2025-03-12)


### Bug Fixes

* **ui:** tailwind integration ([13ef57d](https://github.com/OpenZeppelin/transaction-form-builder/commit/13ef57d1e1535ef4774bf7a3bf73412485f2f594))

## [1.0.3](https://github.com/OpenZeppelin/transaction-form-builder/compare/v1.0.2...v1.0.3) (2025-03-07)


### Bug Fixes

* update theme utility classes for Tailwind CSS v4 compatibility ([c5ef108](https://github.com/OpenZeppelin/transaction-form-builder/commit/c5ef108fbd81c146e14289fb2955fa8fc1cbf544))

## [1.0.2](https://github.com/OpenZeppelin/transaction-form-builder/compare/v1.0.1...v1.0.2) (2025-03-07)


### Bug Fixes

* update Tailwind CSS v4 configuration for ESM compatibility ([b5fd682](https://github.com/OpenZeppelin/transaction-form-builder/commit/b5fd6820098124cebb870d04d1270b8f1ecc2e91))

## [1.0.1](https://github.com/OpenZeppelin/transaction-form-builder/compare/v1.0.0...v1.0.1) (2025-03-07)


### Bug Fixes

* rename postcss.config.js to .cjs to fix ESM compatibility ([78dada4](https://github.com/OpenZeppelin/transaction-form-builder/commit/78dada4f1eb5c7d3afe6b4d24d5a08228142a313))

# 1.0.0 (2025-03-07)


### Bug Fixes

* **config:** migrate to ESLint 9.x CommonJS configuration ([b6ef58d](https://github.com/OpenZeppelin/transaction-form-builder/commit/b6ef58da42aa41f160361b052c12b8096d81db3a))
* **config:** remove ESM version of ESLint config ([05f9aad](https://github.com/OpenZeppelin/transaction-form-builder/commit/05f9aad2e811ce823710bd2e2e681f2e5afef16b))
* **config:** resolve ESLint TypeScript import issues ([118e91e](https://github.com/OpenZeppelin/transaction-form-builder/commit/118e91eaed5b4ea133e5ff00cca7809fbd7e2d55))


### Features

* **core:** initial commit ([30f1f8b](https://github.com/OpenZeppelin/transaction-form-builder/commit/30f1f8b983f4d5696742c7789f9cb7333a82b180))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-03-07

### Added

- Initial project setup with React 19, TypeScript, Vite, and Tailwind CSS
- Integrated shadcn/ui components (Button, Toast, etc.)
- Added ESLint and Prettier with strict configurations
- Set up import sorting with eslint-plugin-simple-import-sort
- Implemented Husky and lint-staged for pre-commit hooks
- Added commitlint with Conventional Commits support
- Configured Commitizen for interactive commit creation
- Created a custom Tailwind plugin for animations
- Added Storybook for component documentation
- Implemented Vitest for unit testing
- Added GitHub Actions workflows for CI, security, and dependency checks
- Set up semantic-release for automated versioning and releases
- Created comprehensive documentation (README, CONTRIBUTING, SECURITY)
- Added scripts for dependency management and updates
- Created custom utility scripts for checking deprecated dependencies

### Changed

- Updated all dependencies to their latest versions
- Modified Tailwind configuration to better match project structure
- Optimized VSCode settings for the project

### Security

- Implemented GitHub workflow for security scanning
- Added dependency review workflow for vulnerability detection
