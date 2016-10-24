var url = "/bankanalysis";
databank = ko.observableArray([]);
var abbavg = 0;
var abbavgs = 0;
var idx = ko.observable();
var ebitdamargin = {}
var finalsummary = []
var odutilmax = 0
var fundbased = {
    accounttype : ko.observable(""),
    accountno : ko.observable(""),
    accountholder : ko.observable(""),
    sanclimit : ko.observable(""),
    roi : ko.observable(""),
    interestpermonth : ko.observable(""),
    sanctiondate : ko.observable(""),
    securityoffb : ko.observable("")
}
var nonfundbased = {
    natureoffacility : ko.observable(""),
    othernatureoffacility : ko.observable(""),
    sanclimit : ko.observable(""),
    sanctiondate : ko.observable(""),
    securityofnfb : ko.observable(""),
}
var currentbased = {
    accounttype: ko.observable(""),
    accountno: ko.observable(""),
    accountholder: ko.observable("")
}

var fbselected = ko.observable(false)
var nfbselected = ko.observable(false)
var currentselected = ko.observable(false)

var bankaccount = {
    bankname : ko.observable(""),
    facilitytype : ko.observableArray([]),
    bankstttill : ko.observable(""),
    fundbased : {},
    nonfundbased : {},
    currentbased : {},
}
var getSearchVal = function(){
    return {
        CustomerId: parseInt(filter().CustomerSearchVal()),
        DealNo: filter().DealNumberSearchVal()
    };
}
var refreshFilter = function(){
    DrawDataBank(getSearchVal());
    setdatestt()
}

var setdatestt = function(){
    ajaxPost(url+"/getdatetemplate",getSearchVal(),function(res){
        //console.log(res.data.length)
        if (res.data.length > 0){
            //console.log(res.data[0].BankDetails[0].Month)
            $('#bankstt').data('kendoDatePicker').value(res.data[0].BankDetails[0].Month)
        }
    })
}

var disableSpinner = function(container, options){
    $('<input data-bind="value:' + options.field + '"/>')
    .appendTo(container)
    .kendoNumericTextBox({
        spinners : false,
        min: 0,
    });
}
var disableInputSpinner = function(id){
    var numeric = $("#"+id).data("kendoNumericTextBox");
    numeric.wrapper
   .find(".k-numeric-wrap")
       .addClass("expand-padding")
       .find(".k-select").hide();
}
var onNatureChange = function(){
    var selected = $("#naturefacility").data("kendoDropDownList").value();
    if (selected == "Other"){
        $("#othernf").show();
    }else{
        $("#othernf").hide();
    }
}
function numChange(){
    try{
        var sanc = parseFloat($("#sanclimit").val());
        var roi = parseFloat($("#roiperannum").val());
        var res = sanc*(roi/100)/12;
        $("#interestpermonth").val( kendo.toString(res,'N1').split(",").join("") );
    }
    catch(e){
        //console.log(e);
    }
}
function resetInput(){
    $('#bankdetailgridform').html("");
    $('#currentbankdetailgridform').html("");
    $('#nfb').hide();
    $('#fb').hide();
    $('#current').hide();
    $('#othernf').hide();
    $('#facilitytype').getKendoMultiSelect().value("")
    $('#actype').data('kendoDropDownList').select(0);
    $('#naturefacility').data('kendoDropDownList').select(0);
    $('#fbsanctiondate').data('kendoDatePicker').value(null);
    $('#nfbsanctiondate').data('kendoDatePicker').value(null);
    $('#bankstt').data('kendoDatePicker').value(null);
    $('input[name=fb]').attr('checked',false);
    $('input[name=nfb]').attr('checked',false);
    $('input[name=both]').attr('checked',false);
    $("#bankname").val("");
    $("#actype").val("");
    $("#acno").val("");
    $("#acholder").val("");
    $("#sanclimit").val("");
    $("#roiperannum").val("");
    $("#interestpermonth").val("");
    $("#securityfb").val("");
    //$("#naturefacility").val("");
    $("#othernaturefacility").val("");
    $("#nfbsanclimit").val("");
    $("#securitynfb").val("");
    $('#samenfb').attr('checked', false);
    $('#currentacno').val('')
    $('#currentacholder').val('')
}

///Create Grid Data Bank///
var DrawDataBank = function(id){
    ajaxPost(url+"/getdatabankv2", id, function(res){
        var c = true;
        _.each(res.data.Detail, function(p){
            if(!p.IsConfirmed){
                c = false;
                return;
            }
        });

        if(c && res.data.Detail.length != 0){
            $('.form-last-confirmation-info').html('Last confirmed on: '+kendo.toString(new Date(res.data.Detail[0].DateConfirmed),"dd-MM-yyyy h:mm:ss tt") )
            $('#bconfirm').removeClass('btn-confirm').addClass('btn-reenter').html("Re Enter");
        } else {
            $('.form-last-confirmation-info').html('')
            $('#bconfirm').removeClass('btn-reenter').addClass('btn-confirm').html("Confirm All");
        }
        constructOdccModel(res);
        databank(res.data.Detail);
        setTimeout(function() {
            databank().forEach(function(e,i) {
                RenderGridDataBank(i,e);
            }, this);
                generateAML(res.data);
        }, 200);
        
        var customermargin = res.data.AccountDetail[0].accountsetupdetails.pdinfo.customermargin
        idxlatestaudited = _.findLastIndex(res.data.Ratio.Data.AuditStatus,['Status','AUDITED'])
        latestauditeddate = res.data.Ratio.Data.AuditStatus[idxlatestaudited].Date
        ebitdamargin = _.find(res.data.Ratio.Data.FormData,{'FieldAlias':"EBITDAMARGIN"})
        var latestebidmargin = _.find(ebitdamargin.Values,{'Date':latestauditeddate}).Value
        var multiplyer = _.min([latestebidmargin,customermargin])
        
        for (var i = 0 ; i < res.data.Summary.length ; i++){
            res.data.Summary[i].ImpMargin = multiplyer*res.data.Summary[i].TotalCredit
        }
        
        createBankingGrid(res.data.Summary,multiplyer);
    });
}

