/**
 * Created by jakeconway on 2/5/17.
 */

var module = angular.module('starter.controllers');


module.controller('welcomeCtrl', ['$scope', '$http', 'studyStages', function ($scope, $http, studyStages) {
    $scope.selectedType = null;
    $scope.tableData = null;

    $scope.patients = [
        "ABCDEFG123FM",
        "123456789FM",
        "12345678FM"
    ];

    //The studies from cbioportal associated with each HemOnc solid tumor category
    $scope.cancerTypes = {
        'Anal cancer': [],
        'Bladder cancer': ['blca'],
        'Breast cancer': ['acbc', 'brca'],
        'Central nervous system (CNS) cancer': [
            'lgg', // No info on stage
            'gbm', // No info on stage
            'mpnst', // No info on stage
            'mbl', // Debating on information provided (Metastasis stage)
            'pcnsl' // No info on stage
        ],
        'Cervical cancer': ['cesc'],
        'Colon cancer': ['coad'],
        'Esophageal cancer': ['esca', 'escc'],
        'Ewing\'s sarcoma': ['es'], // No information on stage
        'Gastric cancer': ['egc', 'stad'],
        'Germ cell tumors': ['tgct'],
        'Head and neck cancer': ['acyc', 'hnsc', 'npc', 'hnc'],
        'Hepatobiliary cancer': ['chol', 'gbc', 'liad', 'lihc'],
        'Lung cancer, non-small cell': ['luad', 'lusc', 'nsclc'],
        'Lung cancer, small cell': ['sclc'],
        'Melanoma': ['desm', 'skcm', 'uvm'],
        'Merkel cell carcinoma': [],
        'Mesothelioma': ['plmeso', 'meso'],
        'Neuroblastoma': ['acc', 'nbl', 'pcpg'],
        'Neuroendocrine tumors': ['panet', 'nepc'],
        'Osteosarcoma': [],
        'Ovarian cancer': ['ov', 'scco'],
        'Pancreatic cancer': ['paac', 'paad'],
        'Penile cancer': [],
        'Prostate cancer': ['prad'],
        'Rectal cancer': ['read'],
        'Renal cancer': ['ccrcc', 'kich', 'kirc', 'kirp', 'urcc'],
        'Sarcoma': ['rms', 'sarc'],
        'Skin, basal & squamous cancer': ['cscc'],
        'Testicular cancer': ['tgct'], //tgct is actually germ cell, but there were no other testicualrs
        'Thymoma': ['tet', 'thym'],
        'Thyroid cancer': ['thca', 'thyroid'],
        'Unknown primary': [],
        'Uterine cancer': ['ucs', 'ucec']
    };

    $scope.cbioCancerStudies = [];

    //A dictionary of FM to HemOnc mappings
    $scope.cancerDict = {
        "anus squamous cell carcinoma": "Anal cancer",
        "bladder adenocarcinoma": "Bladder cancer",
        "bladder small cell carcinoma": "Bladder cancer",
        "bladder urothelial (transitional cell) carcinoma": "Bladder cancer",
        "breast carcinoma (nos)": "Breast cancer",
        "breast carcinoma (nos) er positive": "Breast cancer",
        "breast inflammatory carcinoma": "Breast cancer",
        "breast invasive ductal carcinoma (idc)": "Breast cancer",
        "breast invasive lobular carcinoma (ilc)": "Breast cancer",
        "breast metaplastic carcinoma": "Breast cancer",
        "breast myoepithelial carcinoma": "Breast cancer",
        "breast phyllodes tumor": "Breast cancer",
        "brain anaplastic astrocytoma": "Central nervous system (CNS) cancer",
        "brain anaplastic meningioma": "Central nervous system (CNS) cancer",
        "brain astrocytoma": "Central nervous system (CNS) cancer",
        "brain astrocytoma pilocytic": "Central nervous system (CNS) cancer",
        "brain ependymoma": "Central nervous system (CNS) cancer",
        "brain glioblastoma (gbm)": "Central nervous system (CNS) cancer",
        "brain glioma (nos)": "Central nervous system (CNS) cancer",
        "brain hemangioblastoma": "Central nervous system (CNS) cancer",
        "brain meningioma": "Central nervous system (CNS) cancer",
        "brain oligodendroglioman": "Central nervous system (CNS) cancer",
        "brain primitive neuroectoderm tumor (pnet)": "Central nervous system (CNS) cancer",
        "pediatric brain astrocytoma pilocytic": "Central nervous system (CNS) cancer",
        "pediatric brain astrocytoma pilomyxoid": "Central nervous system (CNS) cancer",
        "pediatric brain ependymoma": "Central nervous system (CNS) cancer",
        "pituitary adenoma": "Central nervous system (CNS) cancer",
        "spine ependymoma": "Central nervous system (CNS) cancer",
        "cervix adenocarcinoma": "Cervical cancer",
        "cervix squamous cell carcinoma (scc)": "Cervical cancer",
        "appendix adenocarcinoma": "Colon cancer",
        "appendix goblet cell carcinoid (gcc)": "Colon cancer",
        "appendix mucinous neoplasm (nos)": "Colon cancer",
        "colon adenocarcinoma (crc)": "Colon cancer",
        "esophagus adenocarcinoma": "Esophageal cancer",
        "esophagus squamous cell carcinoma (scc)": "Esophageal cancer",
        "bone ewing sarcoma": "Ewing's sarcoma",
        "soft tissue ewing sarcoma": "Ewing's sarcoma",
        "stomach adenocarcinoma (nos)": "Gastric cancer",
        "stomach adenocarcinoma diffuse type": "Gastric cancer",
        "stomach gist": "Gastric cancer",
        "unknown primary gist": "Gastric cancer",
        "brain germ cell tumor": "Germ cell tumors",
        "head and neck adenocarcinoma": "Head and neck cancer",
        "head and neck adenoid cystic carcinoma": "Head and neck cancer",
        "head and neck mucoepidermoid carcinoma": "Head and neck cancer",
        "head and neck odontogenic carcinoma": "Head and neck cancer",
        "head and neck spindle cell carcinoma": "Head and neck cancer",
        "head and neck squamous cell carcinoma (hnscc)": "Head and neck cancer",
        "nasopharynx and paranasal sinuses adenocarcinoma": "Head and neck cancer",
        "nasopharynx and paranasal sinuses squamous cell carcinoma": "Head and neck cancer",
        "nasopharynx and paranasal sinuses undifferentiated carcinoma": "Head and neck cancer",
        "salivary gland acinic cell tumor": "Head and neck cancer",
        "salivary gland adenocarcinoma": "Head and neck cancer",
        "salivary gland adenoid cystic carcinoma": "Head and neck cancer",
        "salivary gland carcinoma (nos)": "Head and neck cancer",
        "salivary gland duct carcinoma": "Head and neck cancer",
        "salivary gland masc": "Head and neck cancer",
        "salivary gland myoepithelial carcinoma": "Head and neck cancer",
        "bile duct adenocarcinoma": "Hepatobiliary cancer",
        "gallbladder adenocarcinoma": "Hepatobiliary cancer",
        "liver cholangiocarcinoma": "Hepatobiliary cancer",
        "liver hepatocellular carcinoma (flo)": "Hepatobiliary cancer",
        "liver hepatocellular carcinoma (hcc)": "Hepatobiliary cancer",
        "lung adenocarcinoma": "Lung cancer, non-small cell",
        "lung adenoid cystic carcinoma": "Lung cancer, non-small cell",
        "lung adenosquamous carcinoma": "Lung cancer, non-small cell",
        "lung mucoepidermoid carcinoma": "Lung cancer, non-small cell",
        "lung non-small cell lung carcinoma (nos)": "Lung cancer, non-small cell",
        "lung sarcomatoid carcinoma": "Lung cancer, non-small cell",
        "lung squamous cell carcinoma": "Lung cancer, non-small cell",
        "lung squamous cell carcinoma (scc)": "Lung cancer, non-small cell",
        "lung small cell undifferentiated carcinoma": "Lung cancer, small cell",
        "anus melanoma": "Melanoma",
        "eye intraocular melanoma": "Melanoma",
        "head and neck melanoma": "Melanoma",
        "melanoma": "Melanoma",
        "skin melanoma": "Melanoma",
        "unknown primary, melanoma": "Melanoma",
        "unknown primary melanoma": "Melanoma",
        "vagina melanoma": "Melanoma",
        "skin merkel cell carcinoma": "Merkel cell carcinoma",
        "peritoneum mesothelioma": "Mesothelioma",
        "pleura mesothelioma": "Mesothelioma",
        "adrenal cortical carcinoma": "Neuroblastoma",
        "adrenal gland cortical carcinoma": "Neuroblastoma",
        "cervix neuroendocrine carcinoma": "Neuroendocrine tumors",
        "colon neuroendocrine carcinoma": "Neuroendocrine tumors",
        "duodenum neuroendocrine tumor": "Neuroendocrine tumors",
        "lung atypical carcinoid": "Neuroendocrine tumors",
        "lung large cell neuroendocrine carcinoma": "Neuroendocrine tumors",
        "pancreas neuroendocrine carcinoma": "Neuroendocrine tumors",
        "rectum neuroendocrine carcinoma": "Neuroendocrine tumors",
        "small intestine neuroendocrine carcinoma": "Neuroendocrine tumors",
        "soft tissue paraganglioma": "Neuroendocrine tumors",
        "stomach neuroendocrine carcinoma": "Neuroendocrine tumors",
        "unknown primary neuroendocrine tumor": "Neuroendocrine tumors",
        "unknown primary undifferentiated neuroendocrine carcinoma": "Neuroendocrine tumors",
        "bone osteosarcoma": "Osteosarcoma",
        "ovary carcinosarcoma": "Ovarian cancer",
        "ovary clear cell carcinoma": "Ovarian cancer",
        "ovary epithelial carcinoma (nos)": "Ovarian cancer",
        "ovary granulosa cell tumor": "Ovarian cancer",
        "ovary high grade serous carcinoma": "Ovarian cancer",
        "ovary low grade serous carcinoma": "Ovarian cancer",
        "ovary mucinous carcinoma": "Ovarian cancer",
        "ovary serous carcinoma": "Ovarian cancer",
        "ovary sex-cord stromal tumor": "Ovarian cancer",
        "papillary serous ovarian carcinoma": "Ovarian cancer",
        "pancreas acinar cell carcinoma": "Pancreatic cancer",
        "pancreas carcinoma (nos)": "Pancreatic cancer",
        "pancreas ductal adenocarcinoma": "Pancreatic cancer",
        "pancreas ductal carcinoma": "Pancreatic cancer",
        "pancreas pancreatoblastoma": "Pancreatic cancer",
        "pancreas solid pseudopapillary tumor": "Pancreatic cancer",
        "pancreatobiliary carcinoma (nos)": "Pancreatic cancer",
        "penis squamous cell carcinoma (scc)": "Penile cancer",
        "prostate acinar adenocarcinoma": "Prostate cancer",
        "prostate ductal adenocarcinoma": "Prostate cancer",
        "prostate undifferentiated carcinoma": "Prostate cancer",
        "rectum adenocarcinoma (crc)": "Rectal cancer",
        "rectum squamous cell carcinoma": "Rectal cancer",
        "rectum squamous cell carcinoma (scc)": "Rectal cancer",
        "kidney chromophobe carcinoma": "Renal cancer",
        "kidney clear cell carcinoma": "Renal cancer",
        "kidney medullary carcinoma": "Renal cancer",
        "kidney renal cell (nos)": "Renal cancer",
        "kidney renal cell carcinoma (nos)": "Renal cancer",
        "kidney renal papillary carcinoma": "Renal cancer",
        "kidney sarcomatoid carcinoma": "Renal cancer",
        "kidney urothelial carcinoma": "Renal cancer",
        "pediatric kidney renal cell carcinoma (nos)": "Renal cancer",
        "renal cell carcinoma": "Renal cancer",
        "bone chondrosarcoma": "Sarcoma",
        "bone chordoma": "Sarcoma",
        "pediatric soft tissue hemangioma": "Sarcoma",
        "pediatric soft tissue inflammatory myofibroblastic tumor": "Sarcoma",
        "soft tissue alveolar soft part sarcoma": "Sarcoma",
        "soft tissue chondrosarcoma": "Sarcoma",
        "soft tissue clear cell sarcoma": "Sarcoma",
        "soft tissue desmoplastic small round cell tumor": "Sarcoma",
        "soft tissue epithelioid sarcoma": "Sarcoma",
        "soft tissue leiomyosarcoma": "Sarcoma",
        "soft tissue liposarcoma": "Sarcoma",
        "soft tissue rhabdomyosarcoma (nos)": "Sarcoma",
        "soft tissue rhabdomyosarcoma alveolar": "Sarcoma",
        "soft tissue round cell tumor (nos)": "Sarcoma",
        "soft tissue sarcoma (nos)": "Sarcoma",
        "soft tissue sarcoma undifferentiated": "Sarcoma",
        "soft tissue synovial sarcoma": "Sarcoma",
        "unknown primary leiomyosarcoma": "Sarcoma",
        "unknown primary sarcomatoid carcinoma": "Sarcoma",
        "uterus endometrial stromal sarcoma": "Sarcoma",
        "uterus leiomyosarcoma": "Sarcoma",
        "skin adnexal carcinoma": "Skin, basal & squamous cancer",
        "skin basal cell carcinoma": "Skin, basal & squamous cancer",
        "skin squamous cell carcinoma": "Skin, basal & squamous cancer",
        "skin squamous cell carcinoma (scc)": "Skin, basal & squamous cancer",
        "vulva squamous cell carcinoma (scc)": "Skin, basal & squamous cancer",
        "thymus carcinoma (nos)": "Thymoma",
        "thymus thymoma (nos)": "Thymoma",
        "thyroid anaplastic carcinoma": "Thyroid cancer",
        "thyroid carcinoma (nos)": "Thyroid cancer",
        "thyroid follicular carcinoma": "Thyroid cancer",
        "thyroid medullary carcinoma": "Thyroid cancer",
        "thyroid papillary carcinoma": "Thyroid cancer",
        "pediatric unknown primary malignant neoplasm (nos)": "Unknown primary",
        "unknown primary, adenocarcinoma": "Unknown primary",
        "unknown primary, carcinoma (nos)": "Unknown primary",
        "unknown primary adenocarcinoma": "Unknown primary",
        "unknown primary adenoid cystic carcinoma": "Unknown primary",
        "unknown primary carcinoma (nos)": "Unknown primary",
        "unknown primary malignant neoplasm (nos)": "Unknown primary",
        "unknown primary squamous cell carcinoma (scc)": "Unknown primary",
        "fallopian tube serous carcinoma": "Uterine cancer",
        "uterus carcinosarcoma": "Uterine cancer",
        "uterus endometrial adenocarcinoma (nos)": "Uterine cancer",
        "uterus endometrial adenocarcinoma endometrioid": "Uterine cancer",
        "uterus endometrial adenocarcinoma papillary serous": "Uterine cancer"
    };

    $scope.studyStages = studyStages.studyStages;
    $http.get('http://www.cbioportal.org/webservice.do?cmd=getCancerStudies').then(function (data) {
        data = data.data.toLowerCase();
        data = data.split('\n');
        for (var i = 1; i < data.length; i++) {
            row = data[i].split('\t');
            $scope.cbioCancerStudies.push({
                id: row[0],
                name: row[1],
                description: row[2]
            });
        }
    });
}]);


