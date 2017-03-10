/**
 * Created by jakeconway on 2/7/17.
 */

var module = angular.module('starter.controllers');

function extractData(dataArr, hasStages, columnNames) {
    var stageColumnNames = JSON.parse(JSON.stringify(columnNames));
    console.log(stageColumnNames, "--", columnNames);

    for (var i = 0; i < dataArr.length; i++) {
        dataArr[i] = dataArr[i].data.toLowerCase();
        if(dataArr[i].includes("os_months") == true && dataArr[i].includes("os_status") == true) {
            if (hasStages.indexOf(i) != -1) {
                dataArr[i] = dataArr[i].replace(columnNames[0], "stage");
                columnNames.shift();
            }
        }
        else {
            if (hasStages.indexOf(i) != -1) {
                stageColumnNames.splice(i, 1);
                columnNames.shift();
            }
        }
    }
    console.log(stageColumnNames);
    return [dataArr, stageColumnNames];
}

module.factory('survival', ['$http', '$q', 'studyStages', function ($http, $q, studyStages) {
    var survivalObj = {
        getSurvivalData: function (studyIDs) {
            var l = studyIDs.length;
            var survivalDataArr = [];
            var hasStages = [];
            var columnNames = [];
            studyStages = studyStages.studyStages;

            for (var i = 0; i < l; i++) {
                var setID = studyIDs[i] + '_all';
                if(studyStages[studyIDs[i]] != undefined) {
                    hasStages.push(i);
                    columnNames.push(studyStages[studyIDs[i]].toLowerCase());
                }
                survivalDataArr.push($http.get('http://www.cbioportal.org/webservice.do?cmd=getClinicalData&case_set_id=' + setID));
            }
            $q.all(survivalDataArr).then(function (dataArr) {
                var dataInfo = extractData(dataArr, hasStages, columnNames);
                survivalObj.survivalData = dataInfo[0];
                survivalObj.stageColumns = dataInfo[1];
                location.href = '#/app/survival';
            });
        },
        accessSurvivalData: function () {
            return survivalObj.survivalData;
        },
        transferKaplanMeierData: function($scope, kaplanMeierData) {
            $scope.kaplanMeierData.data = kaplanMeierData;
        },
        survivalData: null
    };
    return survivalObj;
}]);

module.controller('survivalCtrl', ['$scope', 'survival', function ($scope, survival) {
    $scope.survivalData = survival.survivalData;
    $scope.stageColumns = survival.stageColumns;
    $scope.kaplanMeierData = {
        data: []
    };
}]);

module.directive('survivalTable', function() {
   return {
       restrict: 'A',
       scope: {
           kaplanmeierdata: '='
       },
       link: link
   };
    function link(scope, element) {
        var el = element[0];
        var width = el.clientWidth;
        var height = el.clientHeight;
        var kaplanMeierData = scope.kaplanmeierdata.data;

        var svgHeight = $('#survival-curve-svg').height();
        var top = $('#survival-curve-svg').offset().top;

        var survivalTableDiv = d3.select(el).append('div')
            .attr('id', 'survival-curves')
            .style('height', '80%')
            .style('width', '80%')
            .style('left', '10%');

        scope.$watch("kaplanmeierdata", function(updatedData) {
            // some weird hacky thing to make the directive pick up the change.. note how I had to put it in a dictionary
            // initially to detect any changes when grouping by a feature
            if(updatedData.data == undefined) {
                kaplanMeierData = updatedData;
            }
            else {
                kaplanMeierData = updatedData.data;
            }
            if(kaplanMeierData[0].length > 10) {
                return;
            }

            d3.select('#selectorTable').remove();

            var table = survivalTableDiv.append('table')
                .attr('id', 'selectorTable')
                .attr('class', 'table table-bordered');

            var header = table.append('thead').append('tr');
            var groupHeader = header.append('td').html("Group");

            header.selectAll('headers')
                .data(kaplanMeierData[0])
                .enter()
                .append('td')
                .html(function (d) {
                    return d.minMonths + "-" + parseInt(d.maxMonths);
                });

            var body = table.append('tbody');

            var nRows = kaplanMeierData.length;
            for (var i = 0; i < nRows; i++) {
                var row = body.append('tr');
                row.append('td').html(kaplanMeierData[i][0].group + " ("  + kaplanMeierData[i][0].total + ")");
                var l = kaplanMeierData[i].length;
                var total = kaplanMeierData[i][0].total;
                var countToSubtract = 0;
                for(var j = 0; j < l; j++) {
                    countToSubtract = countToSubtract + kaplanMeierData[i][j].count;
                    row.append('td').html(function() {
                        var count = total - countToSubtract;
                        if(count > 0) {
                            return total - countToSubtract;
                        }
                        else {
                            return 0;
                        }
                    });
                }
            }


        });
    }
});

