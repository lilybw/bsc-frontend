### This application is transpiled into 3 different js bundles in order to reduce bundle size
The name of all output "bundles" must på index.js.

Anything else in each directory but the index.js file is ignored.

#### main_menu
Contains the main menu and can be served as result of its own sub-url as from an @controller template in Angular.

#### colony
Contains the main gameplay segments and minigames and can be served as result of its own sub-url as from an @controller template in Angular. By far the largest bundle until further optimization.


#### tutorial
Contains the entire tutorial and can be served as result of its own sub-url as from an @controller template in Angular.
