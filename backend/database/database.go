package database

import (
	"context"
	"errors"
	"fmt"
	"time"

	"kupola-app-backend/config"
	"kupola-app-backend/models"
	"kupola-app-backend/security"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

func Open(cfg *config.Config) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.DatabaseDSN), &gorm.Config{Logger: gormlogger.Default.LogMode(gormlogger.Silent)})
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get database handle: %w", err)
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(time.Hour)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(ctx); err != nil {
		_ = sqlDB.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}
	return db, nil
}

func Close(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(&models.User{})
}

func Seed(db *gorm.DB) error {
	defaultPasswordHash, err := security.HashPassword("123456")
	if err != nil {
		return fmt.Errorf("hash seed password: %w", err)
	}
	adminPasswordHash, err := security.HashPassword("newpass123")
	if err != nil {
		return fmt.Errorf("hash admin seed password: %w", err)
	}

	seeds := []models.User{
		{Username: "zhangsan", Name: "张三", Email: "zhangsan@example.com", Role: "admin", OrgID: 1, Status: "active", Phone: "13800138000", Address: "北京市朝阳区望京街道 88 号", SystemAccount: false, LastLogin: seedTime("2026-07-25 09:30:00")},
		{Username: "lisi", Name: "李四", Email: "lisi@example.com", Role: "auditor", OrgID: 3, Status: "active", Phone: "13900139000", Address: "上海市徐汇区漕溪北路 66 号", SystemAccount: false, LastLogin: seedTime("2026-07-24 18:05:00")},
		{Username: "wangwu", Name: "王五", Email: "wangwu@example.com", Role: "viewer", OrgID: 5, Status: "inactive", Phone: "13700137000", Address: "杭州市西湖区文三路 18 号", SystemAccount: false, LastLogin: seedTime("2026-06-30 11:12:00")},
		{Username: "zhaoliu", Name: "赵六", Email: "zhaoliu@example.com", Role: "viewer", OrgID: 8, Status: "active", Phone: "13600136000", Address: "深圳市南山区科技园 12 号", SystemAccount: false, LastLogin: seedTime("2026-07-26 08:40:00")},
		{Username: "qianqi", Name: "钱七", Email: "qianqi@example.com", Role: "operator", OrgID: 6, Status: "active", Phone: "13500135000", Address: "成都市高新区天府大道 28 号", SystemAccount: false, LastLogin: seedTime("2026-07-22 16:15:00")},
		{Username: "sunba", Name: "孙八", Email: "sunba@example.com", Role: "viewer", OrgID: 2, Status: "locked", Phone: "13400134000", Address: "上海市浦东新区世纪大道 100 号 12F", SystemAccount: false, LastLogin: seedTime("2026-07-10 12:20:00")},
		{Username: "zhoujiu", Name: "周九", Email: "zhoujiu@example.com", Role: "operator", OrgID: 7, Status: "active", Phone: "13300133000", Address: "深圳市南山区科技园 12 号", SystemAccount: false, LastLogin: seedTime("2026-07-27 10:02:00")},
		{Username: "wushi", Name: "吴十", Email: "wushi@example.com", Role: "viewer", OrgID: 8, Status: "inactive", Phone: "13200132000", Address: "深圳市南山区科技园 12 号 4F", SystemAccount: false, LastLogin: seedTime("2026-07-05 09:16:00")},
		{Username: "zhengyi", Name: "郑一", Email: "zhengyi@example.com", Role: "admin", OrgID: 1, Status: "active", Phone: "13100131000", Address: "上海市浦东新区世纪大道 100 号", SystemAccount: false, LastLogin: seedTime("2026-07-26 21:44:00")},
		{Username: "fenger", Name: "冯二", Email: "feng-er@example.com", Role: "auditor", OrgID: 3, Status: "active", Phone: "13000130000", Address: "上海市浦东新区世纪大道 100 号 10F", SystemAccount: false, LastLogin: seedTime("2026-07-23 13:35:00")},
		{Username: "chensan", Name: "陈三", Email: "chensan@example.com", Role: "viewer", OrgID: 2, Status: "active", Phone: "12900129000", Address: "上海市浦东新区世纪大道 100 号 12F", SystemAccount: false, LastLogin: seedTime("2026-07-21 15:28:00")},
		{Username: "chusi", Name: "褚四", Email: "chusi@example.com", Role: "operator", OrgID: 7, Status: "locked", Phone: "12800128000", Address: "深圳市南山区科技园 12 号", SystemAccount: false, LastLogin: seedTime("2026-07-18 19:12:00")},
		{Username: "admin", Name: "管理员", Email: "admin@example.com", Role: "admin", OrgID: 1, Status: "active", SystemAccount: true},
		{Username: "operator", Name: "运营管理员", Email: "operator@example.com", Role: "operator", OrgID: 4, Status: "active", SystemAccount: true},
		{Username: "viewer", Name: "只读成员", Email: "viewer@example.com", Role: "viewer", OrgID: 5, Status: "active", SystemAccount: true},
		{Username: "auditor", Name: "审计员", Email: "auditor@example.com", Role: "auditor", OrgID: 3, Status: "active", SystemAccount: true},
	}

	for index := range seeds {
		seeds[index].PasswordHash = defaultPasswordHash
		if seeds[index].Username == "admin" {
			seeds[index].PasswordHash = adminPasswordHash
		}
		var existing models.User
		result := db.Where("username = ?", seeds[index].Username).First(&existing)
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			if err := db.Create(&seeds[index]).Error; err != nil {
				return fmt.Errorf("seed user %s: %w", seeds[index].Username, err)
			}
			continue
		}
		if result.Error != nil {
			return fmt.Errorf("find seed user %s: %w", seeds[index].Username, result.Error)
		}
	}
	return nil
}

func seedTime(value string) *time.Time {
	parsed, err := time.ParseInLocation("2006-01-02 15:04:05", value, time.Local)
	if err != nil {
		return nil
	}
	return &parsed
}