var RenderGridDataBank = function(id, res){
    var fund = [];
    fund.push(res.DataBank[0].BankAccount.FundBased);
    var nonfund = [];
    nonfund.push(res.DataBank[0].BankAccount.NonFundBased);
    var current = [];
    current.push(res.DataBank[0].BankAccount.CurrentBased);
    var factype = res.DataBank[0].BankAccount.FacilityType;

    $('#fundgrid'+id).kendoGrid({
        dataSource : fund,
        scrollable:false,
        columns :[
            {
                title : 'Account Type',
                field : 'AccountType',
                headerAttributes: { "class": "sub-bgcolor" },
            },
            {
                title : 'Account Holder',
                field : 'AccountHolder',
                headerAttributes: { "class": "sub-bgcolor" },
            },
            {
                title : 'Account No',
                field : 'AccountNo',
                headerAttributes: { "class": "sub-bgcolor" },
            },
            {
                title : 'ROI',
                field : 'ROI',
                headerAttributes: { "class": "sub-bgcolor" },
            },
            {
                title : 'Sanction Limit',
                field : 'SancLimit',
                headerAttributes: { "class": "sub-bgcolor" },
                template : "#: app.formatnum( SancLimit ) #"
            },
            {
                title : 'Sanction Date',
                field : 'SanctionDate',
                headerAttributes: { "class": "sub-bgcolor" },
                template: "#= kendo.toString(moment.utc(SanctionDate).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #",
            },
            {
                title : 'Interest Per Month',
                field : 'InterestPerMonth',
                headerAttributes: { "class": "sub-bgcolor" },
            },
            // {
            //     title : 'Security For FB',
            //     field : 'SecurityOfFB',
            // },
        ]
    });

    $('#nonfundgrid'+id).kendoGrid({
        dataSource : nonfund,
        columns :[
            {
                title : 'Nature Of Facility',
                headerAttributes: { "class": "sub-bgcolor" },
                width : 150,
                field : 'NatureOfFacility',
            },
            {
                title : 'Sanction Limit',
                headerAttributes: { "class": "sub-bgcolor" },
                width : 150,
                field : 'SancLimit',
                template : "#: app.formatnum( SancLimit ) #"
            },
            {
                title : 'Sanction Date',
                field : 'SanctionDate',
                headerAttributes: { "class": "sub-bgcolor" },
                width : 150,
                template: "#= kendo.toString(moment.utc(SanctionDate).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #",
            },
            {
                title : 'Security for NFB',
                field : 'SecurityOfNFB',
                headerAttributes: { "class": "sub-bgcolor" },
            },
        ]
    });

    $('#currentgrid'+id).kendoGrid({
        dataSource:current,
        scrollable:false,
        columns :[
            {
                title : 'Account Type',
                field : 'AccountType',
                headerAttributes: { "class": "sub-bgcolor" },
            },
            {
                title : 'Account Holder',
                field : 'AccountHolder',
                headerAttributes: { "class": "sub-bgcolor" },
            },
            {
                title : 'Account No',
                field : 'AccountNo',
                headerAttributes: { "class": "sub-bgcolor" },
            },
        ]
    });

    // idxfb = _.findIndex(factype,"Fund Based")
    // idxnfb = _.findIndex(factype,"Non-Fund Based")
    // idxcurr = _.findIndex(factype,"Current")
    
    idxfb = factype.indexOf("Fund Based")
    idxnfb = factype.indexOf("Non-Fund Based")
    idxcurr = factype.indexOf("Current")

    $('#fundgrid'+id).hide();
    $("#bankdetailgrid"+id).hide();
    $('#headersecfbs'+id).hide();
    $('#secfbs'+id).hide();
    $('#nonfundgrid'+id).hide();
    $('#headernfbs'+id).hide();
    $('#currentgrid'+id).hide();
    $("#currentbankdetailgrid"+id).hide();
    $('#headercurrents'+id).hide()

    if (idxfb > -1){
        $('#fundgrid'+id).show();
        $("#bankdetailgrid"+id).show();
        $('#headersecfbs'+id).show();
        $('#secfbs'+id).show();
    } 
    if (idxnfb > -1){
        $('#nonfundgrid'+id).show();
        $('#headernfbs'+id).show();
    }
    if (idxcurr > -1){
        $('#currentgrid'+id).show();
        $("#currentbankdetailgrid"+id).show();
        $('#headercurrents'+id).show();
    }

    $("#bankdetailgrid"+id).kendoGrid({
        dataSource : {
            data : res.DataBank[0].BankDetails,
            schema:{
                model: {
                    id: "Month",
                    fields: {
                        Month:{ editable: false, nullable: true },
                        CreditNonCash: {type: "number", editable: true, min: 1},
                        CreditCash: {type: "number", editable: true, min: 1},
                        DebitNonCash: {type: "number", editable: true, min: 1},
                        DebitCash: {type: "number", editable: true, min: 1},
                        AvgBalon: {type: "number", editable: true, min: 1},
                        OdCcLimit: {type: "number", editable: true, min: 1},
                        ActualInterestPaid: {type: "number", editable: true, min: 1},
                        NoOfDebit: {type: "number", editable: true, min: 1},
                        NoOfCredit: {type: "number", editable: true, min: 1},
                        OwCheque: {type: "number", editable: true, min: 1},
                        IwCheque: {type: "number", editable: true, min: 1},
                    }
                }
            },
        },
        scrollable:false,
        editable: false,
        navigatable: true,
        batch: true,
        columns : createBankDetailGridCols(false),
        dataBound: function () {
            var data = res.DataBank[0].BankDetails
            var account = res.DataBank[0].BankAccount

            var averageReceipt = {}

            averageReceipt.creditTotal = _.sumBy(data, function (d) {
                return d.CreditNonCash + d.CreditCash;
            }) / (data.length == 0 ? 1 : data.length)

            averageReceipt.debitTotal = _.sumBy(data, function (d) {
                return d.DebitNonCash + d.DebitCash;
            }) / (data.length == 0 ? 1 : data.length)

            var BlonLength = _.filter(data,function(x){return x.AvgBalon > 0});
            BlonLength = BlonLength == undefined ? 0 : BlonLength.length;
            averageReceipt.avgBlon = _.sumBy(data, 'AvgBalon')
                / (BlonLength == 0 ? 1 : BlonLength)

            averageReceipt.utilPerMonth = _.max(data.map(function (d) {
                var result = d.AvgBalon / d.OdCcLimit

                if(result == Infinity){
                    return 0
                }else{
                    return result
                }
                
            }))

            averageReceipt.actualInterestPaid = _.sumBy(data, 'ActualInterestPaid')
                / (data.length == 0 ? 1 : data.length)

            averageReceipt.noOfDebit = _.sumBy(data, 'NoOfDebit')
            averageReceipt.noOfCredit = _.sumBy(data, 'NoOfCredit')
            averageReceipt.owCheque = _.sumBy(data, 'OwCheque')
            averageReceipt.iwCheque = _.sumBy(data, 'IwCheque')

            var $footer1 = $('<tr />').addClass('k-footer-template')
                .appendTo($("#bankdetailgrid"+id).find('tbody'))

            $('<td />').appendTo($footer1)
                .html('Average Receipts').attr('colspan', 3)
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.creditTotal, 1))
            $('<td />').appendTo($footer1)
                .html('&nbsp;').attr('colspan', 2)
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.debitTotal, 1))
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.avgBlon, 1))
            $('<td />').appendTo($footer1)
                .html(kendo.toString(averageReceipt.utilPerMonth, 'p1'))
            $('<td />').appendTo($footer1)
                .html('&nbsp;')
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.actualInterestPaid, 1))
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.noOfDebit, 1))
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.noOfCredit, 1))
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.owCheque, 1))
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.iwCheque, 1))

            var averageOpenLimit = {}

            //averageOpenLimit.creditTotal = account.SancLimit * averageReceipt.utilPerMonth
            if (averageReceipt.utilPerMonth == 0 || account.FundBased.SancLimit == 0){
                averageOpenLimit.creditTotal = 0 
            }else{
                averageOpenLimit.creditTotal = account.FundBased.SancLimit * (1-averageReceipt.utilPerMonth)
            }
            
            averageOpenLimit.annualisedCredit = averageReceipt.creditTotal * 12

            var $footer2 = $('<tr />').addClass('k-footer-template')
                .appendTo($("#bankdetailgrid"+id).find('tbody'))

            $('<td />').appendTo($footer2)
                .html('Average Open Limit').attr('colspan', 3)
            $('<td />').appendTo($footer2)
                .html(app.formatnum(averageOpenLimit.creditTotal, 1))
            $('<td />').appendTo($footer2)
                .html('&nbsp;').attr('colspan', 3)
            $('<td />').appendTo($footer2)
                .html("Annualised Credits").attr('colspan', 2)
            $('<td />').appendTo($footer2)
                .html(app.formatnum(averageOpenLimit.annualisedCredit, 2))
            $('<td />').appendTo($footer2)
                .html('% BTO In This Account').attr('colspan', 5)
        }
    });

    $("#currentbankdetailgrid"+id).kendoGrid({
        dataSource : {
            data : res.DataBank[0].CurrentBankDetails,
            schema:{
                model: {
                    id: "Month",
                    fields: {
                        Month:{ editable: false, nullable: true },
                        CreditNonCash: {type: "number", editable: true, min: 1},
                        CreditCash: {type: "number", editable: true, min: 1},
                        DebitNonCash: {type: "number", editable: true, min: 1},
                        DebitCash: {type: "number", editable: true, min: 1},
                        AvgBalon: {type: "number", editable: true, min: 1},
                        NoOfDebit: {type: "number", editable: true, min: 1},
                        NoOfCredit: {type: "number", editable: true, min: 1},
                        OwCheque: {type: "number", editable: true, min: 1},
                        IwCheque: {type: "number", editable: true, min: 1},
                    }
                }
            },
        },
        scrollable:false,
        editable: false,
        navigatable: true,
        batch: true,
        columns : createCurrentBankDetailGridCols(false),
        dataBound: function () {
            console.log(res.DataBank[0].CurrentBankDetails)
            var data = res.DataBank[0].CurrentBankDetails
            var account = res.DataBank[0].BankAccount

            var averageReceipt = {}

            averageReceipt.creditTotal = _.sumBy(data, function (d) {
                return d.CreditNonCash + d.CreditCash;
            }) / (data.length == 0 ? 1 : data.length)

            averageReceipt.debitTotal = _.sumBy(data, function (d) {
                return d.DebitNonCash + d.DebitCash;
            }) / (data.length == 0 ? 1 : data.length)

            var BlonLength = _.filter(data,function(x){return x.AvgBalon > 0});
            BlonLength = BlonLength == undefined ? 0 : BlonLength.length;
            averageReceipt.avgBlon = _.sumBy(data, 'AvgBalon')
                / (BlonLength == 0 ? 1 : BlonLength)

            averageReceipt.utilPerMonth = _.max(data.map(function (d) {
                var result = d.AvgBalon / d.OdCcLimit

                if(result == Infinity){
                    return 0
                }else{
                    return result
                }
                
            }))

            averageReceipt.actualInterestPaid = _.sumBy(data, 'ActualInterestPaid')
                / (data.length == 0 ? 1 : data.length)

            averageReceipt.noOfDebit = _.sumBy(data, 'NoOfDebit')
            averageReceipt.noOfCredit = _.sumBy(data, 'NoOfCredit')
            averageReceipt.owCheque = _.sumBy(data, 'OwCheque')
            averageReceipt.iwCheque = _.sumBy(data, 'IwCheque')

            var $footer1 = $('<tr />').addClass('k-footer-template')
                .appendTo($("#currentbankdetailgrid"+id).find('tbody'))

            $('<td />').appendTo($footer1)
                .html('Average Receipts').attr('colspan', 3)
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.creditTotal, 1))
            $('<td />').appendTo($footer1)
                .html('&nbsp;').attr('colspan', 2)
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.debitTotal, 1))
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.avgBlon, 1))
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.noOfDebit, 1))
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.noOfCredit, 1))
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.owCheque, 1))
            $('<td />').appendTo($footer1)
                .html(app.formatnum(averageReceipt.iwCheque, 1))

            var averageOpenLimit = {}

            //averageOpenLimit.creditTotal = account.SancLimit * averageReceipt.utilPerMonth
            if (averageReceipt.utilPerMonth == 0 || account.FundBased.SancLimit == 0){
                averageOpenLimit.creditTotal = 0 
            }else{
                averageOpenLimit.creditTotal = account.FundBased.SancLimit * (1-averageReceipt.utilPerMonth)
            }
            
            averageOpenLimit.annualisedCredit = averageReceipt.creditTotal * 12

            var $footer2 = $('<tr />').addClass('k-footer-template')
                .appendTo($("#currentbankdetailgrid"+id).find('tbody'))

            $('<td />').appendTo($footer2)
                .html('').attr('colspan', 3)
            $('<td />').appendTo($footer2)
                .html('')
            $('<td />').appendTo($footer2)
                .html('&nbsp;').attr('colspan', 3)
            $('<td />').appendTo($footer2)
                .html("Annualised Credits").attr('colspan', 2)
            $('<td />').appendTo($footer2)
                .html(app.formatnum(averageOpenLimit.annualisedCredit, 2))
            $('<td />').appendTo($footer2)
                .html('% BTO In This Account').attr('colspan', 5)
        }
    });

    $(".k-grid-cancel-changes").attr("class","btn btn-sm btn-warning k-grid-cancel-changes mgright pull-right");
    $(".k-grid-save-changes").attr("class","btn btn-sm btn-success k-grid-save-changes mgright pull-right");
    $(".k-grid-edit").attr("class","btn btn-sm btn-warning k-grid-edit mgright pull-right");
    $(".k-grid-update").attr("class","btn btn-sm btn-success k-grid-update");
    $(".k-grid-cancel").attr("class","btn btn-sm btn-warning k-grid-cancel");
}

