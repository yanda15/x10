package controllers

import (
	. "eaciit/x10/webapps/models"
	"errors"
	// "github.com/eaciit/dbox"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"gopkg.in/mgo.v2/bson"
	// "time"
	// "fmt"
)

type DueDiligenceController struct {
	*BaseController
}

// func (c *RatioController) Input(k *knot.WebContext) interface{} {
// 	access := c.LoadBase(k)
// 	k.Config.NoLog = true
// 	k.Config.OutputType = knot.OutputTemplate
// 	DataAccess := Previlege{}

// 	for _, o := range access {
// 		DataAccess.Create = o["Create"].(bool)
// 		DataAccess.View = o["View"].(bool)
// 		DataAccess.Delete = o["Delete"].(bool)
// 		DataAccess.Process = o["Process"].(bool)
// 		DataAccess.Delete = o["Delete"].(bool)
// 		DataAccess.Edit = o["Edit"].(bool)
// 		DataAccess.Menuid = o["Menuid"].(string)
// 		DataAccess.Menuname = o["Menuname"].(string)
// 		DataAccess.Approve = o["Approve"].(bool)
// 		DataAccess.Username = o["Username"].(string)
// 	}

// 	k.Config.OutputType = knot.OutputTemplate
// 	k.Config.IncludeFiles = []string{"shared/filter.html", "shared/loading.html"}

// 	return DataAccess
// }

func (c *DueDiligenceController) Master(k *knot.WebContext) interface{} {
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

	k.Config.OutputType = knot.OutputTemplate
	k.Config.IncludeFiles = []string{"shared/filter.html", "shared/loading.html"}

	return DataAccess
}

func (c *DueDiligenceController) Form(k *knot.WebContext) interface{} {
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

	k.Config.OutputType = knot.OutputTemplate
	k.Config.IncludeFiles = []string{"shared/filter.html", "shared/loading.html"}

	return DataAccess
}

// func (c *RatioController) Report(k *knot.WebContext) interface{} {
// 	access := c.LoadBase(k)
// 	k.Config.NoLog = true
// 	k.Config.OutputType = knot.OutputTemplate
// 	DataAccess := Previlege{}

// 	for _, o := range access {
// 		DataAccess.Create = o["Create"].(bool)
// 		DataAccess.View = o["View"].(bool)
// 		DataAccess.Delete = o["Delete"].(bool)
// 		DataAccess.Process = o["Process"].(bool)
// 		DataAccess.Delete = o["Delete"].(bool)
// 		DataAccess.Edit = o["Edit"].(bool)
// 		DataAccess.Menuid = o["Menuid"].(string)
// 		DataAccess.Menuname = o["Menuname"].(string)
// 		DataAccess.Approve = o["Approve"].(bool)
// 		DataAccess.Username = o["Username"].(string)
// 	}

// 	k.Config.OutputType = knot.OutputTemplate
// 	k.Config.IncludeFiles = []string{"shared/filter.html", "shared/loading.html"}

// 	return DataAccess
// }

func (c *DueDiligenceController) FetchMasterDueDiligence() ([]DueDiligence, error) {
	query := toolkit.M{"order": []string{"Order"}}
	csr, err := c.Ctx.Find(new(DueDiligence), query)
	defer csr.Close()
	if err != nil {
		return nil, err
	}
	results := make([]DueDiligence, 0)
	err = csr.Fetch(&results, 0, false)
	if err != nil {
		return nil, err
	}

	return results, nil
}

func (c *DueDiligenceController) GetVerificationCheck(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson
	query := toolkit.M{"where": dbox.And([]*dbox.Filter{dbox.Eq("section", "Verification Checks")}...)}
	sort := "asc" + "order"
	query.Set("order", []string{sort})
	csr, err := c.Ctx.Find(new(DueDiligence), query)
	defer csr.Close()
	if err != nil {
		return c.SetResultInfo(true, err.Error(), nil)
	}

	results := make([]DueDiligence, 0)
	err = csr.Fetch(&results, 0, false)
	if err != nil {
		return c.SetResultInfo(true, err.Error(), nil)
	}

	return c.SetResultInfo(false, "success", results)
}

