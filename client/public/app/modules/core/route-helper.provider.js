/**
 * Created by paul on 5/18/15.
 */
'use strict';

var coreModule = require('./index');

routeHelperProvider.$inject = ['$locationProvider', '$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider'];

function routeHelperProvider($locationProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider) {
    /* jshint validthis:true */
    var config = {
        docTitle: undefined,
        resolveAlways: {}
    };

    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);

    this.configure = function(cfg) {
        angular.extend(config, cfg);
    };

    this.$get = RouteHelper;
    RouteHelper.$inject = ['$location', '$rootScope', '$state'];
    /* @ngInject */
    function RouteHelper($location, $rootScope, $state) {
        var handlingStateChangeError = false;
        var hasOtherwise = false;
        var stateCounts = {
            errors: 0,
            changes: 0
        };

        var service = {
            configureStates: configureStates,
            getStates: getStates,
            stateCounts: stateCounts
        };

        init();

        return service;

        ///////////////

        function configureStates(states, otherwisePath) {
            states.forEach(function(state) {
                state.config.resolve =
                    angular.extend(state.config.resolve || {}, config.resolveAlways);
                $stateProvider.state(state.state, state.config);
            });
            if (otherwisePath && !hasOtherwise) {
                hasOtherwise = true;
                $urlRouterProvider.otherwise(otherwisePath);
            }
        }

        function handleRoutingErrors() {
            // Route cancellation:
            // On routing error, go to the dashboard.
            // Provide an exit clause if it tries to do it twice.
            $rootScope.$on('$stateChangeError',
                function(event, toState, toParams, fromState, fromParams, error) {
                    if (handlingStateChangeError) {
                        return;
                    }
                    stateCounts.errors++;
                    handlingStateChangeError = true;
                    var destination = (toState &&
                        (toState.title || toState.name || toState.loadedTemplateUrl)) ||
                        'unknown target';
                    var msg = 'Error routing to ' + destination + '. ' +
                        (error.data || '') + '. <br/>' + (error.statusText || '') +
                        ': ' + (error.status || '');
                    //logger.warning(msg, [toState]);
                    $location.path('/');
                }
            );
        }

        function init() {
            handleRoutingErrors();
            updateDocTitle();
        }

        function getStates() { return $state.get(); }

        function updateDocTitle() {
            $rootScope.$on('$stateChangeSuccess',
                function(event, toState, toParams, fromState, fromParams) {
                    stateCounts.changes++;
                    handlingStateChangeError = false;
                    var title = config.docTitle + ' ' + (toState.title || '');
                    $rootScope.title = title; // data bind to <title>
                }
            );
        }
    }
}

coreModule.provider('routeHelper', routeHelperProvider);