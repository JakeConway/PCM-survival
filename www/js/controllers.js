angular.module('starter.controllers', [])

    .controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //$scope.$on('$ionicView.enter', function(e) {
        //});

        // Form data for the login modal
        $scope.loginData = {};

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/login.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal = modal;
        });

        // Triggered in the login modal to close it
        $scope.closeLogin = function () {
            $scope.modal.hide();
        };

        // Open the login modal
        $scope.login = function () {
            $scope.modal.show();
        };

        // Perform the login action when the user submits the login form
        $scope.doLogin = function () {
            console.log('Doing login', $scope.loginData);

            // Simulate a login delay. Remove this and replace with your login
            // code if using a login system
            $timeout(function () {
                $scope.closeLogin();
            }, 1000);
        };
    })

    .controller('PlaylistsCtrl', function ($scope) {
        $scope.playlists = [
            {title: 'Reggae', id: 1},
            {title: 'Chill', id: 2},
            {title: 'Dubstep', id: 3},
            {title: 'Indie', id: 4},
            {title: 'Rap', id: 5},
            {title: 'Cowbell', id: 6}
        ];
    })

    .controller('PlaylistCtrl', function ($scope, $stateParams) {

    })

    .factory('studyStages', function () {
        return {
            studyStages: {
                blca_mskcc_solit_2015: 'PT_STAGE',
                blca_plasmacytoid_mskcc_2016: 'TUMOR_PATH_STAGE',
                blca_tcga_pub: 'TUMORSTAGE',
                blca_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                acbc_mskcc_2015: 'TUMOR_STAGE',
                brca_metabric: 'TUMOR_STAGE',
                brca_tcga_pub_2015: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                brca_tcga_pub: 'AJCC STAGE',
                brca_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                cesc_tcga: 'CLINICAL_STAGE',
                coadread_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                esca_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                escc_icgc: 'TUMOR_STAGE',
                egc_tmucih_2015: 'STAGE',
                stad_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                acyc_mskcc_2013: 'TUMOR_STAGE',
                hnsc_mdanderson_2013: 'TUMOR_STAGE',
                hnsc_tcga: 'CLINICAL_STAGE',
                chol_nus_2012: 'STAGE',
                chol_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                lihc_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                luad_tcga_pub: 'TUMOR_STAGE_2009',
                luad_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                lusc_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                nsclc_tcga_broad_2016: 'STAGE',
                sclc_ucologne_2015: 'UICC_TUMOR_STAGE',
                skcm_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                uvm_tcga: 'AJCC_CLINICAL_TUMOR_STAGE',
                plmeso_nyu_2015: 'STAGE',
                nbl_amc_2012: 'INSS_STAGE',
                ov_tcga_pub: 'TUMOR_STAGE_2009',
                ov_tcga: 'CLINICAL_STAGE',
                paad_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                prad_cpcg_2017: 'PATH_N_STAGE',
                prad_tcga: 'PATH_N_STAGE',
                prad_mskcc_2014: 'CLIN_T_STAGE',
                kich_tcga_pub: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                kich_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                kirc_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                kirp_tcga: 'AJCC_CLINICAL_TUMOR_STAGE',
                urcc_mskcc_2016: 'PATH_M_STAGE',
                thca_tcga_pub: 'PATH_N_STAGE',
                thca_tcga: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
                thyroid_mskcc_2016: 'PATH_N_STAGE',
                ucec_tcga_pub: 'TUMOR_STAGE_2009',
                ucec_tcga: 'CLINICAL_STAGE',
                mbl_icgc: 'CLIN_M_STAGE',
                stad_tcga_pub: 'TNM_STAGE',
                tgct_tcga: 'AJCC_CLINICAL_TUMOR_STAGE',
                lihc_amc_prv: 'GRADE'
            },
            TUMOR_STAGE: function(stage) {
                if(isInteger(stage)) {
                    if(stage < 4) {
                        if(stage == 0) {
                            return undefined;
                        }
                        var str =  repeatLetter(stage);
                        return str;
                    }
                    else {
                        return "IV";
                    }
                }
                else {
                    str = stageHasIs(stage);
                    return str;
                }
            },
            'AJCC STAGE': function(stage) {
                var str = stageHasIs(stage);
                return str;
            },
            AJCC_PATHOLOGIC_TUMOR_STAGE: function(stage) {
                var str = stageHasIs(stage);
                return str;
            },
            PATH_N_STAGE: function(stage) {
                var str = fromNMTStage(stage, "n");
                return str;
            },
            CLIN_T_STAGE: function(stage) {
                var str = fromNMTStage(stage, "t");
                return str;
            },
            TUMOR_STAGE: function(stage) {
                if(stage == "" || stage == " ") {
                    return undefined;
                }
                if(stage == undefined) {
                    return undefined;
                }
                else {
                    var str = repeatLetter(stage);
                    return str;
                }
            }
        }
    });