func (c *DueDiligenceController) GetDuediligenceInputData(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson
	payload := struct {
		CustomerId string
		DealNo     string
	}{}

	if err := k.GetPayload(&payload); err != nil {
		return c.SetResultInfo(true, err.Error(), nil)
	}

	query := toolkit.M{"where": dbox.And([]*dbox.Filter{dbox.Eq("customerid", payload.CustomerId), dbox.Eq("dealno", payload.DealNo)}...)}
	csr, err := c.Ctx.Find(new(DueDiligenceInput), query)
	defer csr.Close()
	if err != nil {
		return c.SetResultInfo(true, err.Error(), nil)
	}

	results := make([]DueDiligenceInput, 0)
	err = csr.Fetch(&results, 0, false)
	if err != nil {
		return c.SetResultInfo(true, err.Error(), nil)
	}

	return c.SetResultInfo(false, "success", results)
}

func (c *DueDiligenceController) GetDefaultCheck(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson
	query := toolkit.M{"where": dbox.And([]*dbox.Filter{dbox.Eq("section", "Default Checks")}...)}
	sort := "asc" + "order"
	query.Set("order", []string{sort})
	csr, err := c.Ctx.Find(new(DueDiligence), query)
	defer csr.Close()
	if err != nil {
		return c.SetResultInfo(true, err.Error(), nil)
	}

	results := make([]DueDiligence, 0)
	err = csr.Fetch(&results, 0, false)
	if err != nil {
		return c.SetResultInfo(true, err.Error(), nil)
	}

	return c.SetResultInfo(false, "success", results)
}

func (c *DueDiligenceController) DueDiligenceFormSaveInput(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	res := new(toolkit.Result)

	payload := new(DueDiligenceInput)
	if err := k.GetPayload(payload); err != nil {
		res.SetError(err)
		return res
	}

	if payload.Id == "" {
		payload.Id = payload.CustomerId + "|" + payload.DealNo
	}

	if err := c.Ctx.Save(payload); err != nil {
		res.SetError(err)
		return res
	}

	return res
}

func (c *DueDiligenceController) GetMasterDueDiligence(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	res, err := c.FetchMasterDueDiligence()
	if err != nil {
		return err.Error()
	}

	return res
}

func (c *DueDiligenceController) SaveMasterDueDiligence(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	res := new(toolkit.Result)

	// ====== REMOVE PREV DATA
	oldData, err := c.FetchMasterDueDiligence()
	if err != nil {
		return err.Error()
	}

	for _, each := range oldData {
		if err := c.Ctx.Delete(&each); err != nil {
			res.SetError(err)
			return res
		}
	}

	// ====== INSERt PREV DATA
	payload := struct{ Data []DueDiligence }{}
	if err := k.GetPayload(&payload); err != nil {
		res.SetError(err)
		return res
	}

	for _, each := range payload.Data {
		if err := c.Ctx.Save(&each); err != nil {
			res.SetError(err)
			return res
		}
	}

	return res
}

func (c *DueDiligenceController) AddMasterDueDiligence(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	res := new(toolkit.Result)

	payload := new(DueDiligence)
	if err := k.GetPayload(payload); err != nil {
		res.SetError(err)
		return res
	}

	if payload.Id == "" {
		payload.Id = bson.NewObjectId().Hex()
	}

	if err := c.Ctx.Save(payload); err != nil {
		res.SetError(err)
		return res
	}

	return res
}

func (c *DueDiligenceController) FetchFilledDueDiligenceByFieldId(fieldId string) ([]toolkit.M, error) {
	pipe := []toolkit.M{}
	pipe = append(pipe, toolkit.M{"$unwind": "$formdata"})
	pipe = append(pipe, toolkit.M{"$match": toolkit.M{
		"formdata.fieldid": fieldId,
		"formdata.value":   toolkit.M{"$gt": 0},
	}})

	csr, err := c.Ctx.Connection.
		NewQuery().
		Command("pipe", pipe).
		From(new(DueDiligenceInputData).TableName()).
		Cursor(nil)
	if err != nil {
		return nil, err
	}
	defer csr.Close()

	data := []toolkit.M{}
	if err := csr.Fetch(&data, 0, false); err != nil {
		return nil, err
	}

	return data, nil
}

func (c *DueDiligenceController) GetFilledDueDiligence(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	res := new(toolkit.Result)

	payload := toolkit.M{}
	if err := k.GetPayload(&payload); err != nil {
		res.SetError(err)
		return res
	}

	data, err := c.FetchFilledDueDiligenceByFieldId(payload.GetString("Id"))
	if err != nil {
		res.SetError(err)
		return res
	}

	res.SetData(data)
	return res
}