module.directive('welcomeDirective', function ($http) {
    return {
        restrict: 'A',
        scope: {
            cancertypes: '=',
            cbiocancerstudies: '=',
            cancerdict: "=",
            patients: "="
        },
        link: link
    };

    function link(scope, element) {
        var cancerTypes = scope.cancertypes;
        var cbioCancerStudies = scope.cbiocancerstudies;
        var studies = [];
        var cancerDict = scope.cancerdict;
        var patients = scope.patients;
        var selectedPatient = null;
        var selectedType = null;
        var el = element[0];

        var message = d3.select(el).append("h4")
            .attr("id", "message")
            .html("");

        var cancerSelector = d3.select('#cancer-type-select');

        cancerSelector.append('option')
            .attr('selected', 'selected')
            .style('display', 'none')
            .html('Please select patient');

        cancerSelector.selectAll('patients')
            .data(patients)
            .enter()
            .append('option')
            .attr('value', function (d) {
                return d;
            })
            .html(function (d) {
                return d;
            });

        cancerSelector.on('change', function () {
            selectedPatient = this.options[this.selectedIndex].text;
            $http.get("http://fhirtest.uhn.ca/baseDstu3/Condition/" + selectedPatient + "-cond-1")
                .then(function (success) {
                        var FMdiagnosis = success.data.code.text;
                        if (cancerDict[FMdiagnosis.toLowerCase()] != undefined) {
                            selectedType = cancerDict[FMdiagnosis.toLowerCase()];
                            studies = cancerTypes[selectedType];
                            message.html("The patients condition from the FM report was " + FMdiagnosis + ". " +
                                "This mapped to the " + selectedType + " HemOnc solid tumor category.");

                        }
                        else {
                            d3.select('#table-description').remove();
                            d3.select('#selectorTable').remove();
                            d3.select('#submit-button').remove();
                            message.html("The patients condition couldn't be mapped from FM to a solid HemOnc tumor category. " +
                                "The condition of this patient from the FM report is " + FMdiagnosis);
                            studies = [];
                        }
                    },
                    function (error) {
                        d3.select('#table-description').remove();
                        d3.select('#selectorTable').remove();
                        d3.select('#submit-button').remove();
                        message.html("There was an error pulling the condition for this patient. Please see the console for details.");
                        console.log(error);
                    });
            setTimeout(function () {
                if (studies.length > 0) {
                    scope.$apply(function () {
                        //get all studies associated with cancer type
                        studies = getRelatedStudies(studies, cbioCancerStudies);
                        scope.$parent.selectedType = selectedType;
                        scope.$parent.tableData = studies;
                    });
                }
            }, 100);
        });

        scope.$watch('cbiocancerstudies', function (updated) {
            cbioCancerStudies = updated;
        });

    };
});