var createBankDetailGridCols = function(isForm){

    cols = [{
        title : "Month",
        field : "Month",
        width : 100,
        headerAttributes: { "class": "sub-bgcolor" },
        template: "#= kendo.toString(kendo.parseDate(Month, 'yyyy-MM-dd'), 'dd-MM-yyyy') #"
    }, {
        headerTemplate: "Monthly Credits<br />Rs. Lacs",
        headerAttributes: { "class": "sub-bgcolor" },
        columns: [{
            title : "Non Cash",
            field : "CreditNonCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.CreditNonCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.CreditNonCash)
                }
            },
            editor: disableSpinner
        }, {
            title : "Cash",
            field : "CreditCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.CreditCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.CreditCash)
                }
            },
            editor: disableSpinner
        }, {
            title : "Total",
            headerAttributes: { "class": "sub-bgcolor" },
            template : "#: app.formatnum(CreditNonCash+CreditCash)#"
        }]
    }, {
        headerTemplate: "Monthly Debits<br />Rs. Lacs",
        headerAttributes: { "class": "sub-bgcolor" },
        columns: [{
            title : "Non Cash",
            field : "DebitNonCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.DebitNonCash == 0){
                    return "";
                }else{
                    return app.formatnum( d.DebitNonCash,2)
                }
            },
            editor: disableSpinner
        }, {
            title : "Cash",
            field : "DebitCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.DebitCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.DebitCash)
                }
            },
            editor: disableSpinner
        }, {
            title : "Total",
            headerAttributes: { "class": "sub-bgcolor" },
            template : "#:app.formatnum(DebitNonCash+DebitCash)#"
        }]
    }, {
        title : "AVG BAL ON 1+7+14+21+28",
        field : "AvgBalon",
        headerAttributes: { "class": "sub-bgcolor" },
        width : 120,
        template: function(d){
            if (d.AvgBalon == 0){
                return "";
            }else{
                return app.formatnum(d.AvgBalon)
            }
        },
        editor: disableSpinner
    }, {
        title : "OD/CC Utilization Per Months",
        headerAttributes: { "class": "sub-bgcolor" },
        template : function (d) {
            var value = toolkit.number(d.AvgBalon / d.OdCcLimit)
            return kendo.toString(value, 'p1')
        }
    }, {
        title : "OD/CC Limit Per Months",
        field : "OdCcLimit",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.OdCcLimit == 0){
                return "";
            }else{
                return app.formatnum(d.OdCcLimit)
            }
        },
        editor: disableSpinner
    }, {
        title : "Actual Interest paid Rs.Lacs",
        field : "ActualInterestPaid",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.ActualInterestPaid == 0){
                return "";
            }else{
                return app.formatnum(d.ActualInterestPaid)
            }
        },
        editor: disableSpinner
    }, {
        title : "No. of Debits",
        field : "NoOfDebit",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.NoOfDebit == 0){
                return "";
            }else{
                return d.NoOfDebit
            }
        },
        editor: disableSpinner
    }, {
        title : "No. of Credits",
        field : "NoOfCredit",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.NoOfCredit == 0){
                return "";
            }else{
                return d.NoOfCredit
            }
        },
        editor: disableSpinner
    }, {
        title : "O/W Cheque Returns",
        field : "OwCheque",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.OwCheque == 0){
                return "";
            }else{
                return app.formatnum(d.OwCheque)
            }
        },
        editor: disableSpinner
    }, {
        title : "I/W Cheque Returns",
        field : "IwCheque",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.IwCheque == 0){
                return "";
            }else{
                return app.formatnum(d.IwCheque)
            }
        },
        editor: disableSpinner
    }];

    //if (isForm) cols.splice(4, 1);
    if (isForm){
        cols = [{
        title : "Month",
        field : "Month",
        width : 100,
        headerAttributes: { "class": "sub-bgcolor" },
        template: "#= kendo.toString(kendo.parseDate(Month, 'yyyy-MM-dd'), 'dd-MM-yyyy') #"
    }, {
        headerTemplate: "Monthly Credits<br />Rs. Lacs",
        headerAttributes: { "class": "sub-bgcolor" },
        columns: [{
            title : "Non Cash",
            field : "CreditNonCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.CreditNonCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.CreditNonCash)
                }
            },
            editor: disableSpinner
        }, {
            title : "Cash",
            field : "CreditCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.CreditCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.CreditCash)
                }
            },
            editor: disableSpinner
        }, 
        // {
        //     title : "Total",
        //     headerAttributes: { "class": "sub-bgcolor" },
        //     template : "#:CreditNonCash+CreditCash#"
        // }
        ]
    }, {
        headerTemplate: "Monthly Debits<br />Rs. Lacs",
        headerAttributes: { "class": "sub-bgcolor" },
        columns: [{
            title : "Non Cash",
            field : "DebitNonCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.DebitNonCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.DebitNonCash,2)
                }
            },
            editor: disableSpinner
        }, {
            title : "Cash",
            field : "DebitCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.DebitCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.DebitCash)
                }
            },
            editor: disableSpinner
        }, 
        // {
        //     title : "Total",
        //     headerAttributes: { "class": "sub-bgcolor" },
        //     template : "#:DebitNonCash+DebitCash#"
        // }
        ]
    }, {
        title : "AVG BAL ON 1+7+14+21+28",
        field : "AvgBalon",
        headerAttributes: { "class": "sub-bgcolor" },
        width : 120,
        template: function(d){
            if (d.AvgBalon == 0){
                return "";
            }else{
                return app.formatnum(d.AvgBalon)
            }
        },
        editor: disableSpinner
    }, 
    // {
    //     title : "OD/CC Utilization Per Months",
    //     headerAttributes: { "class": "sub-bgcolor" },
    //     template : function (d) {
    //         var value = toolkit.number(d.AvgBalon / d.OdCcLimit)
    //         return kendo.toString(value, 'p1')
    //     }
    // }, 
    {
        title : "OD/CC Limit Per Months",
        field : "OdCcLimit",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.OdCcLimit == 0){
                return "";
            }else{
                return app.formatnum(d.OdCcLimit)
            }
        },
        editor: disableSpinner
    }, {
        title : "Actual Interest paid Rs.Lacs",
        field : "ActualInterestPaid",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.ActualInterestPaid == 0){
                return "";
            }else{
                return app.formatnum(d.ActualInterestPaid,2)
            }
        },
        editor: disableSpinner
    }, {
        title : "No. of Debits",
        field : "NoOfDebit",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.NoOfDebit == 0){
                return "";
            }else{
                return d.NoOfDebit
            }
        },
        editor: disableSpinner
    }, {
        title : "No. of Credits",
        field : "NoOfCredit",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.NoOfCredit == 0){
                return "";
            }else{
                return d.NoOfCredit
            }
        },
        editor: disableSpinner
    }, {
        title : "O/W Cheque Returns",
        field : "OwCheque",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.OwCheque == 0){
                return "";
            }else{
                return d.OwCheque
            }
        },
        editor: disableSpinner
    }, {
        title : "I/W Cheque Returns",
        field : "IwCheque",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.IwCheque == 0){
                return "";
            }else{
                return d.IwCheque
            }
        },
        editor: disableSpinner
    }];
    }

    return cols;
}

var createCurrentBankDetailGridCols = function(isForm){

    cols = [{
        title : "Month",
        field : "Month",
        width : 100,
        headerAttributes: { "class": "sub-bgcolor" },
        template: "#= kendo.toString(kendo.parseDate(Month, 'yyyy-MM-dd'), 'dd-MM-yyyy') #"
    }, {
        headerTemplate: "Monthly Credits<br />Rs. Lacs",
        headerAttributes: { "class": "sub-bgcolor" },
        columns: [{
            title : "Non Cash",
            field : "CreditNonCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.CreditNonCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.CreditNonCash)
                }
            },
            editor: disableSpinner
        }, {
            title : "Cash",
            field : "CreditCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.CreditCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.CreditCash)
                }
            },
            editor: disableSpinner
        }, {
            title : "Total",
            headerAttributes: { "class": "sub-bgcolor" },
            template : "#:app.formatnum(CreditNonCash+CreditCash)#"
        }]
    }, {
        headerTemplate: "Monthly Debits<br />Rs. Lacs",
        headerAttributes: { "class": "sub-bgcolor" },
        columns: [{
            title : "Non Cash",
            field : "DebitNonCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.DebitNonCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.DebitNonCash,2)
                }
            },
            editor: disableSpinner
        }, {
            title : "Cash",
            field : "DebitCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.DebitCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.DebitCash)
                }
            },
            editor: disableSpinner
        }, {
            title : "Total",
            headerAttributes: { "class": "sub-bgcolor" },
            template : "#:app.formatnum(DebitNonCash+DebitCash)#"
        }]
    }, {
        title : "AVG BAL ON 1+7+14+21+28",
        field : "AvgBalon",
        headerAttributes: { "class": "sub-bgcolor" },
        width : 120,
        template: function(d){
            if (d.AvgBalon == 0){
                return "";
            }else{
                return app.formatnum(d.AvgBalon)
            }
        },
        editor: disableSpinner
    },
       {
        title : "No. of Debits",
        field : "NoOfDebit",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.NoOfDebit == 0){
                return "";
            }else{
                return d.NoOfDebit
            }
        },
        editor: disableSpinner
    }, {
        title : "No. of Credits",
        field : "NoOfCredit",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.NoOfCredit == 0){
                return "";
            }else{
                return d.NoOfCredit
            }
        },
        editor: disableSpinner
    }, {
        title : "O/W Cheque Returns",
        field : "OwCheque",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.OwCheque == 0){
                return "";
            }else{
                return app.formatnum(d.OwCheque)
            }
        },
        editor: disableSpinner
    }, {
        title : "I/W Cheque Returns",
        field : "IwCheque",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.IwCheque == 0){
                return "";
            }else{
                return app.formatnum(d.IwCheque)
            }
        },
        editor: disableSpinner
    }];

    //if (isForm) cols.splice(4, 1);
    if (isForm){
        cols = [{
        title : "Month",
        field : "Month",
        width : 100,
        headerAttributes: { "class": "sub-bgcolor" },
        template: "#= kendo.toString(kendo.parseDate(Month, 'yyyy-MM-dd'), 'dd-MM-yyyy') #"
    }, {
        headerTemplate: "Monthly Credits<br />Rs. Lacs",
        headerAttributes: { "class": "sub-bgcolor" },
        columns: [{
            title : "Non Cash",
            field : "CreditNonCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.CreditNonCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.CreditNonCash)
                }
            },
            editor: disableSpinner
        }, {
            title : "Cash",
            field : "CreditCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.CreditCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.CreditCash)
                }
            },
            editor: disableSpinner
        }, 
        // {
        //     title : "Total",
        //     headerAttributes: { "class": "sub-bgcolor" },
        //     template : "#:CreditNonCash+CreditCash#"
        // }
        ]
    }, {
        headerTemplate: "Monthly Debits<br />Rs. Lacs",
        headerAttributes: { "class": "sub-bgcolor" },
        columns: [{
            title : "Non Cash",
            field : "DebitNonCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.DebitNonCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.DebitNonCash,2)
                }
            },
            editor: disableSpinner
        }, {
            title : "Cash",
            field : "DebitCash",
            headerAttributes: { "class": "sub-bgcolor" },
            template: function(d){
                if (d.DebitCash == 0){
                    return "";
                }else{
                    return app.formatnum(d.DebitCash)
                }
            },
            editor: disableSpinner
        }, 

        ]
    }, {
        title : "AVG BAL ON 1+7+14+21+28",
        field : "AvgBalon",
        headerAttributes: { "class": "sub-bgcolor" },
        width : 120,
        template: function(d){
            if (d.AvgBalon == 0){
                return "";
            }else{
                return app.formatnum(d.AvgBalon)
            }
        },
        editor: disableSpinner
    },  
      {
        title : "No. of Debits",
        field : "NoOfDebit",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.NoOfDebit == 0){
                return "";
            }else{
                return d.NoOfDebit
            }
        },
        editor: disableSpinner
    }, {
        title : "No. of Credits",
        field : "NoOfCredit",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.NoOfCredit == 0){
                return "";
            }else{
                return d.NoOfCredit
            }
        },
        editor: disableSpinner
    }, {
        title : "O/W Cheque Returns",
        field : "OwCheque",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.OwCheque == 0){
                return "";
            }else{
                return d.OwCheque
            }
        },
        editor: disableSpinner
    }, {
        title : "I/W Cheque Returns",
        field : "IwCheque",
        headerAttributes: { "class": "sub-bgcolor" },
        template: function(d){
            if (d.IwCheque == 0){
                return "";
            }else{
                return d.IwCheque
            }
        },
        editor: disableSpinner
    }];
    }

    return cols;
}

