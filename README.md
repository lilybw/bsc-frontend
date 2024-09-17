# URSA Frontend

Build with Solid see [Solid Website](https://solidjs.com)

Separated into 3 distinct, standalone js bundles which can be build, deployed and run with the dev server independently*:

* #### Colony
* #### Tutorial
* #### Menu

*although moving between bundles as a user only works in production (i.e. not with dev server but through Angular)

## Runtime Modes

A dev server can be started in either dev or test mode with the command
```bash
npm run <dev | test>-<bundle>
```

Test uses a static test user whereas Dev invokes the Vitec Integration as to gather userdata from the Vitec platform.
Both dev and test integrates with the rest of the URSA services.

## Build
Each bundle can be build individually by running:
```bash
npm run build-<bundle>
```
or all bundles can be build at once.
```bash
npm run build-all
```
Each transpiled bundle can be found in ./dist under each of the different folders for that bundle. The angular platform is dependent on the exact location and name of each bundle, as the bundle is injected into it as an inline ESM import.