module.directive('survivalCurves', ['survival', 'studyStages', function (survival, studyStages) {
    return {
        restrict: 'A',
        scope: {
            survivaldata: '=',
            stagecolumns: '='
        },
        link: link
    };
    function link(scope, element) {
        var survivalData = scope.survivaldata;
        var stageColumns = scope.stagecolumns;
        var selectedFeature = 'none';
        survivalData = getViableDatasets(survivalData);
        d3.select(el).selectAll('h1').remove();
        if (survivalData == null || survivalData.length == 0) {
            d3.select(el).append('h1')
                .html('There was no studies for this cancer that had both survival months and survival status.')
        }

        var el = element[0];
        d3.select(el).style('height', function () {
            return $(window).height() + 'px';
        })
            .style('width', function () {
                return $(window).width() + 'px';
            });

        var usableFeatures = getSurvivalHeaders(survivalData);
        var featuresToRemove = ["case_id", "os_months", "df_months", "dfs_months"];
        survivalData = parseSurvivalData(survivalData, usableFeatures, studyStages, stageColumns);
        usableFeatures = removeFeatures(usableFeatures, featuresToRemove);

        var optionsDiv = d3.select(el).append('div')
            .attr('id', 'options-div');

        var featureSelectorLabel = optionsDiv.append('label')
            .attr('for', 'feature-select')
            .html('Group by');

        optionsDiv.append('br');

        var featureSelector = optionsDiv.append('select')
            .attr('id', 'feature-select')
            .attr('name', 'feature-select');

        optionsDiv.append('br');

        var nBinsLabel = optionsDiv.append('label')
            .attr('for', 'n-bin-select')
            .html('Number of Bins');

        optionsDiv.append('br');

        var nBinsSelector = optionsDiv.append('input')
            .attr('id', 'n-bin-select')
            .attr('name', 'n-bin-select')
            .attr('type', 'numeric')
            .attr('value', '10');

        var nBins = $('#n-bin-select').val();

        var survivalCurveDiv = d3.select(el).append('div')
            .attr('id', 'survival-curves')
            .style('height', '80%')
            .style('width', '80%')
            .style('left', '10%')
            .style('top', '2%');

        //default groupings to none
        featureSelector.append('option')
            .attr('selected', 'selected')
            .attr('value', 'none')
            .html('None');

        featureSelector.selectAll('features')
            .data(usableFeatures)
            .enter()
            .append('option')
            .attr('value', function (d) {
                return d;
            })
            .html(function (d) {
                return d;
            });

        featureSelector.on('change', function () {
            selectedFeature = this.value;
            svg.selectAll('*').remove();
            kaplanMeierData = groupByFeature(survivalData, selectedFeature);
            kaplanMeierData = convertToKaplanMeierArray(kaplanMeierData, maxSurvival, nBins);
            scope.$apply(function() {
               scope.$parent.$parent.kaplanMeierData = kaplanMeierData;
            });
            connectorData = generateConnectorLines(kaplanMeierData);
            plotSurvivalCurves(svg, svgHeight, svgWidth, kaplanMeierData, connectorData, xScale, yScale, xAxis, yAxis);
        });

        var svg = survivalCurveDiv.append('svg')
            .attr('id', 'survival-curve-svg')
            .attr('height', '100%')
            .attr('width', '100%');

        var svgHeight = $('#survival-curve-svg').height();
        var svgWidth = $('#survival-curve-svg').width();

        var maxDeceasedSurvival = findMaxDeceasedSurvival(survivalData);
        var maxSurvival = findMaxSurvival(survivalData);
        survivalData = removeUnplottableData(survivalData);
        var kaplanMeierData = groupByFeature(survivalData, selectedFeature);
        var censorData = gatherCensoringData(survivalData, maxDeceasedSurvival);
        kaplanMeierData = convertToKaplanMeierArray(kaplanMeierData, maxSurvival, nBins);
        survival.transferKaplanMeierData(scope.$parent, kaplanMeierData);
        var connectorData = generateConnectorLines(kaplanMeierData);


        var xScale = d3.scaleLinear()
            .domain([0, maxSurvival])
            .range([svgWidth * 0.05, svgWidth * 0.9]);

        var yScale = d3.scaleLinear()
            .domain([1, 0])
            .range([svgHeight * 0.1, svgHeight * 0.9]);

        var xAxis = d3.axisBottom(xScale);
        var yAxis = d3.axisLeft(yScale);

        plotSurvivalCurves(svg, svgHeight, svgWidth, kaplanMeierData, connectorData, xScale, yScale, xAxis, yAxis);

        d3.select('#n-bin-select')
            .on('change', function() {
                nBins = this.value;
                svg.selectAll('*').remove();
                kaplanMeierData = groupByFeature(survivalData, selectedFeature);
                kaplanMeierData = convertToKaplanMeierArray(kaplanMeierData, maxSurvival, nBins);
                connectorData = generateConnectorLines(kaplanMeierData);
                plotSurvivalCurves(svg, svgHeight, svgWidth, kaplanMeierData, connectorData, xScale, yScale, xAxis, yAxis);
            });

    }
}]);