func (c *DueDiligenceController) RemoveMasterDueDiligence(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	res := new(toolkit.Result)

	payload := toolkit.M{}
	if err := k.GetPayload(&payload); err != nil {
		res.SetError(err)
		return res
	}

	data, err := c.FetchFilledDueDiligenceByFieldId(payload.GetString("Id"))
	if err != nil {
		res.SetError(err)
		return res
	}

	if len(data) > 0 {
		res.SetError(errors.New("Field is used in some data. Cannot be deleted."))
		return res
	}

	target := new(DueDiligence)
	target.Id = payload.GetString("Id")
	if err := c.Ctx.Delete(target); err != nil {
		// res.SetError(err)
		// return res
	}

	return res
}

// func (c *RatioController) FetchRatioInputDataByCustomerID(customerID string) (*RatioInputData, error) {
// 	query := toolkit.M{"where": dbox.Eq("customerid", customerID)}
// 	csr, err := c.Ctx.Find(new(RatioInputData), query)
// 	defer csr.Close()
// 	if err != nil {
// 		return nil, err
// 	}

// 	results := make([]RatioInputData, 0)
// 	err = csr.Fetch(&results, 0, false)
// 	if err != nil {
// 		return nil, err
// 	}

// 	if (len(results)) == 0 {
// 		return nil, errors.New("data not found")
// 	}

// 	return &results[0], nil
// }

// func (c *RatioController) Freeze(k *knot.WebContext) interface{} {
// 	k.Config.OutputType = knot.OutputJson

// 	res := new(toolkit.Result)

// 	payload := NewRatioInputData()
// 	if err := k.GetPayload(&payload); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	rowData, err := c.FetchRatioInputDataByCustomerID(payload.CustomerID)
// 	if err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	rowData.Frozen = payload.Frozen

// 	if err := c.Ctx.Save(rowData); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	res.SetData(rowData)
// 	return res
// }

// func (c *RatioController) Confirm(k *knot.WebContext) interface{} {
// 	k.Config.OutputType = knot.OutputJson

// 	res := new(toolkit.Result)

// 	payload := NewRatioInputData()
// 	if err := k.GetPayload(&payload); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	rowData, err := c.FetchRatioInputDataByCustomerID(payload.CustomerID)
// 	if err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	rowData.Confirmed = payload.Confirmed
// 	rowData.LastConfirm = time.Now()

// 	if err := c.Ctx.Save(rowData); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	res.SetData(rowData)
// 	return res
// }

// func (c *RatioController) GetRatioInputData(k *knot.WebContext) interface{} {
// 	k.Config.OutputType = knot.OutputJson

// 	res := new(toolkit.Result)

// 	payload := NewRatioInputData()
// 	if err := k.GetPayload(&payload); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	rowData, err := c.FetchRatioInputDataByCustomerID(payload.CustomerID)
// 	if err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	res.SetData(rowData)
// 	return res
// }

// func (c *RatioController) SaveRatioInputData(k *knot.WebContext) interface{} {
// 	k.Config.OutputType = knot.OutputJson

// 	res := new(toolkit.Result)

// 	payload := NewRatioInputData()
// 	if err := k.GetPayload(&payload); err != nil {
// 		res.SetError(err)
// 		return res
// 	}
// 	if payload.Id == "" {
// 		payload.Id = bson.NewObjectId().Hex()
// 	}

// 	rowData, _ := c.FetchRatioInputDataByCustomerID(payload.CustomerID)
// 	if rowData != nil {
// 		payload.Id = rowData.Id
// 	}

// 	if err := c.Ctx.Save(payload); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	res.SetData(payload.Id)
// 	return res
// }

// func (c *RatioController) FetchRatioFormula() ([]RatioFormula, error) {
// 	query := toolkit.M{}
// 	csr, err := c.Ctx.Find(new(RatioFormula), query)
// 	defer csr.Close()
// 	if err != nil {
// 		return nil, err
// 	}
// 	results := make([]toolkit.M, 0)
// 	err = csr.Fetch(&results, 0, false)
// 	if err != nil {
// 		return nil, err
// 	}

