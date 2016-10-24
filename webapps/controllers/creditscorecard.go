package controllers

import (
	. "eaciit/x10/webapps/connection"
	// . "eaciit/x10/webapps/helper"
	. "eaciit/x10/webapps/models"
	"errors"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	tk "github.com/eaciit/toolkit"
	// "strconv"
	// "strings"
	// "time"
	"gopkg.in/mgo.v2/bson"
)

type CreditScoreCardController struct {
	*BaseController
}

func (c *CreditScoreCardController) Default(k *knot.WebContext) interface{} {
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
	k.Config.IncludeFiles = []string{"shared/filter.html", "shared/loading.html", "creditscorecard/form.html"}

	return DataAccess
}

func (c *CreditScoreCardController) New(k *knot.WebContext) interface{} {
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
	k.Config.IncludeFiles = []string{"shared/filter.html", "shared/loading.html", "creditscorecard/form.html"}

	return DataAccess
}

//get data grid
func (a *CreditScoreCardController) GetAllData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	res := new(tk.Result)
	t := tk.M{}
	err := r.GetPayload(&t)
	if err != nil {
		res.SetError(err)
		return res
	}

	id := t.GetString("customerid") + "|" + t.GetString("dealno")
	// dealno := t.GetString("dealno")
	customerid := t.GetString("customerid")
	tk.Println(id)
	//get data grid
	c, err := GetConnection()
	defer c.Close()
	csr, e := c.NewQuery().
		Where(dbox.And(dbox.Eq("customerid", id))).
		From("RatioInputData").
		Cursor(nil)
	defer csr.Close()
	if e != nil {
		res.SetError(e)
		return res
	} else if csr.Count() == 0 {
		res.SetError(errors.New("Balance Sheet not found"))
		return res
	}

	ratio := []tk.M{}
	err = csr.Fetch(&ratio, 0, false)
	if err != nil {
		res.SetError(err)
		return res
	}

	csr, e = c.NewQuery().
		From("BalanceSheetInput").
		Cursor(nil)
	defer csr.Close()
	if e != nil {
		res.SetError(e)
		return res
	} else if csr.Count() == 0 {
		res.SetError(errors.New("Balance Sheet Master not found"))
		return res
	}

	ratiomaster := []tk.M{}
	err = csr.Fetch(&ratiomaster, 0, false)
	if err != nil {
		res.SetError(err)
		return res
	}

	// csr, e = c.NewQuery().
	// 	Where(dbox.And(dbox.Eq("CustomerId", customerid))). //harus nya ada deal no juga
	// 	From("RepaymentRecords").
	// 	Cursor(nil)

	arr, summary, err := new(RTRBottom).GetData(t.GetString("customerid"), t.GetString("dealno"))

	if err != nil {
		res.SetError(err)
		return res
	} else if len(arr) == 0 {
		res.SetError(errors.New("RTR data not found"))
		return res
	}

	// rtr := []tk.M{}
	// err = csr.Fetch(&rtr, 0, false)
	// if err != nil {
	// 	res.SetError(err)
	// 	return res
	// }

	csr, e = c.NewQuery().
		Where(dbox.And(dbox.Eq("_id", id))).
		From("AccountDetails").
		Cursor(nil)
	defer csr.Close()
	if e != nil {
		res.SetError(e)
		return res
	} else if csr.Count() == 0 {
		res.SetError(errors.New("Account Detail data not found"))
		return res
	}

	accdet := []tk.M{}
	err = csr.Fetch(&accdet, 0, false)
	if err != nil {
		res.SetError(err)
		return res
	}

	csr, e = c.NewQuery().
		From("RatingMaster").
		Cursor(nil)
	defer csr.Close()
	if e != nil {
		res.SetError(e)
		return res
	} else if csr.Count() == 0 {
		res.SetError(errors.New("Rating Master data not found"))
		return res
	}

	ratmas := []tk.M{}
	err = csr.Fetch(&ratmas, 0, false)
	if err != nil {
		res.SetError(err)
		return res
	}

	csr, e = c.NewQuery().
		From("RatingData").
		Cursor(nil)
	defer csr.Close()
	if e != nil {
		res.SetError(e)
		return res
	} else if csr.Count() == 0 {
		res.SetError(errors.New("Rating Master data not found"))
		return res
	}

	ratdat := []tk.M{}
	err = csr.Fetch(&ratdat, 0, false)
	if err != nil {
		res.SetError(err)
		return res
	}

	csr, e = c.NewQuery().
		Where(dbox.And(
			dbox.Eq("CustomerId", tk.ToInt(customerid, tk.RoundingAuto)),
			// dbox.Eq("CustomerName", customerna),
		)).
		From("BankAnalysisV2").
		Cursor(nil)
	defer csr.Close()
	if e != nil {
		res.SetError(e)
		return res
	} else if csr.Count() == 0 {
		res.SetError(errors.New("Bank Analysis data not found"))
		return res
	}

	bank := []BankAnalysisV2{}
	err = csr.Fetch(&bank, 0, false)
	if err != nil {
		res.SetError(err)
		return res
	}
	banksum := new(BankAnalysis).GenerateBankSummaryV2(bank)

	data := tk.M{}
	data.Set("BalanceSheetInput", ratio)
	data.Set("BalanceSheetMaster", ratiomaster)
	data.Set("RTR", arr)
	data.Set("RTRSummary", summary)
	data.Set("AccountDetail", accdet)
	data.Set("RatingMaster", ratmas)
	data.Set("RatingData", ratdat)
	data.Set("Bank", tk.M{"Data": bank, "Summary": banksum})

	res.SetData(data)
	return res
}