//plot the survival curse
function plotSurvivalCurves(svg, svgHeight, svgWidth, kaplanMeierData, connectorData, xScale, yScale, xAxis, yAxis) {
    var ngroups = kaplanMeierData.length;
    var colors = ['red', 'blue', 'green', 'orange', '#808000', 'purple', '#ff00ff', 'brown', '#008080', '#800000'];

    svg.append("rect")
        .attr("x", function() {
            var svgWidth = $('#survival-curve-svg').width();
            return svgWidth * 0.65;
        })
        .attr("y", function () {
            return yScale(0.99);
        })
        .attr("width", function() {
            var svgWidth = $('#survival-curve-svg').width();
            return (svgWidth*0.95) - (svgWidth*0.65);
        })
        .attr("height", function() {
            return yScale(0.625) - yScale(0.99);
        })
        .style("stroke-width", 2)
        .style("stroke", "black")
        .style("fill", "#E7E7E7")
        .style("opacity", 0.8);

    //placing text in legend between 0.65 and 0.95 of y-axis
    var divider = 0.3/ngroups;
    for(var i = 0; i < ngroups; i++) {
        svg.append("text")
            .attr("x", function() {
                 var svgWidth = $('#survival-curve-svg').width();
                return svgWidth * 0.66;
            })
            .attr("y", function() {
                var position = 0.95 - (i * divider);
                return yScale(position);
            })
            .text(function() {
               return kaplanMeierData[i][0].group;
            })
            .style("font-family", "Times New Roman")
            .style("fill", colors[i]);
    }

    for(var group = 0; group < ngroups; group++) {
        var groupData = kaplanMeierData[group];
        var curve = svg.selectAll('bins')
            .data(groupData)
            .enter()
            .append('line')
            .attr('x1', function (d) {
                return xScale(d.minMonths);
            })
            .attr('y1', function (d) {
                return yScale(d.probability);
            })
            .attr('x2', function (d) {
                return xScale(d.maxMonths);
            })
            .attr('y2', function (d) {
                return yScale(d.probability);
            })
            .style('stroke', colors[group]);

        var groupConnectors = connectorData[group];
        var connectors = svg.selectAll('connectors')
            .data(groupConnectors)
            .enter()
            .append('line')
            .attr('x1', function (d) {
                return xScale(d.x1);
            })
            .attr('y1', function (d) {
                return yScale(d.y1);
            })
            .attr('x2', function (d) {
                return xScale(d.x2);
            })
            .attr('y2', function (d) {
                return yScale(d.y2);
            })
            .style('stroke', colors[group]);
    }

    var xAxisText = svg.append('text')
        .attr('x', svgWidth * 0.45)
        .attr('y', svgHeight * 0.98)
        .html('Survival Months');

    var yAxisText = svg.append('text')
        .attr('x', svgWidth * 0.01)
        .attr('y', svgHeight * 0.5)
        .attr('text-anchor', 'middle')
        .attr('transform', function() {
            return 'rotate(270,'+ svgWidth*0.025 + ',' + svgHeight*0.5 + ')';
        })
        .html('Probability');


    svg.append('svg:g')
    //.attr('class', 'axis')
        .attr('transform', 'translate(0,' + (svgHeight - svgHeight * 0.1) + ')')
        .call(xAxis);

    svg.append('svg:g')
    //.attr('class', 'axis')
        .attr('transform', 'translate(' + svgWidth * 0.05 + ', 0)')
        .call(yAxis);
}