module.directive('confirmationTable', ['survival', function (survival) {
    return {
        restrict: 'A',
        scope: {
            selectedtype: '=',
            tabledata: '=',
            studystages: '='
        },
        link: link
    };

    function link(scope, element) {
        var tableData = scope.tabledata;
        var selectedType = scope.selectedtype;
        var studyStages = scope.studystages;
        var el = element[0];

        scope.$watch('selectedtype', function (updated) {
            selectedType = updated;
            d3.select('#table-description').remove();

            if (selectedType == null) {
                return;
            }

            d3.select('#table-header-div').append('h4')
                .attr('id', 'table-description')
                .html('cbioPortal Studies for ' + selectedType);
        });

        scope.$watch('tabledata', function (updated) {
            tableData = updated;
            d3.select('#selectorTable').remove();
            d3.select('#submit-button').remove();

            if (tableData == null) {
                return;
            }

            selectorTable('#table-div', ['Study ID', 'Name', 'Description', 'Has Stage Info?'], tableData, Object.keys(tableData[0]), studyStages);

            d3.select('#table-div')
                .append('button')
                .attr('id', 'submit-button')
                .attr('class', 'btn btn-default')
                .html('Submit')
                .on('click', function () {
                    survival.getSurvivalData(getChosenStudies(tableData));
                });
        });
    }
}]);