func (c *CreditScoreCardController) SaveData(k *knot.WebContext) interface{} {

	k.Config.OutputType = knot.OutputJson

	res := new(tk.Result)

	t := struct {
		Id          bson.ObjectId `bson:"_id" , json:"_id" `
		CustomerId  string        `bson:"CustomerId"`
		DealNo      string        `bson:"DealNo"`
		Data        []interface{} `bson:"Data"`
		FinalScore  string        `bson:"FinalScore"`
		FinalRating string        `bson:"FinalRating"`
	}{}

	err := k.GetPayload(&t)
	if err != nil {
		res.SetError(err)
		return res
	}

	conn, err := GetConnection()
	defer conn.Close()
	if err != nil {
		res.SetError(err)
		return res
	}

	e := conn.NewQuery().
		Delete().
		From("CreditScorecard").
		SetConfig("multiexec", true).
		Where(dbox.Eq("CustomerId", t.CustomerId)).
		Exec(nil)
	if e != nil {
		tk.Printf("Delete fail: %s", e.Error())
	}

	qinsert := conn.NewQuery().
		From("CreditScorecard").
		SetConfig("multiexec", true).
		Save()

	t.Id = bson.NewObjectId()
	csc := map[string]interface{}{"data": t}
	err = qinsert.Exec(csc)
	if err != nil {
		res.SetError(err)
		return res
	}

	res.SetData(t)
	return res
}

func (c *CreditScoreCardController) GetCscData(k *knot.WebContext) interface{} {

	k.Config.OutputType = knot.OutputJson

	res := new(tk.Result)

	t := struct {
		CustomerId string `bson:"CustomerId"`
		DealNo     string `bson:"DealNo"`
	}{}

	err := k.GetPayload(&t)
	if err != nil {
		res.SetError(err)
		return res
	}

	conn, err := GetConnection()
	defer conn.Close()
	if err != nil {
		res.SetError(err)
		return res
	}

	q, e := conn.NewQuery().
		Where(dbox.And(dbox.Eq("CustomerId", t.CustomerId))).
		From("CreditScorecard").
		Cursor(nil)
	defer q.Close()
	if e != nil {
		res.SetError(e)
		return res
	} else if q.Count() == 0 {
		res.SetError(errors.New("Rating Master data not found"))
		return res
	}

	csc := []struct {
		Id         bson.ObjectId `bson:"_id" , json:"_id" `
		CustomerId string        `bson:"CustomerId"`
		DealNo     string        `bson:"DealNo"`
		Data       []interface{} `bson:"Data"`
	}{}
	err = q.Fetch(&csc, 0, false)
	if err != nil {
		res.SetError(err)
		return res
	}

	res.SetData(csc)
	return res
}

func (c *CreditScoreCardController) GetCscDataV1(k *knot.WebContext) interface{} {

	k.Config.OutputType = knot.OutputJson

	res := new(tk.Result)

	t := struct {
		CustomerId string `bson:"CustomerId"`
		DealNo     string `bson:"DealNo"`
	}{}

	err := k.GetPayload(&t)
	if err != nil {
		res.SetError(err)
		return res
	}

	conn, err := GetConnection()
	defer conn.Close()
	if err != nil {
		res.SetError(err)
		return res
	}

	q, e := conn.NewQuery().
		Where(dbox.And(dbox.Eq("CustomerId", t.CustomerId), dbox.Eq("DealNo", t.DealNo))).
		From("CreditScorecard").
		Cursor(nil)
	defer q.Close()
	if e != nil {
		res.SetError(e)
		return res
	} else if q.Count() == 0 {
		res.SetError(errors.New("Rating Master data not found"))
		return res
	}

	csc := []struct {
		Id          bson.ObjectId `bson:"_id" , json:"_id" `
		CustomerId  string        `bson:"CustomerId"`
		DealNo      string        `bson:"DealNo"`
		Data        []interface{} `bson:"Data"`
		FinalScore  string        `bson:"FinalScore"`
		FinalRating string        `bson:"FinalRating"`
	}{}
	err = q.Fetch(&csc, 0, false)
	if err != nil {
		res.SetError(err)
		return res
	}

	res.SetData(csc)
	return res
}

func (c *CreditScoreCardController) GetCreditScoreCardData(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	res := new(tk.Result)

	fm := new(FormulaModel)
	if err := k.GetPayload(fm); err != nil {
		res.SetError(err)
		return res
	}

	err := fm.GetData()
	if err != nil {
		res.SetError(err)
		return res
	}

	bs, err := fm.CalculateScoreCard()
	if err != nil {
		res.SetError(err)
		return res
	}

	res.SetData(tk.M{
		"FormulaModel":    fm,
		"CreditScoreData": bs,
	})
	return res
}