//group the survival data by the selected feature
function groupByFeature(kaplanMeierData, selectedFeature) {
    if(selectedFeature == 'none') {
        return d3.nest().key(function() {
            return 'none';
        }).entries(kaplanMeierData);
    }
    else {
        return d3.nest().key(function (d) {
            if (d[selectedFeature] == undefined && selectedFeature) {
                return 'unknown';
            }
            else {
                return d[selectedFeature];
            }
        }).entries(kaplanMeierData);
    }
}

//get censoring information to plot censoring points along connector lines
function gatherCensoringData(survivalData, maxDeceasedSurvival) {
    var censorData = d3.nest()
        .key(function(d) {
            if(d.os_status == "living" && d.os_months < maxDeceasedSurvival) {
                return "censored";
            }
            else {
                return "uncensored";
            }
        })
        .entries(survivalData);

    return getOnlyCensoredData(censorData);
}

function getOnlyCensoredData(censorData) {
    var l = censorData.length;
    for(var i = 0; i < l; i++) {
        if(censorData[i].key == "censored") {
            return censorData[i].values;
        }
    }
}

//generate the vertical lines in the plot for each group
function generateConnectorLines(kaplanMeierData) {
    var ngroups = kaplanMeierData.length;
    var connectorData = [];
    for(var group = 0; group < ngroups; group++) {
        var groupData = kaplanMeierData[group];
        var l = groupData.length - 1;
        var groupConnectors = [];
        for (var i = 0; i < l; i++) {
            groupConnectors.push({
                x1: groupData[i].maxMonths,
                x2: groupData[i].maxMonths,
                y1: groupData[i].probability,
                y2: groupData[i + 1].probability
            });
        }
        connectorData.push(groupConnectors);
    }
    return connectorData;
}

//array to mimic Kaplan-Meier table
function convertToKaplanMeierArray(kaplanMeierData, maxSurvival, nbins) {
    var divider = calculateBinDivider(maxSurvival, nbins);
    var ngroups = kaplanMeierData.length;
    for(var group = 0; group < ngroups; group++) {
        var table = [];
        // going to be used to see what we need to fill in
        var binsOccupied = [];
        var bySurvivalMonths = d3.nest()
            .key(function (d) {
                var bin = parseInt((d.os_months / divider).toFixed(1));
                if (bin == nbins) {
                    return bin - 1;
                }
                return bin;
            })
            .entries(kaplanMeierData[group].values);

        bySurvivalMonths = sortByKey(bySurvivalMonths, 'key');
        var l = bySurvivalMonths.length;
        //initialize the first bin to keep rounding of month intervals consistent
        var total = 0;
        table[0] = {};
        table[0].bin = parseInt(bySurvivalMonths[0].key);
        table[0].count = bySurvivalMonths[0].values.length;
        table[0].minMonths = Math.round(table[0].bin * divider, 1);
        table[0].maxMonths = Math.round(table[0].minMonths + divider, 1);
        total = total + table[0].count;
        binsOccupied.push(bySurvivalMonths[0].key);
        for (var i = 1; i < l; i++) {
            table.push({
                bin: parseInt(bySurvivalMonths[i].key),
                count: bySurvivalMonths[i].values.length,
                minMonths: table[i - 1].maxMonths,
                maxMonths: Math.round(table[i - 1].maxMonths + divider, 1)
            });
            total = total + table[i].count;
            binsOccupied.push(bySurvivalMonths[i].key);
        }
        if(table.length != nbins) {
            table = fillConnectorGaps(table, binsOccupied, divider, nbins);
        }
        table[table.length-1].maxMonths = maxSurvival;
        var groupName = kaplanMeierData[group].key;
        kaplanMeierData[group] = calculateSurvivalProbabilities(table, total, groupName);
    }
    return kaplanMeierData;
}

