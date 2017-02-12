/**
 * Created by jakeconway on 2/5/17.
 */

var module = angular.module('starter.controllers');


module.controller('welcomeCtrl', function ($scope, $http) {
    $scope.selectedType = null;
    $scope.tableData = null;
    //name: what shows up in selection list, value: what is used to search cbioportal cancers
    $scope.cancerTypes = [
        {name: 'Anal cancer', value: []},
        {name: 'Bladder cancer', value: ['blca']},
        {name: 'Breast cancer', value: ['acbc', 'brca']},
        {name: 'Central nervous system (CNS) cancer', value: ['lgg', 'gbm', 'lgg', 'mpnst', 'mbl', 'pcnsl']},
        {name: 'Cervical cancer', value: ['cesc']},
        {name: 'Colon cancer', value: ['coad']},
        {name: 'Esophageal cancer', value: ['esca', 'escc']},
        {name: 'Ewing\'s sarcoma', value: ['es']},
        {name: 'Gastric cancer', value: ['egc', 'stad']},
        {name: 'Germ cell tumors', value: ['tgct']},
        {name: 'Head and neck cancer', value: ['acyc', 'hnsc', 'npc', 'hnsc', 'hnc']},
        {name: 'Hepatobiliary cancer', value: ['chol', 'gbc', 'liad', 'lihc']},
        {name: 'Lung cancer, non-small cell', value: ['luad', 'lusc', 'nsclc']},
        {name: 'Lung cancer, small cell', value: ['sclc']},
        {name: 'Melanoma', value: ['desm', 'skcm', 'uvm']},
        {name: 'Merkel cell carcinoma', value: []},
        {name: 'Mesothelioma', value: ['plmeso', 'meso']},
        {name: 'Neuroblastoma', value: ['acc', 'nbl', 'pcpg']},
        {name: 'Neuroendocrine tumors', value: ['panet', 'nepc']},
        {name: 'Osteosarcoma', value: []},
        {name: 'Ovarian cancer', value: ['ov', 'scco']},
        {name: 'Pancreatic cancer', value: ['paac', 'paad']},
        {name: 'Penile cancer', value: []},
        {name: 'Prostate cancer', value: ['prad']},
        {name: 'Rectal cancer', value: ['read']},
        {name: 'Renal cancer', value: ['ccrcc', 'kich', 'kirc', 'kirp', 'urcc']},
        {name: 'Sarcoma', value: ['rms', 'sarc']},
        {name: 'Skin,basal & squamous cancer', value: ['cscc']},
        {name: 'Testicular cancer', value: ['tgct']}, //tgct is actually germ cell, but there were no other testicualrs
        {name: 'Thymoma', value: ['tet', 'thym']},
        {name: 'Thyroid cancer', value: ['thca', 'thyroid']},
        {name: 'Unknown primary', value: []},
        {name: 'Uterine cancer', value: ['ucs', 'ucec']}
    ];
    $scope.cbioCancerStudies = [];

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
});


module.directive('welcomeDirective', function ($http) {
    return {
        restrict: 'A',
        scope: {
            cancertypes: '=',
            cbiocancerstudies: '='
        },
        link: link
    };

    function link(scope, element) {
        var cancerTypes = scope.cancertypes;
        var cbioCancerStudies = scope.cbiocancerstudies;
        var selectedType = null;
        var selectTypeInfo = [];
        var el = element[0];

        var cancerSelector = d3.select('#cancer-type-select');

        cancerSelector.append('option')
            .attr('selected', 'selected')
            .style('display', 'none')
            .html('Please select cancer type');

        cancerSelector.selectAll('cancers')
            .data(cancerTypes)
            .enter()
            .append('option')
            .attr('value', function (d) {
                return d.value;
            })
            .html(function (d) {
                return d.name;
            });

        cancerSelector.on('change', function () {
            selectedType = this.options[this.selectedIndex].text;
            selectTypeInfo = getRelatedStudies(this.value.split(','), cbioCancerStudies);
            scope.$apply(function () {
                scope.$parent.selectedType = selectedType;
                scope.$parent.tableData = selectTypeInfo;
            });
        });

        scope.$watch('cbiocancerstudies', function (updated) {
            cbioCancerStudies = updated;
        });

    };
});

module.directive('confirmationTable',['survival', function (survival) {
    return {
        restrict: 'A',
        scope: {
            selectedtype: '=',
            tabledata: '='
        },
        link: link
    };

    function link(scope, element) {
        var tableData = scope.tabledata;
        var selectedType = scope.selectedtype;
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

            selectorTable('#table-div', ['Study ID', 'Name', 'Description'], tableData, Object.keys(tableData[0]));

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

function selectorTable(element, headers, data, dataKeys) {
    var table = d3.select(element).append('table')
        .attr('id', 'selectorTable')
        .attr('class', 'table table-bordered');

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
        row.append('td')
            .html('<input id="check'+ i +
                '" type="checkbox" value="1" checked onchange="(this.value > 0) ? this.value = 0 : this.value = 1">');

        for (var j = 0; j < hl; j++) {
            row.append('td')
                .attr('id', 'cell'+i+j)
                .html(data[i][headers[j]]);
        }
    }
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
    for(var i = 0; i < l; i++) {
        if(parseInt(d3.select('#check'+i).attr('value')) > 0){
            studies.push(tableData[i].id);
        }
    }
    return studies;
}