package routes

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"kupola-app-backend/models"
	"kupola-app-backend/security"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserRequest struct {
	Name      string   `json:"name" binding:"required"`
	Email     string   `json:"email" binding:"required,email"`
	OrgID     int      `json:"orgId" binding:"required,gt=0"`
	Role      string   `json:"role"`
	RoleCodes []string `json:"roleCodes"`
	Status    string   `json:"status"`
	Phone     string   `json:"phone"`
	Address   string   `json:"address"`
}

func roleFromRequest(request UserRequest, fallback string) string {
	if len(request.RoleCodes) > 0 && strings.TrimSpace(request.RoleCodes[0]) != "" {
		return strings.TrimSpace(request.RoleCodes[0])
	}
	if strings.TrimSpace(request.Role) != "" {
		return strings.TrimSpace(request.Role)
	}
	return fallback
}

func normalizeStatus(status string, fallback string) string {
	if status == "inactive" || status == "locked" || status == "active" {
		return status
	}
	return fallback
}

func (h *Handler) GetUserList(c *gin.Context) {
	var records []models.User
	err := h.db.WithContext(c.Request.Context()).
		Where("system_account = ?", false).
		Order("id ASC").Find(&records).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取用户列表失败"})
		return
	}
	users := make([]UserResponse, 0, len(records))
	for _, user := range records {
		users = append(users, userToResponse(user))
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": users})
}

func (h *Handler) GetUserById(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID格式错误"})
		return
	}

	var user models.User
	err = h.db.WithContext(c.Request.Context()).Where("system_account = ?", false).First(&user, uint(id)).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "用户不存在"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取用户失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": userToResponse(user)})
}

func (h *Handler) CreateUser(c *gin.Context) {
	var request UserRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "用户参数错误"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(request.Email))
	var count int64
	if err := h.db.WithContext(c.Request.Context()).Model(&models.User{}).Where("LOWER(email) = ?", email).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "校验用户邮箱失败"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"success": false, "message": "该邮箱已存在"})
		return
	}

	passwordHash, err := security.HashPassword("123456")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "创建用户失败"})
		return
	}
	role := roleFromRequest(request, "viewer")
	user := models.User{
		Username:     fmt.Sprintf("user_%d", timeNowUnixNano()),
		PasswordHash: passwordHash,
		Name:         strings.TrimSpace(request.Name),
		Email:        email,
		Role:         role,
		OrgID:        request.OrgID,
		Status:       normalizeStatus(request.Status, "active"),
		Phone:        strings.TrimSpace(request.Phone),
		Address:      strings.TrimSpace(request.Address),
	}
	if err := h.db.WithContext(c.Request.Context()).Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "创建用户失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "创建成功", "data": userToResponse(user)})
}

func (h *Handler) UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID格式错误"})
		return
	}
	var request UserRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "用户参数错误"})
		return
	}

	var user models.User
	err = h.db.WithContext(c.Request.Context()).Where("system_account = ?", false).First(&user, uint(id)).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "用户不存在"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "获取用户失败"})
		return
	}
	email := strings.ToLower(strings.TrimSpace(request.Email))
	var count int64
	if err := h.db.WithContext(c.Request.Context()).Model(&models.User{}).
		Where("LOWER(email) = ? AND id <> ?", email, user.ID).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "校验用户邮箱失败"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"success": false, "message": "该邮箱已存在"})
		return
	}

	user.Name = strings.TrimSpace(request.Name)
	user.Email = email
	user.OrgID = request.OrgID
	user.Role = roleFromRequest(request, user.Role)
	user.Status = normalizeStatus(request.Status, user.Status)
	user.Phone = strings.TrimSpace(request.Phone)
	user.Address = strings.TrimSpace(request.Address)
	if err := h.db.WithContext(c.Request.Context()).Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "更新用户失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "更新成功", "data": userToResponse(user)})
}

func (h *Handler) DeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID格式错误"})
		return
	}
	result := h.db.WithContext(c.Request.Context()).Where("system_account = ?", false).Delete(&models.User{}, uint(id))
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "删除用户失败"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "用户不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "删除成功"})
}

func timeNowUnixNano() int64 {
	return time.Now().UnixNano()
}