//fill in the gaps where we would otherwise have no connector lines because no data falls into bin!
function fillConnectorGaps(table, binsOccupied, divider, nbins) {
    var completeTable = [];
    var reference = binsOccupied[0];
    if(reference != 0) {
        completeTable.push({
            bin: 0,
            count: 0,
            minMonths: 0,
            maxMonths: Math.round(divider, 1)
        });
        reference = JSON.parse(JSON.stringify(completeTable[0]));
    }
    else {
        reference = table[0];
        completeTable.push(reference);
        reference = JSON.parse(JSON.stringify(reference));
        table.shift();
    }
    for(var i = 1; i < nbins; i++) {
        if(binsOccupied.indexOf(i.toString()) > -1) {
            reference = table[0];
            reference.minMonths = completeTable[i - 1].maxMonths;
            reference.maxMonths = Math.round(completeTable[i - 1].maxMonths + divider, 1);
            completeTable.push(reference);
            reference = JSON.parse(JSON.stringify(reference));
            table.shift();
            continue;
        }
        else {
            reference.bin = i;
            reference.minMonths = completeTable[i - 1].maxMonths;
            reference.maxMonths = Math.round(completeTable[i - 1].maxMonths + divider, 1);
            completeTable.push(reference);
            reference = JSON.parse(JSON.stringify(reference));
            continue;
        }
    }
    completeTable.sort(function(a, b) {
       return parseInt(a.bin) - parseInt(b.bin);
    });
    return completeTable;
}

//calculate the increment of each bin, based on the number of bins chosen
function calculateBinDivider(total, n) {
    return total / n;
}

//calculate the survival probability for a group/cohort
function calculateSurvivalProbabilities(KaplanMeierArr, total, group) {
    var l = KaplanMeierArr.length;
    var probabilitySurvival = 1;
    for (var i = 0; i < l; i++) {
        KaplanMeierArr[i].total = total;
        KaplanMeierArr[i].group = group;
        var probability = probabilitySurvival - parseFloat((KaplanMeierArr[i].count / total));
        probability = parseFloat(probability);
        probabilitySurvival = probability;
        if (probabilitySurvival < 0) {
            probability = 0;
            probabilitySurvival = 0;
        }
        KaplanMeierArr[i].probability = probability;
    }
    return KaplanMeierArr;
}

//function to sort by month bins
function sortByKey(KaplanMeierArr, key) {
    return KaplanMeierArr.sort(function(a, b) {
       return parseInt(a[key]) - parseInt(b[key]);
    });
}

//remove all data with no survival month value
//and where status is living but most recent survival months update is < maximum months to death
function removeUnplottableData(survivalData) {
    var byStatusData = d3.nest()
        .key(function (d) {
            return d.os_status;
        })
        .entries(survivalData);
    var statuses = ['deceased', 'living'];
    byStatusData = removeUndefinedStatusData(byStatusData, statuses);
    byStatusData = d3.nest()
        .key(function(d) {
            if(isNaN(d.os_months) == false) {
                return false;
            }
            else {
                return true;
            }
        })
        .entries(byStatusData);
    return removeNonNumericMonthData(byStatusData);
}

