package controllers

import (
	. "eaciit/x10/webapps/helper"
	. "eaciit/x10/webapps/models"
	"github.com/eaciit/knot/knot.v1"
	tk "github.com/eaciit/toolkit"
	"strconv"
)

type ApprovalController struct {
	*BaseController
}

func (c *ApprovalController) Default(k *knot.WebContext) interface{} {
	access := c.LoadBase(k)
	k.Config.NoLog = true
	k.Config.OutputType = knot.OutputTemplate
	DataAccess := Previlege{}

	for _, o := range access {
		DataAccess.Create = o["Create"].(bool)
		DataAccess.View = o["View"].(bool)
		DataAccess.Delete = o["Delete"].(bool)
		DataAccess.Process = o["Process"].(bool)
		DataAccess.Delete = o["Delete"].(bool)
		DataAccess.Edit = o["Edit"].(bool)
		DataAccess.Menuid = o["Menuid"].(string)
		DataAccess.Menuname = o["Menuname"].(string)
		DataAccess.Approve = o["Approve"].(bool)
		DataAccess.Username = o["Username"].(string)
	}

	DataAccess.TopMenu = c.GetTopMenuName(DataAccess.Menuname)

	k.Config.OutputType = knot.OutputTemplate
	k.Config.IncludeFiles = []string{
		"shared/filter.html",
		"shared/loading.html",
		"approval/accountdetails.html",
		"approval/balancesheet.html",
		"approval/default.html",
		"approval/liquidityratios.html",
		"approval/pandl.html",
		"approval/bankingsnapshot.html",
		"approval/keyfinancialparameters.html",
		"approval/loandetails.html",
		"approval/borrowerdetails.html",
		"approval/keyfinancialratios.html",
		"approval/operatingratios.html",
		"approval/ratingsandreferences.html",
		"approval/cibildetails.html",
		"approval/keypolicyparameters.html",
		"approval/outstandingdebt.html",
		"approval/realestateposition.html",
		"approval/coverageratios.html",
		"approval/leverageratios.html",
		"approval/overview.html",
		"approval/redflags.html",
		"approval/comments.html",
		"approval/headerstatis.html",
		"approval/allfield.html",
		"loanapproval/loansummary.html",
		"loanapproval/loandetail.html",
		"loanapproval/paymenttrack.html",
		"loanapproval/keypolicyparametercheck.html",
		"loanapproval/promotersbackground.html",
		"loanapproval/companybackground.html",
		"loanapproval/referencecheck.html",
		"loanapproval/loanproperty.html",
		"loanapproval/loanourstanding.html",
		"loanapproval/loancompliance.html",
		"loanapproval/custbussinesmix.html",
		"loanapproval/compliancecheck.html",
	}

	return DataAccess
}

func (c *ApprovalController) GetCreditAnalys(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	datas := tk.M{}
	err := k.GetPayload(&datas)
	if err != nil {
		return CreateResult(false, nil, err.Error())
	}

	customerId, e := strconv.Atoi(datas.GetString("CustomerId"))
	if e != nil {
		panic(e)
	}
	dealNo := datas.GetString("DealNo")

	model := NewCreditAnalysModel()
	result, err := model.Get(customerId, dealNo)

	if err != nil {
		return CreateResult(false, nil, err.Error())
	}

	return CreateResult(true, result, "")
}

func (c *ApprovalController) GetDCFinalSanction(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	datas := tk.M{}
	err := k.GetPayload(&datas)
	if err != nil {
		return CreateResult(false, nil, err.Error())
	}

	customerId, e := strconv.Atoi(datas.GetString("CustomerId"))
	if e != nil {
		panic(e)
	}
	dealNo := datas.GetString("DealNo")

	model := NewDCFinalSanctionModel()
	result, err := model.Get(customerId, dealNo)
	if err != nil {
		return CreateResult(false, nil, err.Error())
	}

	return CreateResult(true, result, "")
}

func (c *ApprovalController) GetDCAndCreditAnalys(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	datas := tk.M{}
	err := k.GetPayload(&datas)
	if err != nil {
		return CreateResult(false, nil, err.Error())
	}

	customerId, e := strconv.Atoi(datas.GetString("CustomerId"))
	if e != nil {
		panic(e)
	}
	dealNo := datas.GetString("DealNo")

	modelDC := NewDCFinalSanctionModel()
	resultDC, err := modelDC.Get(customerId, dealNo)
	if err != nil {
		//return CreateResult(false, nil, err.Error())
	}

	modelCredit := NewCreditAnalysModel()
	resultCredit, err := modelCredit.Get(customerId, dealNo)
	if err != nil {
		//return CreateResult(false, nil, err.Error())
	}

	return []tk.M{{"CreditAnalys": resultCredit}, {"DCFinalSanction": resultDC}}
}

func (c *ApprovalController) SaveCreditAnalys(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	datas := CreditAnalysModel{}
	err := k.GetPayload(&datas)
	if err != nil {
		return CreateResult(false, nil, err.Error())
	}

	model := NewCreditAnalysModel()
	result, err := model.Save(datas)
	if err != nil {
		return CreateResult(false, nil, err.Error())
	}

	return CreateResult(true, result, "")
}

func (c *ApprovalController) SaveDCFinalSanction(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	datas := DCFinalSanctionModel{}
	err := k.GetPayload(&datas)
	if err != nil {
		return CreateResult(false, nil, err.Error())
	}

	model := NewDCFinalSanctionModel()
	result, err := model.Save(datas)
	if err != nil {
		return CreateResult(false, nil, err.Error())
	}

	return CreateResult(true, result, "")
}
