package logging

import (
	"os"

	"github.com/rs/zerolog"
)

var Logger = zerolog.Nop()

func Init(level string) error {
	parsedLevel, err := zerolog.ParseLevel(level)
	if err != nil {
		return err
	}
	zerolog.SetGlobalLevel(parsedLevel)
	Logger = zerolog.New(zerolog.ConsoleWriter{Out: os.Stdout}).With().Timestamp().Str("service", "kupola-app-backend").Logger()
	return nil
}