var createBankDetailGrid = function(res){
    $("#bankdetailgridform").kendoGrid({
        dataSource: {
            transport: {
                read: function(yo){
                    yo.success(res);
                },
                create:function(yo){
                    var dirty = $('#bankdetailgridform').data('kendoGrid').dataSource.hasChanges();
                    if(!dirty){
                        swal("Warning","Data has no changes","warning");
                        return;
                    }
                    var callData = {
                        CustomerId : "",
                        DealNo : "",
                        BankAccount : {},
                        BankDetails : []
                    };
                    fundbased.accounttype($("#actype").data("kendoDropDownList").value());
                    fundbased.accountholder($("#acholder").val());
                    fundbased.accountno($("#acno").val());
                    fundbased.roi(Number($("#roiperannum").val()));
                    fundbased.sanclimit(Number($("#sanclimit").val()));
                    fundbased.interestpermonth(Number($("#interestpermonth").val()));
                    fundbased.securityoffb($("#securityfb").val());

                    if ($("#naturefacility").data("kendoDropDownList").value() != "Other"){
                        nonfundbased.natureoffacility($("#naturefacility").data("kendoDropDownList").value());
                    }else{
                        nonfundbased.natureoffacility($("#othernaturefacility").val());
                    }
                    nonfundbased.sanclimit(Number($("#nfbsanclimit").val()));
                    nonfundbased.securityofnfb($("#securitynfb").val());
                    bankaccount.bankname($("#bankname").val());
                    bankaccount.bankstttill($("#bankstt").data("kendoDatePicker").value());
                    var todayDate = new Date().toISOString();
                    if (bankaccount.facilitytype() != "" && bankaccount.facilitytype() == "Fund Based"){
                        nonfundbased.sanctiondate(todayDate);
                        fundbased.sanctiondate($("#fbsanctiondate").data("kendoDatePicker").value());
                    }else if (bankaccount.facilitytype() != "" && bankaccount.facilitytype() == "Non Fund Based"){
                        fundbased.sanctiondate(todayDate);
                        nonfundbased.sanctiondate($("#nfbsanctiondate").data("kendoDatePicker").value());
                    }else{
                        fundbased.sanctiondate($("#fbsanctiondate").data("kendoDatePicker").value());
                        nonfundbased.sanctiondate($("#nfbsanctiondate").data("kendoDatePicker").value());
                    }
                    bankaccount.fundbased = fundbased;
                    bankaccount.nonfundbased = nonfundbased;

                    callData.CustomerId = filter().CustomerSearchVal();
                    callData.DealNo = filter().DealNumberSearchVal();
                    callData.BankAccount = bankaccount;

                    for(var i in yo.data["models"]){
                        var dt = yo.data["models"][i];
                        callData.BankDetails.push(dt);
                    }

                    ajaxPost(url+"/createbankanalysis",callData, function(res){
                        yo.success(res.data);
                        swal("Success","Data Saved","success");
                        $('#modalAdd').modal('hide');
                        DrawDataBank(getSearchVal());
                        resetInput();
                    });

                }
            },
            batch: true,
            navigatable: true,
            schema:{
                model: {
                    id: "Id",
                    fields: {
                        Id: { editable: false, nullable: true },
                        Month:{type: "date",editable: false, nullable: false},
                        CreditNonCash:{type: "number", editable: true, min: 1},
                        CreditCash:{type: "number", editable: true, min: 1 },
                        DebitNonCash:{type: "number", editable: true,min: 1 },
                        DebitCash:{type: "number", editable: true,min: 1 },
                        AvgBalon:{type: "number", editable: true,min: 1 },
                        OdCcLimit:{type: "number", validation: { required: true, min: 1} },
                        ActualInterestPaid:{type: "number",  validation: { required: true, min: 1} },
                        NoOfDebit:{type: "number",  validation: { required: true, min: 1} },
                        NoOfCredit:{type: "number",  validation: { required: true, min: 1} },
                        OwCheque:{type: "number", editable: true, min: 1 },
                        IwCheque:{type: "number", editable: true, min: 1 },
                    }
                }
            }
        },
        height: 200,
        //toolbar: [{name:"save",text:"Save Bank Data"},{name:"cancel",text:"Cancel"}],
        editable: true,
        columns: createBankDetailGridCols(true),
    });

    $(".k-grid-cancel-changes").attr("class","btn btn-sm btn-reset k-grid-cancel-changes mgright pull-right");
    $(".k-grid-save-changes").attr("class","btn btn-sm btn-save k-grid-save-changes mgright pull-right");

    $("#currentbankdetailgridform").kendoGrid({
        dataSource: {
            data:res,
            batch: true,
            navigatable: true,
            schema:{
                model: {
                    id: "Id",
                    fields: {
                        Id: { editable: false, nullable: true },
                        Month:{type: "date",editable: false, nullable: false},
                        CreditNonCash:{type: "number", editable: true, min: 1},
                        CreditCash:{type: "number", editable: true, min: 1 },
                        DebitNonCash:{type: "number", editable: true,min: 1 },
                        DebitCash:{type: "number", editable: true,min: 1 },
                        AvgBalon:{type: "number", editable: true,min: 1 },
                        NoOfDebit:{type: "number",  validation: { required: true, min: 1} },
                        NoOfCredit:{type: "number",  validation: { required: true, min: 1} },
                        OwCheque:{type: "number", editable: true, min: 1 },
                        IwCheque:{type: "number", editable: true, min: 1 },
                    }
                }
            }
        },
        height: 200,
        editable: true,
        columns: createCurrentBankDetailGridCols(true),
    });
}

function onSelect(e) {
    var dataItem = e.dataItem;
    //console.log(e)
    if (dataItem.text == 'Fund Based'){
        $('#fb').show()
        fbselected(true)
        if (nfbselected() == true){
            $('#same').show()
        }
    }else if(dataItem.text == 'Non-Fund Based'){
        $('#nfb').show()
        nfbselected(true)
        if (fbselected() == true){
            $('#same').show()
        }
    }else{
        $('#current').show()
    }
};

function onDeselect(e) {
    var dataItem = e.dataItem;
    if (dataItem.text == 'Fund Based'){
        $('#fb').hide()
        fbselected(false)
        $('#same').hide()
    }else if(dataItem.text == 'Non-Fund Based'){
        $('#nfb').hide()
        nfbselected(false)
        $('#same').hide()
    }else{
        $('#current').hide()
    }
};

var onfactypechange = function(){
    if ($('#facilitytype').getKendoMultiSelect().value().length == 0){
        $('#fb').hide()
        $('#nfb').hide()
        $('#same').hide()
        $('#current').hide()
        $('#savebtn').prop('disabled',true);
    }else{
         $('#savebtn').prop('disabled',false);
    }
    
}

$(document).ready(function(){
    $('#facilitytype').kendoMultiSelect({
        dataTextField: "text",
        dataValueField: "value",
        dataSource:[
            {text:"Fund Based",value:"Fund Based"},
            {text:'Non-Fund Based',value:'Non-Fund Based'},
            {text:'Current',value:'Current'},
        ],
        deselect: onDeselect,
        select: onSelect,
        change: onfactypechange,
    });

    $('#savebtn').prop('disabled',true);
    $('#updatebtn').hide();
    $('#cancelbtn').click(function(){
        $('#modalAdd').modal('hide');
        resetInput();
        setdatestt();
    });
    $('#updatebtn').click(function(){
        updateDataBank(idx());
    });
    $("#bankstt").kendoDatePicker({
        format: "dd-MM-yyyy",
        change: onChange,
    });
    $('#savebtn').click(function(){
        saveDataBank();
    });

    $("#add").click(function(){
        if (filter().CustomerSearchVal() == ""){
            swal("Warning","Select Customer First","warning");
            return;
        }else{
            $('#updatebtn').hide();
            //$('#savebtn').prop('disabled',true);
            $('#savebtn').show();

            resetInput();
            ajaxPost(url+"/getdetailbanktemplate",filter().CustomerSearchVal(),function(res){
                if (res.data.length > 0) {
                    res.data[0].BankDetails.forEach(function(bd){
                        bd.ActualInterestPaid = 0;
                        bd.AvgBalon = 0;
                        bd.CreditCash = 0;
                        bd.CreditNonCash = 0;
                        bd.CreditTotal = 0;
                        bd.DebitCash = 0;
                        bd.DebitNonCash = 0;
                        bd.DebitTotal = 0;
                        bd.IwCheque = 0;
                    })

                    createBankDetailGrid(res.data[0].BankDetails);
                    $('#bankstt').data('kendoDatePicker').value(res.data[0].BankDetails[0].Month);
                    $('#modalAdd').modal('show');

                    setTimeout(function(){
                        $("#nfbsanctiondate").getKendoDatePicker().value(new Date());
                        $("#fbsanctiondate").getKendoDatePicker().value(new Date());
                    },2000);

                }else{
                    //$('#modalAdd').modal('show');
                    swal("Warning","Select Statement Date","warning");
                }
            });

        }
    });

    $("#othernf").hide();
    $("#bconfirm").click(function(){
        if (filter().CustomerSearchVal() == "" || filter().DealNumberSearchVal() == ""){
            swal("Warning","Select Customer First","warning");
            return;
        }else{
            resetInput();
            ajaxPost(url+"/setconfirmedv2", getSearchVal(), function(){
                swal("Success","Data confirmed","success");
                $('#bconfirm').removeClass('btn-reenter').addClass('btn-confirm').html("Confirm All");
                refreshFilter()
            });
        }
    });

    $("#bankdetailgridform").on("mousedown", ".k-grid-cancel-changes", function (e) {
        $('#modalAdd').modal('hide');
        resetInput();
    });

    $("#bankdetailgridform").on("mousedown", ".k-grid-update", function (e) {
       updateDataBank(idx());
    });

    $("#actype").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        dataSource: [
            {text: "OD/CC", value: "OD/CC"},
            {text: "Other", value: "Other"},
        ],
        index: 0,
    });

    $("#sanclimit").keyup(function(){
        numChange();
    });

    $("#roiperannum").keyup(function(){
        numChange();
    });

    $("#fbsanctiondate").kendoDatePicker({
        format:"dd/MM/yyyy"
    });

    $("#nfbsanctiondate").kendoDatePicker({
        format:"dd/MM/yyyy"
    });

    $("#naturefacility").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        dataSource: [
            {text: "Letter Of Credit", value: "Letter Of Credit"},
            {text: "Bank Guarantee", value: "Bank Guarantee"},
            {text: "Other", value: "Other"},
        ],
        index: 0,
        change: onNatureChange,
    });

    $("#nfb").hide();
    $("#fb").hide();
    $("#same").hide();
    $('#current').hide()

    $('input[type=radio][name=fb]').change(function(){
        $('#savebtn').prop('disabled',false);
        if ($("input[name=fb]:checked").val()){
            $("#same").hide();
            $("#fb").show();
            $("#nfb").hide();
            $('input[name=nfb]').attr('checked',false);
            $('input[name=both]').attr('checked',false);
            bankaccount.facilitytype("Fund Based");
        }
    });

    $('input[type=radio][name=nfb]').change(function(){
        $('#savebtn').prop('disabled',false);
        if ($("input[name=nfb]:checked").val()){
            $("#same").hide();
            $("#fb").hide();
            $("#nfb").show();
            $('input[name=fb]').attr('checked',false);
            $('input[name=both]').attr('checked',false);
            bankaccount.facilitytype("Non Fund Based");
        }
    });

    $('input[type=radio][name=both]').change(function(){
        $('#savebtn').prop('disabled',false);
        if ($("input[name=both]:checked").val()){
            $("#fb").show();
            $("#nfb").show();
            $("#same").show();
            $('input[name=fb]').attr('checked',false);
            $('input[name=nfb]').attr('checked',false);
            bankaccount.facilitytype("Both");
        }
    });
    $("#samenfb").change(function(){
        if($("#samenfb").is(':checked')){
            $('#securityfb').val($('#securitynfb').val());
        }else{
            $('#securityfb').val("");
        }
    });
})

// var editBankData = function(index){
//     return function(){
//         $('#savebtn').hide();
//         $('#updatebtn').show();
//         var gridfund = $("#fundgrid"+index).data("kendoGrid");
//         var gridnonfund = $("#nonfundgrid"+index).data("kendoGrid");
//         resetInput();
//         $('#bankname').val(databank()[index].DataBank[0].BankAccount.BankName);
//         if (databank()[index].DataBank[0].BankAccount.FacilityType == "Fund Based"){
            
//             $('#fbradio').prop('checked', true);
//             $('#fb').show();
//             if(databank()[index].DataBank[0].BankAccount.FundBased.AccountType == "Current"){
//                 $('#actype').data('kendoDropDownList').select(1);
//             }else{
//                 $('#actype').data('kendoDropDownList').select(0);
//             }
//             $('#acno').val(databank()[index].DataBank[0].BankAccount.FundBased.AccountNo);
//             $('#acholder').val(databank()[index].DataBank[0].BankAccount.FundBased.AccountHolder);
//             $('#sanclimit').val(databank()[index].DataBank[0].BankAccount.FundBased.SancLimit);
//             $('#roiperannum').val(databank()[index].DataBank[0].BankAccount.FundBased.ROI);
//             $('#interestpermonth').val(databank()[index].DataBank[0].BankAccount.FundBased.InterestPerMonth);
//             $('#fbsanctiondate').data('kendoDatePicker').value(databank()[index].DataBank[0].BankAccount.FundBased.SanctionDate);
//             $('#securityfb').val(databank()[index].DataBank[0].BankAccount.FundBased.SecurityOfFB);
//         }else if (databank()[index].DataBank[0].BankAccount.FacilityType == "Non Fund Based"){
            
//             $('#nfbradio').prop('checked', true);
//             $('#nfb').show();
//             if(databank()[index].DataBank[0].BankAccount.NonFundBased.NatureOfFacility == "Letter Of Credit"){
//                 $('#naturefacility').data('kendoDropDownList').select(0);
//             }else if(databank()[index].DataBank[0].BankAccount.NonFundBased.NatureOfFacility == "Bank Guarantee"){
//                 $('#naturefacility').data('kendoDropDownList').select(1);
//             }else{
//                 $('#naturefacility').data('kendoDropDownList').select(2);
//                 $('#othernf').show();
//                 $('#othernaturefacility').val(databank()[index].DataBank[0].BankAccount.NonFundBased.NatureOfFacility);
//             }