function getRelatedStudies(relatedArr, studiesArr) {
    if (relatedArr[0] == '') {
        return
    }
    var relatedStudies = [];
    for (var i = 0; i < relatedArr.length; i++) {
        for (var j = 0; j < studiesArr.length; j++) {
            if (studiesArr[j].id.indexOf(relatedArr[i]) != -1) {
                relatedStudies.push(studiesArr[j]);
            }
        }
    }
    return relatedStudies;
}

function selectorTable(element, headers, data, dataKeys, studyStages) {
    var table = d3.select(element).append('table')
        .attr('id', 'selectorTable')
        .attr('class', 'table table-bordered');

    data = studyHasStageInfo(data, studyStages);
    dataKeys.push('hasStageInfo');

    var header = table.append('thead').append('tr');

    header.selectAll('headers')
        .data([' '].concat(headers))
        .enter()
        .append('td')
        .html(function (d) {
            return d;
        });

    var body = table.append('tbody');
    addDataToSelectorTable(body, data, dataKeys)
}

function addDataToSelectorTable(tableBody, data, headers) {
    var dl = data.length;
    var hl = headers.length;
    for (var i = 0; i < dl; i++) {
        var row = tableBody.append('tr');
        if(data[i].hasStageInfo == 'Yes') {
            row.append('td')
                .html('<input id="check' + i +
                    '" type="checkbox" value="1" checked onchange="(this.value > 0) ? this.value = 0 : this.value = 1">');
        }
        else {
             row.append('td')
                .html('<input id="check' + i +
                    '" type="checkbox" value="0" onchange="(this.value > 0) ? this.value = 0 : this.value = 1">');
        }

        for (var j = 0; j < hl; j++) {
            row.append('td')
                .attr('id', 'cell' + i + j)
                .html(data[i][headers[j]]);
        }
    }
}

function studyHasStageInfo(data, studyStages) {
    var l = data.length;
    for(var i = 0; i < l; i++) {
        if(studyStages[data[i].id] != undefined) {
            data[i].hasStageInfo = 'Yes'
        }
        else {
            data[i].hasStageInfo = 'No';
        }
    }
    return data;
}

function changeCheckBox(checkbox) {
    var value = parseInt(checkbox.attr('value'));
    if (value > 0) {
        checkbox.attr('value', '0');
    }
    else {
        checkbox.attr('value', '1');
    }
}

function getChosenStudies(tableData) {
    var studies = [];
    var l = tableData.length;
    for (var i = 0; i < l; i++) {
        if (parseInt(d3.select('#check' + i).attr('value')) > 0) {
            studies.push(tableData[i].id);
        }
    }
    return studies;
}