// 	resultsParsed := make([]RatioFormula, 0)
// 	for _, each := range results {
// 		eachParsed := NewRatioFormula()
// 		if err := toolkit.Serde(each, eachParsed, "json"); err != nil {
// 			continue
// 		}

// 		eachParsed.Id = each.GetString("_id")
// 		resultsParsed = append(resultsParsed, *eachParsed)
// 	}

// 	return resultsParsed, nil
// }

// func (c *RatioController) GetFormulaData(k *knot.WebContext) interface{} {
// 	k.Config.OutputType = knot.OutputJson

// 	res := new(toolkit.Result)

// 	fm := new(FormulaModel)
// 	err := fm.GetRatioFormula()
// 	if err != nil {
// 		res.SetError(err)
// 		return res
// 	}
// 	err = fm.GetDataBalanceSheet()
// 	if err != nil {
// 		res.SetError(err)
// 		return res
// 	}
// 	fields := fm.GetFieldsInOrder()

// 	res.SetData(toolkit.M{
// 		"Fields":       fields,
// 		"Formula":      fm.RatioFormula,
// 		"BalanceSheet": fm.BalanceSheet.FormData,
// 	})
// 	return res
// }

// func (c *RatioController) ChangePutAfter(k *knot.WebContext) interface{} {
// 	k.Config.OutputType = knot.OutputJson

// 	res := new(toolkit.Result)

// 	payload := struct {
// 		Alias    string
// 		PutAfter string
// 	}{}
// 	if err := k.GetPayload(&payload); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	query := toolkit.M{"where": dbox.Eq("_id", payload.Alias)}
// 	csr, err := c.Ctx.Find(new(RatioFormula), query)
// 	defer csr.Close()
// 	if err != nil {
// 		res.SetError(err)
// 		return res
// 	}
// 	results := make([]RatioFormula, 0)
// 	err = csr.Fetch(&results, 0, false)
// 	if err != nil {
// 		res.SetError(err)
// 		return res
// 	}
// 	if len(results) == 0 {
// 		return res
// 	}

// 	results[0].PutAfter = payload.PutAfter
// 	err = c.Ctx.Save(&results[0])
// 	if err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	return nil
// }

// func (c *RatioController) SaveFormula(k *knot.WebContext) interface{} {
// 	k.Config.OutputType = knot.OutputJson

// 	res := new(toolkit.Result)

// 	payload := struct {
// 		RatioFormula
// 		IsNew bool
// 	}{}
// 	if err := k.GetPayload(&payload); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	if payload.IsNew {
// 		query := toolkit.M{"where": dbox.Eq("_id", payload.Id)}
// 		csr, err := c.Ctx.Find(new(RatioFormula), query)
// 		defer csr.Close()
// 		if err != nil {
// 			res.SetError(err)
// 			return res
// 		}

// 		if csr.Count() > 0 {
// 			res.SetError(errors.New("Alias is used. Try another."))
// 			return res
// 		}
// 	}

// 	if err := c.Ctx.Save(&payload.RatioFormula); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	res.SetData(true)
// 	return res
// }

// func (c *RatioController) DeleteFormula(k *knot.WebContext) interface{} {
// 	k.Config.OutputType = knot.OutputJson

// 	res := new(toolkit.Result)

// 	payload := new(RatioFormula)
// 	if err := k.GetPayload(&payload); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	if err := c.Ctx.GetById(payload, payload.Id); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	if err := c.Ctx.Delete(payload); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	res.SetData(true)
// 	return res
// }

// func (c *RatioController) GetReportData(k *knot.WebContext) interface{} {
// 	k.Config.OutputType = knot.OutputJson

// 	res := new(toolkit.Result)

// 	fm := new(FormulaModel)
// 	if err := k.GetPayload(fm); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	err := fm.GetData()
// 	if err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	bs, err := fm.CalculateBalanceSheet()
// 	if err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	res.SetData(bs)
// 	return res
// }

// func (c *RatioController) GetFormulaModelData(k *knot.WebContext) interface{} {
// 	k.Config.OutputType = knot.OutputJson

// 	res := new(toolkit.Result)

// 	fm := new(FormulaModel)
// 	if err := k.GetPayload(fm); err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	err := fm.GetData()
// 	if err != nil {
// 		res.SetError(err)
// 		return res
// 	}

// 	res.SetData(fm)
// 	return res
// }