//             $('#nfbsanclimit').val(databank()[index].DataBank[0].BankAccount.NonFundBased.SancLimit);
//             $('#nfbsanctiondate').data('kendoDatePicker').value(databank()[index].DataBank[0].BankAccount.NonFundBased.SanctionDate);
//             $('#securitynfb').val(databank()[index].DataBank[0].BankAccount.NonFundBased.SecurityOfNFB);
//         }else{
            
//             $('#bothradio').prop('checked', true);
//             $('#fb').show();
//             $('#same').show();
//             if(databank()[index].DataBank[0].BankAccount.FundBased.AccountType == "Current"){
//                 $('#actype').data('kendoDropDownList').select(1);
//             }else{
//                 $('#actype').data('kendoDropDownList').select(0);
//             }
//             $('#acno').val(databank()[index].DataBank[0].BankAccount.FundBased.AccountNo);
//             $('#acholder').val(databank()[index].DataBank[0].BankAccount.FundBased.AccountHolder);
//             $('#sanclimit').val(databank()[index].DataBank[0].BankAccount.FundBased.SancLimit);
//             $('#roiperannum').val(databank()[index].DataBank[0].BankAccount.FundBased.ROI);
//             $('#interestpermonth').val(databank()[index].DataBank[0].BankAccount.FundBased.InterestPerMonth);
//             $('#fbsanctiondate').data('kendoDatePicker').value(databank()[index].DataBank[0].BankAccount.FundBased.SanctionDate);
//             $('#securityfb').val(databank()[index].DataBank[0].BankAccount.FundBased.SecurityOfFB);

//             $('#nfb').show();
//             if(databank()[index].DataBank[0].BankAccount.NonFundBased.NatureOfFacility == "Letter Of Credit"){
//                 $('#naturefacility').data('kendoDropDownList').select(0);
//             }else if(databank()[index].DataBank[0].BankAccount.NonFundBased.NatureOfFacility == "Bank Guarantee"){
//                 $('#naturefacility').data('kendoDropDownList').select(1);
//             }else{
//                 $('#naturefacility').data('kendoDropDownList').select(2);
//                 $('#othernf').show();
//                 $('#othernaturefacility').val(databank()[index].DataBank[0].BankAccount.NonFundBased.NatureOfFacility);
//             }
//             // $('#naturefacility').val(databank()[index].DataBank[0].BankAccount.NonFundBased.NatureOfFacility);
//             //$('#othernaturefacility').val(databank()[index].DataBank[0].BankAccount.NonFundBased.OtherNatureOfFacility);
//             $('#nfbsanclimit').val(databank()[index].DataBank[0].BankAccount.NonFundBased.SancLimit);
//             $('#nfbsanctiondate').data('kendoDatePicker').value(databank()[index].DataBank[0].BankAccount.NonFundBased.SanctionDate);
//             $('#securitynfb').val(databank()[index].DataBank[0].BankAccount.NonFundBased.SecurityOfNFB);
//         }

//         ajaxPost(url+"/getdetailbanktemplate",filter().CustomerSearchVal(),function(res){
//             if (res.data.length > 0) {
//                 res.data[0].BankDetails.forEach(function(bd){
//                     bd.ActualInterestPaid = 0;
//                     bd.AvgBalon = 0;
//                     bd.CreditCash = 0;
//                     bd.CreditNonCash = 0;
//                     bd.CreditTotal = 0;
//                     bd.DebitCash = 0;
//                     bd.DebitNonCash = 0;
//                     bd.DebitTotal = 0;
//                     bd.IwCheque = 0;
//                 })
//                 createBankDetailGrid(res.data[0].BankDetails);
//                 $('#bankstt').data('kendoDatePicker').value(res.data[0].BankDetails[0].Month);
//                 $('#modalAdd').modal('show');
//                 loadGridDataBank(databank()[index].DataBank[0].BankDetails);
//                 loadGridCurrentDataBank(databank()[index].DataBank[0].BankDetails)

//             }else{
//                 $('#modalAdd').modal('show');
//                 loadGridDataBank(databank()[index].DataBank[0].BankDetails);
//                 loadGridCurrentDataBank(databank()[index].DataBank[0].BankDetails)
//             }
//         });
//         idx(index);
//         return true;
//     }
// }

var editBankData = function(index){
    return function(){
        $('#savebtn').hide()
        $('#updatebtn').show()
        resetInput()
        $('#bankname').val(databank()[index].DataBank[0].BankAccount.BankName)
        var factype = databank()[index].DataBank[0].BankAccount.FacilityType
        $('#facilitytype').getKendoMultiSelect().value(factype)
        if (factype.indexOf('Non-Fund Based') > -1 && factype.indexOf('Fund Based') > -1){
            $('#same').show()
        }

        if (factype.indexOf('Fund Based') > -1){
            fbselected(true)
            $('#fb').show()
            if(databank()[index].DataBank[0].BankAccount.FundBased.AccountType == "OD/CC"){
                $('#actype').data('kendoDropDownList').select(0)
            }else{
                $('#actype').data('kendoDropDownList').select(1)
            }
            $('#acno').val(databank()[index].DataBank[0].BankAccount.FundBased.AccountNo)
            $('#acholder').val(databank()[index].DataBank[0].BankAccount.FundBased.AccountHolder)
            $('#sanclimit').val(databank()[index].DataBank[0].BankAccount.FundBased.SancLimit)
            $('#roiperannum').val(databank()[index].DataBank[0].BankAccount.FundBased.ROI)
            $('#interestpermonth').val(databank()[index].DataBank[0].BankAccount.FundBased.InterestPerMonth)
            $('#fbsanctiondate').data('kendoDatePicker').value(databank()[index].DataBank[0].BankAccount.FundBased.SanctionDate)
            $('#securityfb').val(databank()[index].DataBank[0].BankAccount.FundBased.SecurityOfFB)
            //loadGridDataBank(databank()[index].DataBank[0].BankDetails)
        }

        if (factype.indexOf('Non-Fund Based') > -1){
            nfbselected(true)
            $('#nfb').show()
            if(databank()[index].DataBank[0].BankAccount.NonFundBased.NatureOfFacility == "Letter Of Credit"){
                $('#naturefacility').data('kendoDropDownList').select(0)
            }else if(databank()[index].DataBank[0].BankAccount.NonFundBased.NatureOfFacility == "Bank Guarantee"){
                $('#naturefacility').data('kendoDropDownList').select(1)
            }else{
                $('#naturefacility').data('kendoDropDownList').select(2)
                $('#othernf').show()
                $('#othernaturefacility').val(databank()[index].DataBank[0].BankAccount.NonFundBased.NatureOfFacility)
            }

            $('#nfbsanclimit').val(databank()[index].DataBank[0].BankAccount.NonFundBased.SancLimit)
            $('#nfbsanctiondate').data('kendoDatePicker').value(databank()[index].DataBank[0].BankAccount.NonFundBased.SanctionDate)
            $('#securitynfb').val(databank()[index].DataBank[0].BankAccount.NonFundBased.SecurityOfNFB)
        }

        if (factype.indexOf('Current') > -1){
            $('#current').show()
            $('#currentacno').val(databank()[1].DataBank[0].BankAccount.CurrentBased.AccountNo)
            $('#currentacholder').val(databank()[1].DataBank[0].BankAccount.CurrentBased.AccountHolder)
            //loadGridCurrentDataBank(databank()[index].DataBank[0].CurrentBankDetails)
        }

        ajaxPost(url+"/getdetailbanktemplate",filter().CustomerSearchVal(),function(res){
            $('#modalAdd').modal('show')

            if (res.data.length > 0){
                $('#bankstt').data('kendoDatePicker').value(res.data[0].BankDetails[0].Month)
            }

            var datafunddetail = databank()[index].DataBank[0].BankDetails
            var datacurrentdetail = databank()[index].DataBank[0].CurrentBankDetails

            if (datafunddetail != null){
                loadGridDataBank(databank()[index].DataBank[0].BankDetails)
            }else{
                loadGridDataBank(res.data[0].BankDetails)
            }     
            
            if (datacurrentdetail != null){
                loadGridCurrentDataBank(databank()[index].DataBank[0].CurrentBankDetails)
            }else{
                loadGridCurrentDataBank(res.data[0].BankDetails)
            }
        });

        // ajaxPost(url+"/getdetailbanktemplate",filter().CustomerSearchVal(),function(res){
        //     console.log(res)
        //     if (res.data.length > 0) {
        //         res.data[0].BankDetails.forEach(function(bd){
        //             bd.ActualInterestPaid = 0;
        //             bd.AvgBalon = 0;
        //             bd.CreditCash = 0;
        //             bd.CreditNonCash = 0;
        //             bd.CreditTotal = 0;
        //             bd.DebitCash = 0;
        //             bd.DebitNonCash = 0;
        //             bd.DebitTotal = 0;
        //             bd.IwCheque = 0;
        //         })
        //         createBankDetailGrid(res.data[0].BankDetails);
        //         $('#bankstt').data('kendoDatePicker').value(res.data[0].BankDetails[0].Month);
        //         $('#modalAdd').modal('show');
        //         loadGridDataBank(databank()[index].DataBank[0].BankDetails);
        //         loadGridCurrentDataBank(databank()[index].DataBank[0].CurrentBankDetails)

        //     }else{
        //         $('#modalAdd').modal('show');
        //         loadGridDataBank(databank()[index].DataBank[0].BankDetails);
        //         loadGridCurrentDataBank(databank()[index].DataBank[0].CurrentBankDetails)
        //     }
        // });

        // var datafunddetail = databank()[index].DataBank[0].BankDetails
        // var datacurrentdetail = databank()[index].DataBank[0].CurrentBankDetails

        // if (datafunddetail != null)

        idx(index);
        return true;
    }
}

var loadGridDataBank = function(res){
    $("#bankdetailgridform").html("");
     $("#bankdetailgridform").kendoGrid({
        dataSource: {
            data:res,
            batch: true,
            navigatable: true,
            schema:{
                model: {
                    id: "Id",
                    fields: {
                        Id: { editable: false, nullable: true },
                        Month:{type: "date",editable: false, nullable: false},
                        CreditNonCash:{type: "number", editable: true, min: 1},
                        CreditCash:{type: "number", editable: true, min: 1 },
                        DebitNonCash:{type: "number", editable: true,min: 1 },
                        DebitCash:{type: "number", editable: true,min: 1 },
                        AvgBalon:{type: "number", editable: true,min: 1 },
                        OdCcLimit:{type: "number", validation: { required: true, min: 1} },
                        ActualInterestPaid:{type: "number",  validation: { required: true, min: 1} },
                        NoOfDebit:{type: "number",  validation: { required: true, min: 1} },
                        NoOfCredit:{type: "number",  validation: { required: true, min: 1} },
                        OwCheque:{type: "number", editable: true, min: 1 },
                        IwCheque:{type: "number", editable: true, min: 1 },
                    }
                }
            }
        },
        height: 200,
        //toolbar: [{name:"update",text:"Update Bank Data"},{name:"cancel",text:"Cancel"}],
        editable: true,
        columns: createBankDetailGridCols(true),
    });

    $(".k-grid-cancel-changes").attr("class","btn btn-sm btn-warning k-grid-cancel-changes mgright pull-right");
    $(".k-grid-update").attr("class","btn btn-sm btn-success k-grid-update mgright pull-right");
}

