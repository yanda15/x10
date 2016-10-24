package models

import (
	"github.com/eaciit/orm"
	"time"

	"gopkg.in/mgo.v2/bson"
)

type ConsumerInfo struct {
	CustomerId   int       `bson:"CustomerId"`
	DealNo       string    `bson:"DealNo"`
	ConsumerName string    `bson:"ConsumerName"`
	DateOfBirth  time.Time `bson:"DateOfBirth"`
	Gender       string    `bson:"Gender"`
}

type ReportData struct {
	orm.ModelBase            `bson:"-",json:"-"`
	Id                       bson.ObjectId     `bson:"_id" , json:"_id"`
	FilePath                 string            `bson:"FilePath"`
	FileName                 string            `bson:"FileName"`
	ReportType               string            `bson:"ReportType"`
	IsMatch                  bool              `bson:"IsMatch"`
	ConsumersInfos           ConsumerInfo      `bson:"ConsumerInfo"`
	DateOfReport             time.Time         `bson:"DateOfReport"`
	TimeOfReport             time.Time         `bson:"TimeOfReport"`
	CibilScoreVersion        string            `bson:"CibilScoreVersion"`
	CibilScore               int               `bson:"CibilScore"`
	ScoringFactor            []string          `bson:"ScoringFactor"`
	IncomeTaxIdNumber        string            `bson:"IncomeTaxIdNumber"`
	PassportNumber           string            `bson:"PassportNumber"`
	Telephones               []ReportTelephone `bson:"Telephones"`
	EmailAddress             []string          `bson:"EmailAddress"`
	AddressData              []ReportAddress   `bson:"AddressData"`
	TotalAccount             int               `bson:"TotalAccount"`
	TotalOverdues            int               `bson:"TotalOverdues"`
	TotalZeroBalanceAcc      int               `bson:"TotalZeroBalanceAcc"`
	HighCreditSanctionAmount float64           `bson:"HighCreditSanctionAmount"`
	CurrentBalance           float64           `bson:"CurrentBalance"`
	OverdueBalance           float64           `bson:"OverdueBalance"`
	DateOpenedRecent         time.Time         `bson:"DateOpenedRecent"`
	DateOpenedOldest         time.Time         `bson:"DateOpenedOldest"`
	TotalEnquiries           int               `bson:"TotalEnquiries"`
	TotalEnquiries30Days     int               `bson:"TotalEnquiries30Days"`
	RecentEnquiriesDates     time.Time         `bson:"RecentEnquiriesDates"`
	StatusCibil              int               `bson:"StatusCibil,omitempty"`
}

func (e *ReportData) RecordID() interface{} {
	return e.Id
}

func (m *ReportData) TableName() string {
	return "CibilReportPromotorFinal"
}

type ReportTelephone struct {
	Type   string `bson:"Type"`
	Number string `bson:"Number"`
}

type ReportAddress struct {
	AddressPinCode string    `bson:"AddressPinCode"`
	Category       string    `bson:"Category"`
	DateReported   time.Time `bson:"DateReported"`
}
