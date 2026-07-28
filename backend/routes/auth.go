package routes

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"kupola-app-backend/models"
	"kupola-app-backend/security"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=8"`
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "参数错误"})
		return
	}

	var user models.User
	err := h.db.WithContext(c.Request.Context()).Where("username = ?", strings.TrimSpace(req.Username)).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) || !security.CheckPassword(user.PasswordHash, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "用户名或密码错误"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "登录服务不可用"})
		return
	}
	if user.Status != "active" {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "用户当前不可登录"})
		return
	}

	now := time.Now()
	if err := h.db.WithContext(c.Request.Context()).Model(&user).Update("last_login", &now).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "更新登录时间失败"})
		return
	}
	user.LastLogin = &now

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(h.config.JWTExpiration).Unix(),
		"iat":      time.Now().Unix(),
	})
	tokenString, err := token.SignedString([]byte(h.config.JWTSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "生成token失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"token":   tokenString,
		"user":    userToResponse(user),
	})
}

func (h *Handler) GetUserInfo(c *gin.Context) {
	userID, ok := currentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "token无效"})
		return
	}

	var user models.User
	err := h.db.WithContext(c.Request.Context()).First(&user, userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "用户不存在"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取用户失败"})
		return
	}
	c.JSON(http.StatusOK, userToResponse(user))
}

func (h *Handler) ChangePassword(c *gin.Context) {
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "密码格式不正确"})
		return
	}
	userID, ok := currentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "token无效"})
		return
	}

	var user models.User
	if err := h.db.WithContext(c.Request.Context()).First(&user, userID).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "用户不存在"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取用户失败"})
		return
	}
	if !security.CheckPassword(user.PasswordHash, req.CurrentPassword) {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "当前密码不正确"})
		return
	}
	passwordHash, err := security.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "密码保存失败"})
		return
	}
	if err := h.db.WithContext(c.Request.Context()).Model(&user).Update("password_hash", passwordHash).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "密码保存失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "密码已修改"})
}