var loadGridCurrentDataBank = function(res){
    $("#currentbankdetailgridform").html("");
     $("#currentbankdetailgridform").kendoGrid({
        dataSource: {
            data:res,
            batch: true,
            navigatable: true,
            schema:{
                model: {
                    id: "Id",
                    fields: {
                        Id: { editable: false, nullable: true },
                        Month:{type: "date",editable: false, nullable: false},
                        CreditNonCash:{type: "number", editable: true, min: 1},
                        CreditCash:{type: "number", editable: true, min: 1 },
                        DebitNonCash:{type: "number", editable: true,min: 1 },
                        DebitCash:{type: "number", editable: true,min: 1 },
                        AvgBalon:{type: "number", editable: true,min: 1 },
                        NoOfDebit:{type: "number",  validation: { required: true, min: 1} },
                        NoOfCredit:{type: "number",  validation: { required: true, min: 1} },
                        OwCheque:{type: "number", editable: true, min: 1 },
                        IwCheque:{type: "number", editable: true, min: 1 },
                    }
                }
            }
        },
        height: 200,
        //toolbar: [{name:"update",text:"Update Bank Data"},{name:"cancel",text:"Cancel"}],
        editable: true,
        columns: createCurrentBankDetailGridCols(true),
    });

    $(".k-grid-cancel-changes").attr("class","btn btn-sm btn-warning k-grid-cancel-changes mgright pull-right");
    $(".k-grid-update").attr("class","btn btn-sm btn-success k-grid-update mgright pull-right");
}

var saveDataBank = function(){
    var gridbankdet = $("#bankdetailgridform").data("kendoGrid");
    var gridcurrentbankdet = $('#currentbankdetailgridform').data("kendoGrid");
    var gridbankdetdirty = $("#bankdetailgridform").data("kendoGrid").dataSource.hasChanges();
    det = gridbankdet.dataSource._data;
    currdet = gridcurrentbankdet.dataSource._data;
    

    var callData = {
        CustomerId : "",
        DealNo : "",
        BankAccount : {},
        BankDetails : [],
        CurrentBankDetails : [],
    };
    fundbased.accounttype($("#actype").data("kendoDropDownList").value());
    fundbased.accountholder($("#acholder").val());
    fundbased.accountno($("#acno").val());
    fundbased.roi(Number($("#roiperannum").val()));
    fundbased.sanclimit(Number($("#sanclimit").val()));
    fundbased.interestpermonth(Number($("#interestpermonth").val()));
    fundbased.securityoffb($("#securityfb").val());
    
    if ($("#naturefacility").data("kendoDropDownList").value() != "Other"){
        nonfundbased.natureoffacility($("#naturefacility").data("kendoDropDownList").value());
    }else{
        nonfundbased.natureoffacility($("#othernaturefacility").val());
    }
    nonfundbased.sanclimit(Number($("#nfbsanclimit").val()));
    nonfundbased.securityofnfb($("#securitynfb").val());
    bankaccount.bankname($("#bankname").val());
    bankaccount.bankstttill($("#bankstt").data("kendoDatePicker").value());
    var todayDate = new Date().toISOString();
    // if (bankaccount.facilitytype() != "" && bankaccount.facilitytype() == "Fund Based"){
    //     nonfundbased.sanctiondate(todayDate);
    //     fundbased.sanctiondate($("#fbsanctiondate").data("kendoDatePicker").value().toISOString());
    // }else if (bankaccount.facilitytype() != "" && bankaccount.facilitytype() == "Non Fund Based"){
    //     fundbased.sanctiondate(todayDate);
    //     nonfundbased.sanctiondate($("#nfbsanctiondate").data("kendoDatePicker").value().toISOString());
    // }else{
        fundbased.sanctiondate($("#fbsanctiondate").data("kendoDatePicker").value().toISOString());
        nonfundbased.sanctiondate($("#nfbsanctiondate").data("kendoDatePicker").value().toISOString());
    //}
    bankaccount.facilitytype($('#facilitytype').getKendoMultiSelect().value())
    currentbased.accountholder($('#currentacholder').val())
    currentbased.accountno($('#currentacno').val())
    currentbased.accounttype($('#currentactype').val())

    bankaccount.fundbased = fundbased;
    bankaccount.nonfundbased = nonfundbased;
    bankaccount.currentbased = currentbased

    callData.CustomerId = filter().CustomerSearchVal();
    callData.DealNo = filter().DealNumberSearchVal();
    callData.BankAccount = bankaccount;

    for (var i = 0;i<det.length;i++){
        var bankdet = {}
        bankdet.Month = det[i].Month
        bankdet.CreditNonCash= det[i].CreditNonCash
        bankdet.CreditCash = det[i].CreditCash
        bankdet.CreditTotal = det[i].CreditTotal
        bankdet.DebitNonCash = det[i].DebitNonCash
        bankdet.DebitCash = det[i].DebitCash
        bankdet.DebitTotal = det[i].DebitTotal
        bankdet.AvgBalon = det[i].AvgBalon
        bankdet.OdCcUtilization = det[i].OdCcUtilization
        bankdet.OdCcLimit = det[i].OdCcLimit
        bankdet.ActualInterestPaid = det[i].ActualInterestPaid
        bankdet.NoOfDebit = det[i].NoOfDebit
        bankdet.NoOfCredit = det[i].NoOfCredit
        bankdet.OwCheque = det[i].OwCheque
        bankdet.IwCheque = det[i].IwCheque
        callData.BankDetails.push(bankdet);
    }

    for (var i = 0;i<currdet.length;i++){
        var currentbankdet = {}
        currentbankdet.Month = currdet[i].Month
        currentbankdet.CreditNonCash= currdet[i].CreditNonCash
        currentbankdet.CreditCash = currdet[i].CreditCash
        currentbankdet.CreditTotal = currdet[i].CreditTotal
        currentbankdet.DebitNonCash = currdet[i].DebitNonCash
        currentbankdet.DebitCash = currdet[i].DebitCash
        currentbankdet.DebitTotal = currdet[i].DebitTotal
        currentbankdet.AvgBalon = currdet[i].AvgBalon
        currentbankdet.NoOfDebit = currdet[i].NoOfDebit
        currentbankdet.NoOfCredit = currdet[i].NoOfCredit
        currentbankdet.OwCheque = currdet[i].OwCheque
        currentbankdet.IwCheque = currdet[i].IwCheque
        callData.CurrentBankDetails.push(currentbankdet);
    }

    console.log(callData)

    ajaxPost(url+"/createbankanalysis",callData, function(res){
        //yo.success(res.data);
        swal("Success","Data Saved","success");
        $('#modalAdd').modal('hide');
        DrawDataBank(getSearchVal());
        resetInput();
        //$('#savebtn').prop('disabled',true);
        setdatestt()
    });
}

// var updateDataBank = function(index){
//     var gridbankdet = $("#bankdetailgridform").data("kendoGrid");
//     var gridbankdetdirty = $("#bankdetailgridform").data("kendoGrid").dataSource.hasChanges();
//     det = gridbankdet.dataSource._data;

//     fundbased.accounttype($("#actype").data("kendoDropDownList").value());
//     fundbased.accountholder($("#acholder").val());
//     fundbased.accountno($("#acno").val());
//     fundbased.roi(Number($("#roiperannum").val()));
//     fundbased.sanclimit(Number($("#sanclimit").val()));
//     fundbased.interestpermonth(Number($("#interestpermonth").val()));
//     fundbased.securityoffb($("#securityfb").val());
//     if ($("#naturefacility").data("kendoDropDownList").value() != "Other"){
//         nonfundbased.natureoffacility($("#naturefacility").data("kendoDropDownList").value());
//     }else{
//         nonfundbased.natureoffacility($("#othernaturefacility").val());
//     }
//     nonfundbased.sanclimit(Number($("#nfbsanclimit").val()));
//     nonfundbased.securityofnfb($("#securitynfb").val());
//     bankaccount.bankname($("#bankname").val());
//     bankaccount.bankstttill($("#bankstt").data("kendoDatePicker").value());
//     if ($("input[name=fb]:checked").val()){
//         bankaccount.facilitytype("Fund Based");
//     }else if($("input[name=nfb]:checked").val()){
//         bankaccount.facilitytype("Non Fund Based");
//     }else{
//         bankaccount.facilitytype("Both");
//     }
//     var todayDate = new Date().toISOString();
//     if (bankaccount.facilitytype() != "" && bankaccount.facilitytype() == "Fund Based"){
//         nonfundbased.sanctiondate(todayDate);
//         var sd = moment($("#fbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
//         fundbased.sanctiondate(sd);
//     }else if (bankaccount.facilitytype() != "" && bankaccount.facilitytype() == "Non Fund Based"){
//         fundbased.sanctiondate(todayDate);
//         var nfbsd = moment($("#nfbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
//         nonfundbased.sanctiondate(nfbsd);
//     }else{
//         var sd = moment($("#fbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
//         var nfbsd = moment($("#nfbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
//         fundbased.sanctiondate(sd);
//         nonfundbased.sanctiondate(nfbsd);
//     }
//     bankaccount.fundbased = fundbased;
//     bankaccount.nonfundbased = nonfundbased;

//     var param = {
//         CustomerId : "",
//         DealNo : "",
//         BankAccount : {},
//         BankDetails : [],

//     }
//     param.CustomerId = filter().CustomerSearchVal();
//     param.DealNo = filter().DealNumberSearchVal();
//     param.BankAccount = bankaccount;
//     for (var i = 0;i<det.length;i++){
//         var bankdet = {}
//         bankdet.Month = det[i].Month
//         bankdet.CreditNonCash= det[i].CreditNonCash
//         bankdet.CreditCash = det[i].CreditCash
//         bankdet.CreditTotal = det[i].CreditTotal
//         bankdet.DebitNonCash = det[i].DebitNonCash
//         bankdet.DebitCash = det[i].DebitCash
//         bankdet.DebitTotal = det[i].DebitTotal
//         bankdet.AvgBalon = det[i].AvgBalon
//         bankdet.OdCcUtilization = det[i].OdCcUtilization
//         bankdet.OdCcLimit = det[i].OdCcLimit
//         bankdet.ActualInterestPaid = det[i].ActualInterestPaid
//         bankdet.NoOfDebit = det[i].NoOfDebit
//         bankdet.NoOfCredit = det[i].NoOfCredit
//         bankdet.OwCheque = det[i].OwCheque
//         bankdet.IwCheque = det[i].IwCheque
//         param.BankDetails.push(bankdet);
//     }
//     var xparam = {Id: databank()[index].Id ,Param:param}
//     ajaxPost(url+"/updatev2",xparam,function(res){
//         swal("Success","Data Updated","success");
//         DrawDataBank(getSearchVal());
//         resetInput();
//         $('#updatebtn').hide();
//         $('#savebtn').show();
//         $('#savebtn').prop('disabled',true);
//         $('#modalAdd').modal('hide');
//         setdatestt()
//     })

// }

