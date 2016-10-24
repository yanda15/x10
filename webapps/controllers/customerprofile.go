package controllers

import (
	. "eaciit/x10/webapps/connection"
	. "eaciit/x10/webapps/helper"
	. "eaciit/x10/webapps/models"
	"fmt"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	tk "github.com/eaciit/toolkit"
	"strconv"
	"strings"
	"time"
	// "gopkg.in/mgo.v2/bson"
)

func (c *DataCapturingController) CustomerProfileInfo(k *knot.WebContext) interface{} {
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
	k.Config.IncludeFiles = []string{"shared/filter.html", "datacapturing/detailforapplicant.html", "datacapturing/financialinformation.html", "datacapturing/nonrefundableprocessingfeesdetails.html", "datacapturing/detailsofpromotersdirectorsguarantors.html", "shared/loading.html"}

	return DataAccess
}

func (c *DataCapturingController) GetCustomerProfile(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	mm, err := GetConnection()
	defer mm.Close()
	csr, e := mm.NewQuery().
		Select("_id", "applicantdetail.CustomerName", "applicantdetail.DealNo").
		From("CustomerProfile").
		Cursor(nil)

	if e != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr == nil {
		return CreateResult(true, nil, "")
	}

	defer csr.Close()

	results := []tk.M{}
	err = csr.Fetch(&results, 0, false)
	if err != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr == nil {
		return CreateResult(false, nil, "No data found !")
	}

	return results
}

func (c *DataCapturingController) GetCustomerProfileList(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	mm, err := GetConnection()
	defer mm.Close()
	csr, e := mm.NewQuery().
		From("MasterCustomer").
		Cursor(nil)

	if e != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr == nil {
		return CreateResult(true, nil, "")
	}

	defer csr.Close()

	results := []tk.M{}
	err = csr.Fetch(&results, 0, false)
	if err != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr == nil {
		return CreateResult(false, nil, "No data found !")
	}

	return results
}

func (c *DataCapturingController) GetCustomerProfileDetail(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	p := struct {
		CustomerId string
		Dealno     string
	}{}

	k.GetPayload(&p)

	cn, err := GetConnection()
	defer cn.Close()
	csr, e := cn.NewQuery().
		Where(dbox.And(dbox.Eq("_id", p.CustomerId+"|"+p.Dealno))).
		From("CustomerProfile").
		Cursor(nil)

	if e != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr == nil {
		return CreateResult(true, nil, "")
	}

	defer csr.Close()

	results := []CustomerProfiles{}
	err = csr.Fetch(&results, 0, false)
	if err != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr == nil {
		return CreateResult(false, nil, "No data found !")
	}

	return results
}

func (c *DataCapturingController) GetCustomerProfileDetailByCustid(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson

	p := struct {
		CustomerId string
		DealNo     string
	}{}

	e := k.GetPayload(&p)
	c.WriteLog(p)
	cn, err := GetConnection()
	defer cn.Close()
	id, _ := strconv.Atoi(strings.TrimSpace(p.CustomerId))
	csr, e := cn.NewQuery().
		Where(dbox.And(dbox.Eq("applicantdetail.CustomerID", id), dbox.Eq("applicantdetail.DealNo", p.DealNo))).
		From("CustomerProfile").
		Cursor(nil)

	if e != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr == nil {
		return CreateResult(true, nil, "")
	}

	customerProfile := CustomerProfiles{}
	err = csr.Fetch(&customerProfile, 1, true)
	if err != nil {
		return CreateResult(false, nil, err.Error())
	} else if csr == nil {
		return CreateResult(false, nil, "No data found !")
	}

	csr.Close()

	csr, e = cn.NewQuery().
		Where(dbox.And(dbox.Eq("Profile.customerid", id), dbox.Eq("Profile.dealno", p.DealNo))).
		From("CibilReport").
		Cursor(nil)

	if e != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr == nil {
		return CreateResult(true, nil, "")
	}

	cibilReport := []CibilReportModel{}
	err = csr.Fetch(&cibilReport, 0, false)
	if err != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr == nil {
		return CreateResult(false, nil, "No data found !")
	}

	csr, e = cn.NewQuery().
		Where(dbox.And(dbox.Eq("Profile.customerid", id), dbox.Eq("Profile.dealno", p.DealNo))).
		From("CibilReport").
		Cursor(nil)

	if e != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr == nil {
		return CreateResult(true, nil, "")
	}

	cibilReporttk := []tk.M{}
	err = csr.Fetch(&cibilReporttk, 0, false)
	if err != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr == nil {
		return CreateResult(false, nil, "No data found !")
	}
	for idx := range cibilReporttk {
		detail := cibilReporttk[idx]["DetailReportSummary"]
		resjson := []DetailReportSummary{}
		tk.Serde(detail, &resjson, "json")
		cibilReport[idx].DetailReportSummary = resjson
	}

	csr.Close()

	cibilDraft := CibilDraftModel{}
	if len(cibilReport) > 1 {
		csr, e = cn.NewQuery().
			Where(dbox.And(dbox.Eq("Profile.customerid", id), dbox.Eq("Profile.dealno", p.DealNo))).
			From("CibilDraft").
			Cursor(nil)
		if e != nil {
			return CreateResult(false, nil, e.Error())
		} else if csr.Count() > 0 {
			err = csr.Fetch(&cibilDraft, 1, true)
			if err != nil {
				return CreateResult(false, nil, err.Error())
			} else if csr == nil {
				return CreateResult(false, nil, "No data found !")
			}
		}

		csr.Close()
	}

	resprom := []tk.M{}
	csr, e = cn.NewQuery().
		Where(dbox.And(dbox.Eq("ConsumerInfo.CustomerId", id), dbox.Eq("ConsumerInfo.DealNo", p.DealNo))).
		From("CibilReportPromotorFinal").
		Cursor(nil)
	if e != nil {
		return CreateResult(false, nil, e.Error())
	} else if csr.Count() > 0 {
		err = csr.Fetch(&resprom, 0, true)
		if err != nil {
			return CreateResult(false, nil, err.Error())
		} else if csr == nil {
			return CreateResult(false, nil, "No data found !")
		}
	}

	results := []tk.M{}
	results = append(results, tk.M{}.Set("CustomerProfile", customerProfile))
	results = append(results, tk.M{}.Set("CibilReport", cibilReport))
	results = append(results, tk.M{}.Set("CibilDraft", cibilDraft))
	results = append(results, tk.M{}.Set("Promotors", resprom))

	return results
}

func (c *DataCapturingController) SaveCustomerProfileDetail(k *knot.WebContext) interface{} {
	k.Config.OutputType = knot.OutputJson
	Username := ""
	if k.Session("username") != nil {
		Username = k.Session("username").(string)
	}

	p := CustomerProfiles{}

	k.GetPayload(&p)

	p.LastUpdate = time.Now()
	p.UpdatedBy = Username

	if p.Status == 1 {
		p.ConfirmedBy = Username
		p.ConfirmedDate = time.Now()
	} else if p.Status == 2 {
		p.VerifiedBy = Username
		p.VerifiedDate = time.Now()
	}
	// fmt.Println(p.ApplicantDetail)
	// fmt.Println(p)
	e := c.Ctx.Save(&p)
	if e != nil {
		fmt.Println(e)
	}
	return p
}