function removeNonNumericMonthData(byStatusData) {
    var l = byStatusData.length;
    for(var i = 0; i < l; i++) {
        if(byStatusData[i].key == "false") {
            return byStatusData[i].values;
        }
    }
}

function removeUndefinedStatusData(byStatusData, statuses) {
    var l = byStatusData.length;
    var dataArr = [];
    for(var i = 0; i < l; i++) {
        if(statuses.indexOf(byStatusData[i].key) > -1) {
            dataArr = dataArr.concat(byStatusData[i].values);
        }
    }
    return dataArr;
}

function removeFeatures(usableFeatures, featuresToRemove) {
    var l = featuresToRemove.length;
    for(var i = 0; i < l; i++) {
        var index = usableFeatures.indexOf(featuresToRemove[i]);
        if (index > -1) {
            usableFeatures.splice(index, 1);
        }
    }
    return usableFeatures;
}

//find the maximum survival month for person who's deceased
function findMaxDeceasedSurvival(survivalData) {
    var byStatusData = d3.nest()
        .key(function (d) {
            return d.os_status;
        })
        .entries(survivalData);

    var index = getObjectIndex(byStatusData, 'deceased');

    return Math.max.apply(Math, byStatusData[index].values.map(function (obj) {
        return obj.os_months;
    }));
}

//find the maximum survival month
function findMaxSurvival(survivalData) {
    return Math.max.apply(Math, survivalData.map(function (obj) {
        if (isNaN(obj.os_months) == false) {
            return obj.os_months;
        }
        else {
            return 0;
        }
    }));
}

//get the index of an object in an array of objects
function getObjectIndex(array, value) {
    var l = array.length;
    for (var i = 0; i < l; i++) {
        if (array[i].key = value) {
            return i;
        }
    }
}

//parse selected survival data
function parseSurvivalData(survivalArr, selectedParams, studyStages, stageColumns) {
    var l = survivalArr.length;
    console.log(stageColumns.length, "---", l);
    var survivalData = [];
    //loop through all of the datasets we're pulling survival data from
    for (var i = 0; i < l; i++) {
        var currentStudyData = [];
        var data = survivalArr[i].split('\n');
        var header = data[0];
        //get the parameters we've selected (Required: survival months and survival status)
        var paramIndices = getParamIndices(header.split('\t'), selectedParams);
        //loop through the rows of the current dataset and extract data of selected parameters (features)
        var dl = data.length;
        if(selectedParams.indexOf("stage") != -1) {
            for (var j = 1; j < dl; j++) {
                currentStudyData.push(grabSurvivalFeatures(data[j].split('\t'), paramIndices, selectedParams));
                currentStudyData[j-1].stage = studyStages[stageColumns[i].toUpperCase()](currentStudyData[j-1].stage);
            }
        }
        else {
            for (var j = 1; j < dl; j++) {
                currentStudyData.push(grabSurvivalFeatures(data[j].split('\t'), paramIndices, selectedParams));
            }
        }
        survivalData = survivalData.concat(currentStudyData);
    }
    return survivalData;
}

//get the values of the selected features
function grabSurvivalFeatures(row, paramIndices, selectedParams) {
    var featureObj = {};
    for (var i = 0; i < paramIndices.length; i++) {
        featureObj[selectedParams[i]] = row[paramIndices[i]];
    }
    return featureObj;
}

//get the indices of the available features from headers of the datasets
function getParamIndices(header, selectedParams) {
    var paramsIndices = [];
    var l = selectedParams.length;
    var adjustables = ['race', 'sex'];
    var replacements = ['ethnicity', 'gender'];
    for (var i = 0; i < l; i++) {
        var index = header.indexOf(selectedParams[i]);
        if(index == -1) {
            var replacement_index = replacements.indexOf(selectedParams[i]);
            if(replacement_index != -1) {
                var replacement = adjustables[replacement_index];
                index = header.indexOf(replacement);
            }
        }
        paramsIndices.push(index);
    }
    return paramsIndices;
}

