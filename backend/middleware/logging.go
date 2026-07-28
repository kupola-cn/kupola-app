package middleware

import (
	"strconv"
	"time"

	"kupola-app-backend/logging"

	"github.com/gin-gonic/gin"
)

func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = strconv.FormatInt(time.Now().UnixNano(), 10)
		}
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		startedAt := time.Now()
		c.Next()

		event := logging.Logger.Info()
		if c.Writer.Status() >= 500 {
			event = logging.Logger.Error()
		}
		event.Str("request_id", requestID).
			Str("method", c.Request.Method).
			Str("path", c.Request.URL.Path).
			Int("status", c.Writer.Status()).
			Int64("duration_ms", time.Since(startedAt).Milliseconds())
		if userID, ok := c.Get("user_id"); ok {
			event = event.Interface("user_id", userID)
		}
		if len(c.Errors) > 0 {
			event = event.AnErr("error", c.Errors.Last().Err)
		}
		event.Msg("http request")
	}
}
