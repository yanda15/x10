package models

import (
	"github.com/eaciit/orm"
	"gopkg.in/mgo.v2/bson"
	// toolkit "github.com/eaciit/toolkit"
)

type SysRolesModel struct {
	orm.ModelBase `bson:"-",json:"-"`
	Id            bson.ObjectId ` bson:"_id" , json:"_id" `
	Name          string
	Menu          []Detailsmenu
	Status        bool
	Landing       string
}

type Detailsmenu struct {
	Menuid   string
	Menuname string
	Access   bool
	View     bool
	Create   bool
	Approve  bool
	Delete   bool
	Process  bool
	Edit     bool
	Parent   string
	Haschild bool
	Enable   bool
	Url      string
	Checkall bool
}

func NewSysRolesModel() *SysRolesModel {
	m := new(SysRolesModel)
	m.Id = bson.NewObjectId()
	return m
}

func (e *SysRolesModel) RecordID() interface{} {
	return e.Id
}

func (m *SysRolesModel) TableName() string {
	return "SysRoles"
}
