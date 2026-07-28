package routes

import (
	"kupola-app-backend/models"
)

type UserResponse struct {
	ID          int      `json:"id"`
	Username    string   `json:"username"`
	Name        string   `json:"name"`
	Email       string   `json:"email"`
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
	OrgID       int      `json:"orgId"`
	Status      string   `json:"status"`
	Phone       string   `json:"phone"`
	Address     string   `json:"address"`
	CreatedAt   string   `json:"createdAt"`
	LastLogin   string   `json:"lastLogin"`
}

func permissionsForRole(role string) []string {
	switch role {
	case "admin":
		return []string{
			"dashboard:view", "user:list", "user:view", "user:create", "user:edit", "user:delete",
			"organization:list", "organization:create", "organization:edit", "organization:delete",
			"permission:list", "permission:create", "permission:edit", "permission:assign", "permission:delete",
			"audit:list", "settings:list", "settings:dictionary", "settings:menu", "settings:permission",
		}
	case "operator":
		return []string{"dashboard:view", "user:list", "user:view", "user:create", "user:edit"}
	case "auditor":
		return []string{"dashboard:view", "permission:list"}
	default:
		return []string{"dashboard:view", "user:list", "user:view"}
	}
}

func userToResponse(user models.User) UserResponse {
	lastLogin := "-"
	if user.LastLogin != nil {
		lastLogin = user.LastLogin.Format("2006-01-02 15:04:05")
	}
	return UserResponse{
		ID:          responseUserID(user),
		Username:    user.Username,
		Name:        user.Name,
		Email:       user.Email,
		Role:        user.Role,
		Permissions: permissionsForRole(user.Role),
		OrgID:       user.OrgID,
		Status:      user.Status,
		Phone:       user.Phone,
		Address:     user.Address,
		CreatedAt:   user.CreatedAt.Format("2006-01-02 15:04:05"),
		LastLogin:   lastLogin,
	}
}

func responseUserID(user models.User) int {
	if user.SystemAccount {
		switch user.Username {
		case "admin":
			return 1
		case "operator":
			return 5
		case "viewer":
			return 3
		case "auditor":
			return 2
		}
	}
	return int(user.ID)
}

func currentUserID(c interface{ Get(string) (any, bool) }) (uint, bool) {
	value, ok := c.Get("user_id")
	if !ok {
		return 0, false
	}
	switch id := value.(type) {
	case int:
		if id > 0 {
			return uint(id), true
		}
	case uint:
		if id > 0 {
			return id, true
		}
	}
	return 0, false
}
