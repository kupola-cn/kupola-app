package models

import "time"

type User struct {
	ID            uint   `gorm:"primaryKey"`
	Username      string `gorm:"size:64;uniqueIndex;not null"`
	PasswordHash  string `gorm:"size:255;not null"`
	Name          string `gorm:"size:100;not null"`
	Email         string `gorm:"size:255;uniqueIndex;not null"`
	Role          string `gorm:"size:64;not null"`
	OrgID         int    `gorm:"not null"`
	Status        string `gorm:"size:16;not null;default:active"`
	Phone         string `gorm:"size:32"`
	Address       string `gorm:"size:255"`
	SystemAccount bool   `gorm:"not null;default:false;index"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	LastLogin     *time.Time
}

func (User) TableName() string {
	return "users"
}
