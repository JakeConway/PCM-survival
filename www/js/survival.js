/**
 * Created by jakeconway on 2/7/17.
 */

var module = angular.module('starter.controllers');

function onlyData(dataArr) {
    for (var i = 0; i < dataArr.length; i++) {
        dataArr[i] = dataArr[i].data.toLowerCase();
    }
    return dataArr;
}

module.factory('survival', ['$http', '$q', function ($http, $q) {
    var survivalObj = {
        getSurvivalData: function (studyIDs) {
            var l = studyIDs.length;
            var survivalDataArr = [];

            for (var i = 0; i < l; i++) {
                var setID = studyIDs[i] + '_all';
                survivalDataArr.push($http.get('http://www.cbioportal.org/webservice.do?cmd=getClinicalData&case_set_id=' + setID));
            }
            $q.all(survivalDataArr).then(function (dataArr) {
                survivalObj.survivalData = onlyData(dataArr);
                location.href = '#/app/survival';
            });
        },
        accessSurvivalData: function () {
            return survivalObj.survivalData;
        },
        survivalData: null
    };
    return survivalObj;
}]);

module.controller('survivalCtrl', ['$scope', 'survival', function ($scope, survival) {
    $scope.survivalData = survival.survivalData;

}]);

module.directive('survivalCurves', ['survival', function (survival) {
    return {
        restrict: 'A',
        scope: {
            survivaldata: '='
        },
        link: link
    };
    function link(scope, element) {
        var survivalData = scope.survivaldata;
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
        survivalData = parseSurvivalData(survivalData, usableFeatures);
        usableFeatures = removeOS_Months(usableFeatures);

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
        survivalData = removeUnplottableData(survivalData, maxDeceasedSurvival);
        var kaplanMeierData = groupByFeature(survivalData, selectedFeature);
        kaplanMeierData = convertToKaplanMeierArray(kaplanMeierData, maxSurvival, nBins);
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
    var colors = ['red', 'blue', 'green', 'orange', 'yellow', 'purple', 'pink', 'brown'];
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

//remove os_months from grouping options
function removeOS_Months(features) {
    features.splice(features.indexOf('os_months'), 1);
    return features;
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
            if (d[selectedFeature] == undefined) {
                return 'unknown';
            }
            else {
                return d[selectedFeature];
            }
        }).entries(kaplanMeierData);
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
        for (var i = 1; i < l; i++) {
            table.push({
                bin: parseInt(bySurvivalMonths[i].key),
                count: bySurvivalMonths[i].values.length,
                minMonths: table[i - 1].maxMonths,
                maxMonths: Math.round(table[i - 1].maxMonths + divider, 1)
            });
            total = total + table[i].count;
        }
        var groupName = kaplanMeierData[group].key;
        kaplanMeierData[group] = calculateSurvivalProbabilities(table, total, groupName);

    }
    return kaplanMeierData;
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
function removeUnplottableData(survivalData, maxDeceasedSurvival) {
    var byStatusData = d3.nest()
        .key(function (d) {
            return d.os_status;
        })
        .entries(survivalData);

    var statuses = ['deceased', 'living'];
    var indices = getIndicesOfObjects(byStatusData, statuses);
    var livingData = byStatusData[indices[1]].values;
    var l = livingData.length;
    var viableLivingData = [];
    for (var i = 0; i < l; i++) {
        if (livingData[i].os_months > maxDeceasedSurvival) {
            viableLivingData.push(livingData[i]);
        }
    }
    return byStatusData[indices[0]].values.concat(viableLivingData);
}

//get indices of multiple objects in an array based on some value
function getIndicesOfObjects(array, values) {
    var l = values.length;
    var indices = [];
    for (var i = 0; i < l; i++) {
        indices.push(getObjectIndex(array, values[i]));
    }
    return indices;
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
        if (isInteger(obj.os_months)) {
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
function parseSurvivalData(survivalArr, selectedParams) {
    var l = survivalArr.length;
    var survivalData = [];
    //loop through all of the datasets we're pulling survival data from
    for (var i = 0; i < l; i++) {
        var data = survivalArr[i].split('\n');
        var header = data[0];
        //get the parameters we've selected (Required: survival months and survival status)
        var paramIndices = getParamIndices(header.split('\t'), selectedParams);
        //loop through the rows of the current dataset and extract data of selected parameters (features)
        var dl = data.length;
        for (var j = 1; j < dl; j++) {
            survivalData.push(grabSurvivalFeatures(data[j].split('\t'), paramIndices, selectedParams));
        }
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
    var adjustables = ['stage', 'race', 'sex'];
    var replacements = ['stage', 'ethnicity', 'gender'];
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
    //console.log(selectedParams);
    //console.log(paramsIndices);
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
        var adjustables = ['stage', 'race', 'sex'];
        //the common names we want to use
        var replacements = ['stage', 'ethnicity', 'gender'];

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