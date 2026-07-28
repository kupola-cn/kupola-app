package routes

import (
	"context"
	"net/http"

	"kupola-app-backend/config"
	"kupola-app-backend/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct {
	db     *gorm.DB
	config *config.Config
}

func NewHandler(db *gorm.DB, cfg *config.Config) *Handler {
	return &Handler{db: db, config: cfg}
}

func SetupRouter(db *gorm.DB, cfg *config.Config) *gin.Engine {
	handler := NewHandler(db, cfg)
	r := gin.New()
	r.Use(gin.Recovery(), middleware.RequestLogger(), CORSMiddleware())

	r.GET("/health", handler.Health)

	auth := r.Group("/api/auth")
	{
		auth.POST("/login", handler.Login)
		auth.GET("/me", middleware.AuthMiddleware(cfg), handler.GetUserInfo)
		auth.POST("/change-password", middleware.AuthMiddleware(cfg), handler.ChangePassword)
	}

	users := r.Group("/api/users", middleware.AuthMiddleware(cfg))
	{
		users.GET("", handler.GetUserList)
		users.GET("/:id", handler.GetUserById)
		users.POST("", handler.CreateUser)
		users.PUT("/:id", handler.UpdateUser)
		users.DELETE("/:id", handler.DeleteUser)
	}

	return r
}

func (h *Handler) Health(c *gin.Context) {
	sqlDB, err := h.db.DB()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"success": false, "message": "数据库不可用"})
		return
	}
	if err := sqlDB.PingContext(context.Background()); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"success": false, "message": "数据库不可用"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "status": "ok"})
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "X-Request-ID")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
