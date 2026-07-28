package main

import (
	"fmt"
	"os"

	"kupola-app-backend/config"
	"kupola-app-backend/database"
	"kupola-app-backend/logging"
	"kupola-app-backend/routes"

	"github.com/spf13/cobra"
)

type application struct {
	configFile string
}

func main() {
	app := &application{}
	if err := app.command().Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func (app *application) command() *cobra.Command {
	root := &cobra.Command{
		Use:   "kupola-app-backend",
		Short: "Kupola App backend",
		RunE:  app.runServer,
	}
	root.PersistentFlags().StringVar(&app.configFile, "config", "", "config file path")
	root.AddCommand(
		&cobra.Command{Use: "server", Short: "start HTTP server", RunE: app.runServer},
		&cobra.Command{Use: "migrate", Short: "run database migrations", RunE: app.runMigrate},
		&cobra.Command{Use: "seed", Short: "seed initial users", RunE: app.runSeed},
	)
	return root
}

func (app *application) loadConfig() (*config.Config, error) {
	cfg, err := config.LoadConfig(app.configFile)
	if err != nil {
		return nil, err
	}
	if err := logging.Init(cfg.LogLevel); err != nil {
		return nil, fmt.Errorf("init logging: %w", err)
	}
	return cfg, nil
}

func (app *application) runServer(_ *cobra.Command, _ []string) error {
	cfg, err := app.loadConfig()
	if err != nil {
		return err
	}
	db, err := database.Open(cfg)
	if err != nil {
		return err
	}
	defer database.Close(db)
	if err := database.Migrate(db); err != nil {
		return fmt.Errorf("migrate database: %w", err)
	}
	if err := database.Seed(db); err != nil {
		return fmt.Errorf("seed database: %w", err)
	}

	r := routes.SetupRouter(db, cfg)
	logging.Logger.Info().Str("address", cfg.ServerAddress).Msg("HTTP server started")
	return r.Run(cfg.ServerAddress)
}

func (app *application) runMigrate(_ *cobra.Command, _ []string) error {
	cfg, err := app.loadConfig()
	if err != nil {
		return err
	}
	db, err := database.Open(cfg)
	if err != nil {
		return err
	}
	defer database.Close(db)
	if err := database.Migrate(db); err != nil {
		return fmt.Errorf("migrate database: %w", err)
	}
	logging.Logger.Info().Msg("database migration completed")
	return nil
}

func (app *application) runSeed(_ *cobra.Command, _ []string) error {
	cfg, err := app.loadConfig()
	if err != nil {
		return err
	}
	db, err := database.Open(cfg)
	if err != nil {
		return err
	}
	defer database.Close(db)
	if err := database.Migrate(db); err != nil {
		return fmt.Errorf("migrate database: %w", err)
	}
	if err := database.Seed(db); err != nil {
		return fmt.Errorf("seed database: %w", err)
	}
	logging.Logger.Info().Msg("database seed completed")
	return nil
}
