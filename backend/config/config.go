package config

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/spf13/viper"
)

type Config struct {
	ServerAddress string        `validate:"required"`
	GinMode       string        `validate:"oneof=debug release test"`
	DatabaseDSN   string        `validate:"required"`
	JWTSecret     string        `validate:"min=32"`
	JWTExpiration time.Duration `validate:"gt=0"`
	LogLevel      string        `validate:"oneof=trace debug info warn error fatal panic disabled"`
}

func LoadConfig(configFile string) (*Config, error) {
	viper.SetEnvPrefix("KUPOLA")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	viper.SetDefault("server.address", ":8080")
	viper.SetDefault("server.gin_mode", "release")
	viper.SetDefault("server.log_level", "info")
	viper.SetDefault("jwt.secret", "kupola-app-secret-key-2026-change-me")
	viper.SetDefault("jwt.expiration", "24h")
	viper.SetDefault("database.host", "127.0.0.1")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.user", "postgres")
	viper.SetDefault("database.password", "123456")
	viper.SetDefault("database.name", "kupola_app")
	viper.SetDefault("database.sslmode", "disable")
	viper.SetDefault("database.timezone", "Asia/Shanghai")

	if configFile != "" {
		viper.SetConfigFile(configFile)
	} else {
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")
		viper.AddConfigPath(".")
		viper.AddConfigPath("./config")
	}
	if err := viper.ReadInConfig(); err != nil {
		var notFound viper.ConfigFileNotFoundError
		if !errors.As(err, &notFound) {
			return nil, fmt.Errorf("read config: %w", err)
		}
	}

	dsn := viper.GetString("database.dsn")
	if dsn == "" {
		dsn = fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
			viper.GetString("database.host"),
			viper.GetInt("database.port"),
			viper.GetString("database.user"),
			viper.GetString("database.password"),
			viper.GetString("database.name"),
			viper.GetString("database.sslmode"),
			viper.GetString("database.timezone"),
		)
	}

	cfg := &Config{
		ServerAddress: viper.GetString("server.address"),
		GinMode:       viper.GetString("server.gin_mode"),
		DatabaseDSN:   dsn,
		JWTSecret:     viper.GetString("jwt.secret"),
		JWTExpiration: viper.GetDuration("jwt.expiration"),
		LogLevel:      viper.GetString("server.log_level"),
	}
	if err := validator.New().Struct(cfg); err != nil {
		return nil, fmt.Errorf("validate config: %w", err)
	}

	gin.SetMode(cfg.GinMode)
	return cfg, nil
}