//get all of the headers that are present in all of the viable datasets
function getSurvivalHeaders(survivalArr) {
    var l = survivalArr.length;
    //if there is only one dataset selected, we can use any of the headers as features
    if (l == 1) {
        return survivalArr[0].split('\n')[0].split('\t');
    }
    var headersDict = {};
    var acrossAll = [];
    for (var i = 0; i < l; i++) {
        //manually seek out these features and force them to be common... these are our main features of interest
        var adjustables = ['race', 'sex'];
        //the common names we want to use
        var replacements = ['ethnicity', 'gender'];

        var headers = survivalArr[i].split('\n')[0];
        headers = headers.split('\t');
        var hl = headers.length;
        for (var j = 0; j < hl; j++) {
            //while there is still potential that there is mislabled feature of interest remaining, check
            if (adjustables.length > 0) {
                var adjustments = adjustHeader(adjustables, replacements, headers[j]);
                headers[j] = adjustments.header;
                adjustables = adjustments.adjustables;
                replacements = adjustments.replacements;
            }
            //if this is our first time encountering a feature, add it to the dictionary
            if (headersDict[headers[j]] == undefined) {
                headersDict[headers[j]] = 1;
            }
            //otherwise bump up the number of times we've seen it
            else {
                headersDict[headers[j]] = headersDict[headers[j]] + 1;
                //if we've seen it in every dataset, it can be used as a feature
                if (headersDict[headers[j]] == l) {
                    acrossAll.push(headers[j]);
                }
            }
        }
    }
    return acrossAll;
}

//adjust the headers that we are manually looking out for... these are our main features of interest (see above)
function adjustHeader(adjustables, replacements, header) {
    var l = adjustables.length;
    for (var i = 0; i < l; i++) {
        var index = header.indexOf(adjustables[i]);
        if (index != -1) {
            header = replacements[i];
            adjustables.splice(i, 1);
            replacements.splice(i, 1);
        }
    }
    return {
        header: header,
        adjustables: adjustables,
        replacements: replacements
    };
}

//change the stage column of any study that has stage information
function changeStageColumnName(dataArr, studyStages) {
    var l = dataArr.length;
    for(var i = 0; i < dataArr; i++) {

    }
}

//from the selected datasets make sure that we have survival status and survival months
//although cbioportal says these are required columns, they are missing from some datasets
function getViableDatasets(survivalArr) {
    var l = survivalArr.length;
    var viable = [];
    for (var i = 0; i < l; i++) {
        var header = survivalArr[i].split('\n')[0];
        header = header.split('\t');
        if (header.indexOf('os_status') != -1 && header.indexOf('os_months') != -1) {
            viable.push(survivalArr[i]);
        }
    }
    return viable;
}

//determine if variable is an integer
//note: "1" is not an integer, but 1 is
function isInteger(value) {
    return /^\d+$/.test(value);
}

function repeatLetter(stage) {
    if(stage == 0) {
        return undefined;
    }
    if(stage == 4) {
        return "IV";
    }
    //Faster to use loop.. see here: http://stackoverflow.com/questions/1877475/repeat-character-n-times
    var str = "";
    for (var i = 0; i < stage; i++) {
        str = str + "I";
    }
    return str;
}

//If the value of the tumor stage column is represented with Roman numerals
function stageHasIs(stage) {
    if (stage == "NA" || stage == "") {
        return undefined;
    }
    if (stage == " " || stage == undefined) {
        return undefined;
    }
    else {
        if(stage.includes("iv")) {
            return "IV";
        }
        var numOfI = stage.replace(/[^i]/g, "").length;
        var str = repeatLetter(numOfI);
        return str;
    }
}

function fromNMTStage(stage, letter) {
    if(stage == "" || stage == " ") {
        return undefined;
    }
    if(stage == undefined) {
        return undefined;
    }
    else {
        var num = stage.split(letter);
        if(num.length < 2) {
            return undefined;
        }
        else {
         num = num[1].charAt(0);
            if(isInteger(num)) {
                var str = repeatLetter(num);
                return str;
            }
            else {
                return undefined;
            }
        }
    }
}