var updateDataBank = function(index){
    var gridbankdet = $("#bankdetailgridform").data("kendoGrid")
    det = gridbankdet.dataSource._data
    var gridcurrentbankdet = $('#currentbankdetailgridform').data("kendoGrid")
    currdet = gridcurrentbankdet.dataSource._data

    bankaccount.bankname($("#bankname").val());
    bankaccount.bankstttill($("#bankstt").data("kendoDatePicker").value());
    bankaccount.facilitytype($('#facilitytype').getKendoMultiSelect().value())
    bankaccount.bankstttill($("#bankstt").data("kendoDatePicker").value());

    fundbased.accounttype($("#actype").data("kendoDropDownList").value())
    fundbased.accountholder($("#acholder").val())
    fundbased.accountno($("#acno").val())
    fundbased.roi(Number($("#roiperannum").val()))
    fundbased.sanclimit(Number($("#sanclimit").val()))
    fundbased.interestpermonth(Number($("#interestpermonth").val()))
    fundbased.securityoffb($("#securityfb").val())

    if ($("#naturefacility").data("kendoDropDownList").value() != "Other"){
        nonfundbased.natureoffacility($("#naturefacility").data("kendoDropDownList").value());
    }else{
        nonfundbased.natureoffacility($("#othernaturefacility").val());
    }
    nonfundbased.sanclimit(Number($("#nfbsanclimit").val()));
    nonfundbased.securityofnfb($("#securitynfb").val());

    var todayDate = new Date().toISOString();
    var latestfacttype = $('#facilitytype').getKendoMultiSelect().value()

    if (latestfacttype.indexOf('Fund Based') > -1){
        nonfundbased.sanctiondate(todayDate);
        var sd = moment($("#fbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
        fundbased.sanctiondate(sd);
    }

    if (latestfacttype.indexOf("Non-Fund Based") > -1){
        fundbased.sanctiondate(todayDate);
        var nfbsd = moment($("#nfbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
        nonfundbased.sanctiondate(nfbsd);
    }

    if (latestfacttype.indexOf("Non-Fund Based") > -1 && latestfacttype.indexOf('Fund Based') > -1){
        var sd = moment($("#fbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
        var nfbsd = moment($("#nfbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
        fundbased.sanctiondate(sd);
        nonfundbased.sanctiondate(nfbsd);
    }
    // if (bankaccount.facilitytype() != "" && bankaccount.facilitytype() == "Fund Based"){
    //     nonfundbased.sanctiondate(todayDate);
    //     var sd = moment($("#fbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
    //     fundbased.sanctiondate(sd);
    // }else if (bankaccount.facilitytype() != "" && bankaccount.facilitytype() == "Non Fund Based"){
    //     fundbased.sanctiondate(todayDate);
    //     var nfbsd = moment($("#nfbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
    //     nonfundbased.sanctiondate(nfbsd);
    // }else{
    //     var sd = moment($("#fbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
    //     var nfbsd = moment($("#nfbsanctiondate").getKendoDatePicker().value()).add(7,'h').toDate().toISOString()
    //     fundbased.sanctiondate(sd);
    //     nonfundbased.sanctiondate(nfbsd);
    // }

    currentbased.accountholder($('#currentacholder').val())
    currentbased.accountno($('#currentacno').val())
    currentbased.accounttype($('#currentactype').val())

    bankaccount.fundbased = fundbased;
    bankaccount.nonfundbased = nonfundbased;
    bankaccount.currentbased = currentbased

    var param = {
        CustomerId : "",
        DealNo : "",
        BankAccount : {},
        BankDetails : [],
        CurrentBankDetails : [],
    }

    param.CustomerId = filter().CustomerSearchVal()
    param.DealNo = filter().DealNumberSearchVal()
    param.BankAccount = bankaccount

    for (var i = 0;i<det.length;i++){
        var bankdet = {}
        bankdet.Month = det[i].Month
        bankdet.CreditNonCash= det[i].CreditNonCash
        bankdet.CreditCash = det[i].CreditCash
        bankdet.CreditTotal = det[i].CreditTotal
        bankdet.DebitNonCash = det[i].DebitNonCash
        bankdet.DebitCash = det[i].DebitCash
        bankdet.DebitTotal = det[i].DebitTotal
        bankdet.AvgBalon = det[i].AvgBalon
        bankdet.OdCcUtilization = det[i].OdCcUtilization
        bankdet.OdCcLimit = det[i].OdCcLimit
        bankdet.ActualInterestPaid = det[i].ActualInterestPaid
        bankdet.NoOfDebit = det[i].NoOfDebit
        bankdet.NoOfCredit = det[i].NoOfCredit
        bankdet.OwCheque = det[i].OwCheque
        bankdet.IwCheque = det[i].IwCheque
        param.BankDetails.push(bankdet);
    }

    for (var i = 0;i<currdet.length;i++){
        var currentbankdet = {}
        currentbankdet.Month = currdet[i].Month
        currentbankdet.CreditNonCash= currdet[i].CreditNonCash
        currentbankdet.CreditCash = currdet[i].CreditCash
        currentbankdet.CreditTotal = currdet[i].CreditTotal
        currentbankdet.DebitNonCash = currdet[i].DebitNonCash
        currentbankdet.DebitCash = currdet[i].DebitCash
        currentbankdet.DebitTotal = currdet[i].DebitTotal
        currentbankdet.AvgBalon = currdet[i].AvgBalon
        currentbankdet.NoOfDebit = currdet[i].NoOfDebit
        currentbankdet.NoOfCredit = currdet[i].NoOfCredit
        currentbankdet.OwCheque = currdet[i].OwCheque
        currentbankdet.IwCheque = currdet[i].IwCheque
        param.CurrentBankDetails.push(currentbankdet);
    }

    var xparam = {Id: databank()[index].Id ,Param:param}
    ajaxPost(url+"/updatev2",xparam,function(res){
        swal("Success","Data Updated","success");
        DrawDataBank(getSearchVal());
        resetInput();
        $('#updatebtn').hide();
        $('#savebtn').show();
        $('#modalAdd').modal('hide');
        setdatestt()
    })

}

/// Create Grid Summary ///
var generateAML = function(data){
    var detail = data.Detail;
    var res = [];
    _.each(detail,function(e,i){
        var db = e.DataBank[0].BankDetails;
        _.each(db,function(ex,ix){
            var dt = _.find(res,function(x){ return x.Month == ex.Month ;});
            if(dt==undefined){
                res.push({ Month : ex.Month , CreditCash : ex.CreditCash, DebitCash : ex.DebitCash});
            }else{
                dt.CreditCash += ex.CreditCash;
                dt.DebitCash += ex.DebitCash;
            }
        })
    });

    var datasum = $("#bankinggrid").getKendoGrid().dataSource.data();

    _.each(res,function(e,i){
        e.Month = moment(e.Month.split("T")[0]).format("MMM-YYYY");
        var dt = _.find(datasum,function(x){ return x.Month == e.Month ;});
        e.CreditCash = parseInt(e.CreditCash / dt.TotalCredit*100);
        e.CreditCash = isFinite(e.CreditCash) ? e.CreditCash : 0;
        e.DebitCash = parseInt(e.DebitCash / dt.TotalDebit*100);
        e.DebitCash = isFinite(e.DebitCash) ? e.DebitCash : 0;
    });

    createAmlGrid(res);
}

var createBankingGrid = function(res,minmargin){
    for(var i in res){
        res[i]["Month"] = moment(res[i]["Month"].split("T")[0]).format("MMM-YYYY")
    }
    $("#bankinggrid").html("");
    $("#bankinggrid").kendoGrid({
        dataSource : {
			data : res,
            aggregate: [
                { field: "TotalCredit", aggregate: "sum" },
                { field: "TotalDebit", aggregate: "sum" },
                { field: "NoOfDebit", aggregate: "sum" },
                { field: "NoOfCredit", aggregate: "sum" },
                { field: "OwCheque", aggregate: "sum" },
                { field: "IwCheque", aggregate: "sum" },
                { field: "Utilization", aggregate: "average" },
                { field: "ImpMargin", aggregate: "sum" },
                { field: "OwReturnPercentage", aggregate: "average" },
                { field: "LwReturnPercentage", aggregate: "average" },
                { field: "DrCrReturnPercentage", aggregate: "average" },
            ]
		},
        columns : [{
            title:"Banking Snapshot",
            headerAttributes: { class: "header-bgcolor" },
            columns:[{
                title:"Months",
                field:"Month",
                headerAttributes: { class: "sub-bgcolor" },
                format:"{0:dd-MMM-yyyy}",
                footerTemplate: 'Total'
            }, {
                title:"Monthly Credits",
                field:"TotalCredit",
                headerAttributes: { class: "sub-bgcolor" },
                aggregates: ["sum"],
                footerTemplate: "<div style='text-align: right'> #= kendo.toString(sum, 'n0') # </div>",
                attributes:{ "style": "text-align:right" },
                template : "#: app.formatnum(TotalCredit) #"
            }, {
                title:"Monthly Debits",
                field:"TotalDebit",
                headerAttributes: { class: "sub-bgcolor" },
                aggregates: ["sum"],
                footerTemplate: "<div style='text-align: right'>#= kendo.toString(sum, 'n0') #</div>",
                attributes:{ "style": "text-align:right" },
                template : "#: app.formatnum(TotalDebit) #"
            }, {
                title:"No. Of Debits",
                field:"NoOfDebit",
                headerAttributes: { class: "sub-bgcolor" },
                aggregates: ["sum"],
                footerTemplate: "<div style='text-align: right'>#= kendo.toString(sum, 'n0') #</div>",
                attributes:{ "style": "text-align:right" },
                template : "#: kendo.toString(NoOfDebit,'N0') #"
            }, {
                title:"No. Of Credits",
                field:"NoOfCredit",
                headerAttributes: { class: "sub-bgcolor" },
                aggregates: ["sum"],
                footerTemplate: "<div style='text-align: right'>#= kendo.toString(sum, 'n0') #</div>",
                attributes:{ "style": "text-align:right" },
                template : "#: kendo.toString(NoOfCredit,'N0') #"
            }, {
                title:"O/W Cheque Returns",
                field:"OwCheque",
                headerAttributes: { class: "sub-bgcolor" },
                aggregates: ["sum"],
                footerTemplate: "<div style='text-align: right'>#= kendo.toString(sum, 'n0') #</div>",
                attributes:{ "style": "text-align:right" },
                template : "#: kendo.toString(OwCheque,'N0') #"
            }, {
                title:"I/W Cheque Returns",
                field:"IwCheque",
                headerAttributes: { class: "sub-bgcolor" },
                aggregates: ["sum"],
                footerTemplate: "<div style='text-align: right'>#= kendo.toString(sum, 'n0') #</div>",
                attributes:{ "style": "text-align:right" },
                template : "#: kendo.toString(IwCheque,'N0') #"
            }, {
                title:"Utilization %",
                field:"Utilization",
                headerAttributes: { class: "sub-bgcolor" },
                aggregates: ["average"],
                footerTemplate: "<div style='text-align: right'>#= kendo.toString(average, 'P1') #</div>",
                attributes:{ "style": "text-align:right" },
                template : "#: kendo.toString(Utilization,'P1') #"
            }, {
                title:"Imp Margin <br> (Margin Taken : "+ kendo.toString(minmargin*100,"n1") +"%)",
                field:"ImpMargin",
                headerAttributes: { class: "sub-bgcolor" },
                aggregates: ["sum"],
                footerTemplate: "<div style='text-align: right'>#= kendo.toString(sum, 'n0') #</div>",
                attributes:{ "style": "text-align:right" },
                template : "#: app.formatnum(ImpMargin,2) #"
            }, {
                title:"O/W Return %",
                field:"OwReturnPercentage",
                headerAttributes: { class: "sub-bgcolor" },
                aggregates: ["sum"],
                footerTemplate: "<div style='text-align: right'>#= kendo.toString(average, 'P1') #</div>",
                attributes:{ "style": "text-align:right" },
                template : "#: kendo.toString(OwReturnPercentage,'P1') #"
            }, {
                title:"I/w return %",
                field:"LwReturnPercentage",
                headerAttributes: { class: "sub-bgcolor" },
                aggregates: ["sum"],
                footerTemplate: "<div style='text-align: right'>#= kendo.toString(average, 'P1') #</div>",
                attributes:{ "style": "text-align:right" },
                template : "#: kendo.toString(LwReturnPercentage,'P1') #"
            }, {
                title:"Dr./Cr. Ratio",
                field:"DrCrReturnPercentage",
                headerAttributes: { class: "sub-bgcolor" },
                aggregates: ["sum"],
                footerTemplate: "<div style='text-align: right'>#= kendo.toString(average, 'N2') #</div>",
                attributes:{ "style": "text-align:right" },
                template : "#: kendo.toString(DrCrReturnPercentage,'N2') #"
            }]
        }],
    });
    RebuildSummary("bankinggrid");
}

var RebuildSummary = function(id){
    $("#"+id+" .k-header:eq(0)").append("<span class='glyphicon glyphicon-chevron-down pull-right'></span");
    $("#"+id+" .k-header:eq(0)").append("<i class='fa fa-list pull-left'></i");
    $("#"+id+" .k-grid-content").hide();
    $("#"+id+" .k-header:eq(0)").unbind("click").bind("click", function (e) {
        var content = $("#"+id+" .k-grid-content:visible");
        if(content.length == 0){
            // $('#summary-panel').height(360)
            $('#summary-panel').animate({height: "350px"}, 500)
            $('#amlgrid').getKendoGrid().options.scrollable = false
            $("#"+id+" .k-grid-content").slideDown("slow");
            $("#"+id+" .k-header:eq(0)").find("span").attr("class",'glyphicon glyphicon-chevron-up pull-right')   
        }else{
            
            $("#"+id+" .k-grid-content").slideUp("slow");
            // $('#summary-panel').height(200)
            $('#summary-panel').animate({height: "200px"}, 500)
            $("#"+id+" .k-header:eq(0)").find("span").attr("class",'glyphicon glyphicon-chevron-down pull-right')
        }
    });
    $("#"+id+" .k-header:eq(0)").attr("style","cursor: pointer;");
}

var createAmlGrid = function(data){
    $("#amlgrid").html("");
    $("#amlgrid").kendoGrid({
        dataSource : {
			data : data,
       aggregate: [ { field: "CreditCash", aggregate: "average" },
                  { field: "DebitCash", aggregate: "average" }]
		},
        
        columns : [
            {
                title:"AML",
                headerAttributes: { class: "header-bgcolor" },
                columns:[
                    {
                        title:"Months",
                        field:"Month",
                        headerAttributes: { class: "sub-bgcolor" },
                        template: "#= kendo.toString(moment.utc(Month).format('DD-MMM-YYYY'), 'dd-MMM-yyyy') #",
                        footerTemplate: "Total"
                    },
                    {
                        title:"Credits",
                        field:"CreditCash",
                        headerAttributes: { class: "sub-bgcolor" },
                        aggregates: ["average"],
                        footerTemplate: "<div style='text-align: right'>#=kendo.toString(average,'N1')#%</div>",
                        template : "#=kendo.toString(CreditCash,'N1') #%",
                        attributes:{ "style": "text-align:right" },
                    },
                    {
                        title:"Debits",
                        field:"DebitCash",
                        headerAttributes: { class: "sub-bgcolor" },
                        aggregates: ["average"],
                        footerTemplate: "<div style='text-align: right'>#=kendo.toString(average,'N1')#%</div>",
                        template : "#=kendo.toString(DebitCash,'N1') #%",
                        attributes:{ "style": "text-align:right" },
                    },
                ]
            },
        ],
    });
    RebuildSummary("amlgrid");
}

var constructOdccModel = function(res){
    var amls = [];
    var odccs = [];
    var currents = []
    var maxodcc = 0.0;
    var details = res.data.Detail;

    _.each(details, function(detail){
        _.each(detail.DataBank[0].BankDetails, function(bankDetail){
            if(bankDetail.OdCcLimit > 0.01){
                odccs.push(bankDetail.AvgBalon / bankDetail.OdCcLimit);
            } else {
                odccs.push(0);
            }
        });
    });

    _.each(details, function(detail){
        var aml = {};
        var current = {}
        var eachDataBank = detail.DataBank[0];
        aml.Bank        = eachDataBank.BankAccount.BankName;
        aml.SancLimit   = eachDataBank.BankAccount.FundBased.SancLimit;

        aml.OdCcUtilization = 0;
        aml.InterestPerMonth = 0;
        aml.abb = 0;
        aml.util = 0;

        current.Bank = eachDataBank.BankAccount.BankName
        // var utilarr = _.map(eachDataBank.BankDetails, function (bd) {
        //         return toolkit.number(bd.AvgBalon / bd. OdCcLimit);
        //     });
        // aml.util =  _.reduce(utilarr, function(memo, num){ return memo + num; }, 0)/ _.filter(utilarr, function(x){ return x > 0; }).length ;
        // aml.util = isFinite(aml.util) ? aml.util : 0;
        if (eachDataBank.BankAccount.FundBased.AccountType.toLowerCase().indexOf('od') > -1) {

            aml.OdCcUtilization = _.max(_.map(eachDataBank.BankDetails, function (bd) {
                return toolkit.number(bd.AvgBalon / bd. OdCcLimit);
            }))

            var interestPerMonth    = eachDataBank.BankAccount.FundBased.InterestPerMonth;
            var actualInterestPaids = _.map(eachDataBank.BankDetails, function(bd) {
                return bd.ActualInterestPaid;
            })

            var actualInterestPaidValue = toolkit.number(_.sum(actualInterestPaids) / actualInterestPaids.length)
            aml.InterestPerMonth = _.max([interestPerMonth, actualInterestPaidValue])
            var abbv = _.reduce(eachDataBank.BankDetails, function(memo, num){ return memo + num.AvgBalon; }, 0)/_.filter(eachDataBank.BankDetails, function(x){ return x.AvgBalon > 0; }).length
            aml.abb = isNaN(abbv) ? 0 : abbv ;
            amls.push(aml);
        }else{
            current.abb = _.reduce(eachDataBank.BankDetails, function(memo, num){ return memo + num.AvgBalon; }, 0)/_.filter(eachDataBank.BankDetails, function(x){ return x.AvgBalon > 0; }).length
            current.abb = isNaN(current.abb) ? 0 : current.abb ;
            currents.push(current)
        }

        //amls.push(aml);
    });

    abbavg = toolkit.number(_.reduce(amls, function(memo, num){ return memo + num.abb; }, 0) /  _.filter(amls, function(x){ return x.abb > 0; }).length);
    abbavgs = toolkit.number(_.reduce(currents, function(memo, num){ return memo + num.abb; }, 0) /  _.filter(currents, function(x){ return x.abb > 0; }).length);

    // for(var i in amls){
    //     amls[i].amlavg = amlavg;
    // }

     //console.log(amls)
    createOdDetailGrid(amls);
    createCurrentDetailGrid(currents);
}

var createCurrentDetailGrid = function(res){
    $('#currentgrid').html('')
    $('#currentgrid').kendoGrid({
        dataSource : {
            data: res,
            aggregate: [
                { field: "abb", aggregate: "average" },
            ]
        },
        scrollable:true,
        height:245,
        columns : [
            {
                title:"ABB",
                headerAttributes: { class: "header-bgcolor" },
                columns:[
                    {
                        title:"Bank",
                        field:"Bank",
                        headerAttributes: { class: "sub-bgcolor" },
                        footerTemplate: "Total",
                    },
                    {
                        title:"ABB",
                        field:"abb",
                        headerAttributes: { class: "sub-bgcolor" },
                        aggregates: ["average"],
                        footerTemplate: "<div style='text-align: right'>#= kendo.toString(abbavgs, 'n0') #</div>",
                        attributes:{ "style": "text-align:right" },
                        template : "#: app.formatnum(abb) #"
                    }
                ]
            }
        ]
    })
    RebuildSummary('currentgrid')
    $('#currentgrid').height(0)
}

var createOdDetailGrid = function(res){
    $("#oddetailgrid").html("");
    $("#oddetailgrid").kendoGrid({
        dataSource : {
			data : res,
            aggregate: [
                { field: "SancLimit", aggregate: "sum" },
                { field: "OdCcUtilization", aggregate: "average" },
                { field: "InterestPerMonth", aggregate: "sum" },
                { field: "abb", aggregate: "average" },
                // { field: "util", aggregate: "average" },
            ],
            
		},
        scrollable:true,
        // height:245,
        columns : [
            {
                title:"OD Details",
                headerAttributes: { class: "header-bgcolor" },
                columns:[
                    {
                        title:"Bank",
                        field:"Bank",
                        headerAttributes: { class: "sub-bgcolor" },
                        footerTemplate: "Total",
                    },
                    {
                        title:"Sanction Limit",
                        field:"SancLimit",
                        headerAttributes: { class: "sub-bgcolor" },
                        aggregates: ["sum"],
                        footerTemplate: "<div style='text-align: right'>#= kendo.toString(sum, 'n0') #</div>",
                        attributes:{ "style": "text-align:right" },
                        template : "#: app.formatnum(SancLimit) #"
                    },
                    {
                        title:"OD Utilization",
                        field:"OdCcUtilization",
                        headerAttributes: { class: "sub-bgcolor" },
                        format:"{0:p1}",
                        aggregates: ["average"],
                        footerTemplate: "<div style='text-align: right'>#= kendo.toString(average, 'p1') #</div>",
                        attributes:{ "style": "text-align:right" },
                        template : "#: kendo.toString(OdCcUtilization,'P1') #"
                    },
                    {
                        title:"Interest Paid",
                        field:"InterestPerMonth",
                        headerAttributes: { class: "sub-bgcolor" },
                        aggregates: ["sum"],
                        footerTemplate: "<div style='text-align: right'>#= kendo.toString(sum, 'n0') #</div>",
                        attributes:{ "style": "text-align:right" },
                        template : "#: kendo.toString(InterestPerMonth,'N0') #"
                    },
                    //  {
                    //     title:"ABB",
                    //     field:"abb",
                    //     headerAttributes: { class: "sub-bgcolor" },
                    //     aggregates: ["average"],
                    //     footerTemplate: "<div style='text-align: right'>#= kendo.toString(abbavg, 'n0') #</div>",
                    //     attributes:{ "style": "text-align:right" },
                    //     template : "#: kendo.toString(abb,'N0') #"
                    // },
                    //  {
                    //     title:"Utilization %",
                    //     field:"util",
                    //     aggregates: ["average"],
                    //     footerTemplate: "<div style='text-align: right'>#= kendo.toString(average, 'P1') #</div>",
                    //     attributes:{ "style": "text-align:right" },
                    //     template : "#: kendo.toString(util,'P1') #"
                    // },
                ]
            },
        ],
    });
    RebuildSummary("oddetailgrid");
    $('#oddetailgrid').height(0)
}

function onChange(){
    if (filter().CustomerSearchVal() == ""){
        swal("Warning","Select Customer First","warning");
        return;
    }else{
        var val = $("#bankstt").data("kendoDatePicker");
        values = val.value();
        dateval = new Date(values);
        bankdetails = [];
        for (i = 0 ; i < 6 ; i++){
            var bb = moment(dateval).subtract(i,'M')
            var con = moment(bb).toDate().toISOString();
            bankdetails.push({
                Month:con,
                CreditNonCash:0.0,
                CreditCash:0.0,
                DebitNonCash:0.0,
                DebitCash:0.0,
                OdCcLimit:0.0,
                ActualInterestPaid:0.0,
                NoOfDebit:0.0,
                NoOfCredit:0.0,
                OwCheque:0.0,
                IwCheque:0.0,
            });
        }
        var bankdetailtemplate = {
            CustomerId : "",
            BankDetails : []
        };
        bankdetailtemplate.CustomerId = filter().CustomerSearchVal();
        bankdetailtemplate.BankDetails = bankdetails;

        ajaxPost(url+"/savedetailbanktemplate",bankdetailtemplate,function(res){
            //createBankingGrid(res.data)
        });

        createBankDetailGrid(bankdetails);
    }
}

